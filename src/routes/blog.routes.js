const express = require("express");
const defaultController = require("../controllers/blog.controller");

function createBlogRouter(controller = defaultController) {
    const router = express.Router();

    router.post("/", controller.createBlog);
    router.get("/", controller.getAllBlogs);
    router.get("/:id", controller.getBlogById);
    router.put("/:id", controller.updateBlog);
    router.delete("/:id", controller.deleteBlog);

    return router;
}

const defaultRouter = createBlogRouter(defaultController);
defaultRouter.createBlogRouter = createBlogRouter;

module.exports = defaultRouter;
