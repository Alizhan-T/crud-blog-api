const mongoose = require("mongoose");
const Blog = require("../models/Blog");

function isValidId(id) {
    return mongoose.isValidObjectId(id);
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createBlogController(BlogModel = Blog) {
    /**
     * CREATE — POST /blogs
     */
    const createBlog = async (req, res, next) => {
        try {
            const payload = req.body && typeof req.body === "object" ? req.body : {};
            const { title, body, author } = payload;

            if (typeof title !== "string" || typeof body !== "string" || !title.trim() || !body.trim()) {
                return res.status(400).json({ message: "Title and body must be non-empty strings" });
            }

            if (author !== undefined && author !== null && typeof author !== "string") {
                return res.status(400).json({ message: "Author must be a string" });
            }

            const blog = await BlogModel.create({
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
     * READ ALL — GET /blogs?author=...&q=...&limit=...
     */
    const getAllBlogs = async (req, res, next) => {
        try {
            const filter = {};
            if (typeof req.query.author === "string" && req.query.author.trim()) {
                filter.author = new RegExp(escapeRegex(req.query.author.trim()), "i");
            }
            if (typeof req.query.q === "string" && req.query.q.trim()) {
                const regex = new RegExp(escapeRegex(req.query.q.trim()), "i");
                filter.$or = [{ title: regex }, { body: regex }];
            }

            let query = BlogModel.find(filter).sort({ createdAt: -1 });
            if (req.query.limit !== undefined) {
                const parsedLimit = Number(req.query.limit);
                if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
                    return res.status(400).json({ message: "Limit must be an integer between 1 and 100" });
                }
                if (typeof query.limit === "function") {
                    query = query.limit(parsedLimit);
                }
            }

            const blogs = await query;
            return res.json(blogs);
        } catch (error) {
            return next(error);
        }
    };

    /**
     * READ ONE — GET /blogs/:id
     */
    const getBlogById = async (req, res, next) => {
        try {
            if (!isValidId(req.params.id)) {
                return res.status(400).json({ message: "Invalid blog ID" });
            }

            const blog = await BlogModel.findById(req.params.id);
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
    const updateBlog = async (req, res, next) => {
        try {
            if (!isValidId(req.params.id)) {
                return res.status(400).json({ message: "Invalid blog ID" });
            }

            const payload = req.body && typeof req.body === "object" ? req.body : {};
            const updates = {};

            for (const field of ["title", "body", "author"]) {
                if (payload[field] !== undefined) {
                    if (typeof payload[field] !== "string") {
                        return res.status(400).json({ message: `Field '${field}' must be a string` });
                    }
                    const trimmed = payload[field].trim();
                    if ((field === "title" || field === "body") && !trimmed) {
                        return res.status(400).json({ message: `Field '${field}' cannot be empty` });
                    }
                    updates[field] = field === "author" && !trimmed ? "Anonymous" : trimmed;
                }
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ message: "No valid fields provided for update" });
            }

            const blog = await BlogModel.findByIdAndUpdate(req.params.id, updates, {
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
    const deleteBlog = async (req, res, next) => {
        try {
            if (!isValidId(req.params.id)) {
                return res.status(400).json({ message: "Invalid blog ID" });
            }

            const blog = await BlogModel.findByIdAndDelete(req.params.id);
            if (!blog) {
                return res.status(404).json({ message: "Blog not found" });
            }

            return res.json({ message: "Blog deleted successfully" });
        } catch (error) {
            return next(error);
        }
    };

    return {
        createBlog,
        getAllBlogs,
        getBlogById,
        updateBlog,
        deleteBlog,
    };
}

const defaultController = createBlogController(Blog);

module.exports = {
    ...defaultController,
    createBlogController,
    escapeRegex,
    isValidId,
};
