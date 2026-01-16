const Blog = require("../models/Blog");

/**
 * CREATE — POST /blogs
 */
exports.createBlog = async (req, res) => {
    try {
        const { title, body, author } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                message: "Title and body are required",
            });
        }

        const blog = await Blog.create({
            title,
            body,
            author,
        });

        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * READ ALL — GET /blogs
 */
exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * READ ONE — GET /blogs/:id
 */
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json(blog);
    } catch (error) {
        res.status(400).json({ message: "Invalid blog ID" });
    }
};

/**
 * UPDATE — PUT /blogs/:id
 */
exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json(blog);
    } catch (error) {
        res.status(400).json({ message: "Invalid blog ID" });
    }
};

/**
 * DELETE — DELETE /blogs/:id
 */
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Invalid blog ID" });
    }
};