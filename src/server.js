require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
    if (!MONGO_URI) {
        console.error("Missing MONGO_URI environment variable. Copy .env.example to .env and configure it.");
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected");

        const server = app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

        const shutdown = async () => {
            console.log("\nShutting down gracefully...");
            server.close(async () => {
                await mongoose.connection.close();
                process.exit(0);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        console.error("Startup error:", error.message);
        process.exit(1);
    }
}

start();
