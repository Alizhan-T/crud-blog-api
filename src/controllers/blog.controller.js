const mongoose = require("mongoose");
const Blog = require("../models/Blog");

function isValidId(id) {
    return mongoose.isValidObjectId(id);
}

/**
 * CREATE — POST /blogs
 */
exports.createBlog = async (req, res, next) => {
    try {
        const { title, body, author } = req.body;

        if (!title || !title.trim() || !body || !body.trim()) {
            return res.status(400).json({ message: "Title and body are required" });
        }

        const blog = await Blog.create({
            title: title.trim(),
            body: body.trim(),
            author: author && author.trim() ? author.trim() : undefined,
        });

        return res.status(201).json(blog);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
};

/**
 * READ ALL — GET /blogs?author=...&q=...
 */
exports.getAllBlogs = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.author) {
            filter.author = new RegExp(req.query.author.trim(), "i");
        }
        if (req.query.q) {
            const regex = new RegExp(req.query.q.trim(), "i");
            filter.$or = [{ title: regex }, { body: regex }];
        }

        const blogs = await Blog.find(filter).sort({ createdAt: -1 });
        return res.json(blogs);
    } catch (error) {
        return next(error);
    }
};

/**
 * READ ONE — GET /blogs/:id
 */
exports.getBlogById = async (req, res, next) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid blog ID" });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        return res.json(blog);
    } catch (error) {
        return next(error);
    }
};

/**
 * UPDATE — PUT /blogs/:id
 */
exports.updateBlog = async (req, res, next) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid blog ID" });
        }

        const updates = {};
        if (typeof req.body.title === "string") updates.title = req.body.title.trim();
        if (typeof req.body.body === "string") updates.body = req.body.body.trim();
        if (typeof req.body.author === "string") updates.author = req.body.author.trim();

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided for update" });
        }

        const blog = await Blog.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        return res.json(blog);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
};

/**
 * DELETE — DELETE /blogs/:id
 */
exports.deleteBlog = async (req, res, next) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid blog ID" });
        }

        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        return res.json({ message: "Blog deleted successfully" });
    } catch (error) {
        return next(error);
    }
};
