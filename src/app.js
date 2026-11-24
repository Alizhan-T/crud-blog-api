const path = require("path");
const express = require("express");
const cors = require("cors");
const { createBlogController } = require("./controllers/blog.controller");
const { createBlogRouter } = require("./routes/blog.routes");

function createApp({ blogModel } = {}) {
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: "100kb" }));
    app.use(express.static(path.join(__dirname, "../public")));

    app.get("/health", (req, res) => {
        res.json({
            status: "ok",
            service: "crud-blog-api",
            uptime: Math.round(process.uptime()),
        });
    });

    const controller = blogModel ? createBlogController(blogModel) : undefined;
    app.use("/blogs", createBlogRouter(controller));

    app.use((req, res) => {
        res.status(404).json({ message: "Route not found" });
    });

    app.use((err, req, res, next) => {
        if (err && (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400))) {
            return res.status(400).json({ message: "Invalid JSON payload" });
        }
        const status = err.statusCode || err.status || 500;
        if (status >= 500) {
            console.error(err);
        }
        return res.status(status).json({ message: err.message || "Internal server error" });
    });

    return app;
}

const app = createApp();
app.createApp = createApp;

module.exports = app;
