const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [2, "Title must be at least 2 characters"],
            maxlength: [160, "Title cannot exceed 160 characters"],
        },
        body: {
            type: String,
            required: [true, "Body is required"],
            trim: true,
            minlength: [5, "Body must be at least 5 characters"],
        },
        author: {
            type: String,
            default: "Anonymous",
            trim: true,
            maxlength: [80, "Author name cannot exceed 80 characters"],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
