const express = require("express");
const app = express();
const blogRoutes = require("./routes/blog.routes");
const path = require("path");

app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));
app.use("/blogs", blogRoutes);

app.get("/", (req, res) => {
    res.json({ message: "API is running" });
});

module.exports = app;