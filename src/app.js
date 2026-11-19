const path = require("path");
const express = require("express");
const cors = require("cors");
const blogRoutes = require("./routes/blog.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: Math.round(process.uptime()) });
});

app.use("/blogs", blogRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal server error" });
});

module.exports = app;
