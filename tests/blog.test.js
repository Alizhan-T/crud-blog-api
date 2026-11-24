const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { createApp } = require("../src/app");
const { escapeRegex } = require("../src/controllers/blog.controller");

function createInMemoryBlogModel() {
    const store = [];

    return {
        async create(doc) {
            if (doc.title.length < 2) {
                const err = new Error("Title must be at least 2 characters");
                err.name = "ValidationError";
                throw err;
            }
            if (doc.body.length < 5) {
                const err = new Error("Body must be at least 5 characters");
                err.name = "ValidationError";
                throw err;
            }
            const item = {
                _id: new mongoose.Types.ObjectId().toString(),
                title: doc.title,
                body: doc.body,
                author: doc.author || "Anonymous",
                createdAt: new Date(Date.now() + store.length * 1000).toISOString(),
                updatedAt: new Date(Date.now() + store.length * 1000).toISOString(),
            };
            store.push(item);
            return item;
        },

        find(filter = {}) {
            const matched = store.filter((item) => {
                if (filter.author && !filter.author.test(item.author)) return false;
                if (filter.$or) {
                    const hit = filter.$or.some((clause) => {
                        if (clause.title) return clause.title.test(item.title);
                        if (clause.body) return clause.body.test(item.body);
                        return false;
                    });
                    if (!hit) return false;
                }
                return true;
            });

            let result = [...matched];
            const chain = {
                sort() {
                    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                    return chain;
                },
                limit(n) {
                    result = result.slice(0, n);
                    return chain;
                },
                then(resolve, reject) {
                    return Promise.resolve(result).then(resolve, reject);
                },
            };
            return chain;
        },

        async findById(id) {
            return store.find((item) => item._id === id) || null;
        },

        async findByIdAndUpdate(id, updates) {
            const idx = store.findIndex((item) => item._id === id);
            if (idx === -1) return null;
            if (updates.title !== undefined && updates.title.length < 2) {
                const err = new Error("Title must be at least 2 characters");
                err.name = "ValidationError";
                throw err;
            }
            store[idx] = { ...store[idx], ...updates, updatedAt: new Date().toISOString() };
            return store[idx];
        },

        async findByIdAndDelete(id) {
            const idx = store.findIndex((item) => item._id === id);
            if (idx === -1) return null;
            const [removed] = store.splice(idx, 1);
            return removed;
        },
    };
}

describe("Controller helpers", () => {
    it("escapes regex metacharacters safely to prevent ReDoS/SyntaxError", () => {
        const escaped = escapeRegex("[test](a+)+$");
        assert.equal(escaped, "\\[test\\]\\(a\\+\\)\\+\\$");
        assert.doesNotThrow(() => new RegExp(escaped, "i"));
    });
});

describe("CRUD Blog API HTTP integration tests", () => {
    let server;
    let baseUrl;
    let createdId;

    before(async () => {
        const app = createApp({ blogModel: createInMemoryBlogModel() });
        await new Promise((resolve) => {
            server = app.listen(0, "127.0.0.1", () => {
                baseUrl = `http://127.0.0.1:${server.address().port}`;
                resolve();
            });
        });
    });

    after(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    it("GET /health returns service health metadata", async () => {
        const res = await fetch(`${baseUrl}/health`);
        const data = await res.json();
        assert.equal(res.status, 200);
        assert.equal(data.status, "ok");
        assert.equal(data.service, "crud-blog-api");
        assert.equal(typeof data.uptime, "number");
    });

    it("POST /blogs validates input types, rejects malformed JSON with 400, and creates posts", async () => {
        const badJson = await fetch(`${baseUrl}/blogs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: '{"title": "Broken',
        });
        assert.equal(badJson.status, 400);
        assert.deepEqual(await badJson.json(), { message: "Invalid JSON payload" });

        const nonString = await fetch(`${baseUrl}/blogs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: 12345, body: "Valid body text" }),
        });
        assert.equal(nonString.status, 400);

        const ok = await fetch(`${baseUrl}/blogs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Express 5 Architecture [Notes]",
                body: "Deep dive into async error handling and MVC routing.",
                author: "Alizhan",
            }),
        });
        const created = await ok.json();
        assert.equal(ok.status, 201);
        assert.equal(created.title, "Express 5 Architecture [Notes]");
        assert.equal(created.author, "Alizhan");
        assert.ok(created._id);
        createdId = created._id;
    });

    it("GET /blogs supports safe regex search (?q=[Notes]) and limit validation", async () => {
        const res = await fetch(`${baseUrl}/blogs?q=${encodeURIComponent("[Notes]")}&author=alizhan&limit=5`);
        const list = await res.json();
        assert.equal(res.status, 200);
        assert.equal(list.length, 1);
        assert.equal(list[0]._id, createdId);

        const badLimit = await fetch(`${baseUrl}/blogs?limit=999`);
        assert.equal(badLimit.status, 400);
    });

    it("GET /blogs/:id, PUT /blogs/:id, and DELETE /blogs/:id enforce ObjectId checks and CRUD semantics", async () => {
        const badId = await fetch(`${baseUrl}/blogs/not-an-object-id`);
        assert.equal(badId.status, 400);

        const missingId = new mongoose.Types.ObjectId().toString();
        const notFound = await fetch(`${baseUrl}/blogs/${missingId}`);
        assert.equal(notFound.status, 404);

        const one = await fetch(`${baseUrl}/blogs/${createdId}`);
        assert.equal(one.status, 200);
        assert.equal((await one.json())._id, createdId);

        const badUpdate = await fetch(`${baseUrl}/blogs/${createdId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: 42 }),
        });
        assert.equal(badUpdate.status, 400);

        const updated = await fetch(`${baseUrl}/blogs/${createdId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Express 5 Production Guide" }),
        });
        assert.equal(updated.status, 200);
        assert.equal((await updated.json()).title, "Express 5 Production Guide");

        const del = await fetch(`${baseUrl}/blogs/${createdId}`, { method: "DELETE" });
        assert.equal(del.status, 200);
        assert.deepEqual(await del.json(), { message: "Blog deleted successfully" });

        const afterDel = await fetch(`${baseUrl}/blogs/${createdId}`);
        assert.equal(afterDel.status, 404);
    });
});
