"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const app_1 = require("./app");
const cronJobs_1 = require("./utils/cronJobs");
dotenv_1.default.config();
const startServer = async () => {
    try {
        await (0, db_1.connectDB)();
        const { server } = (0, app_1.createApp)();
        const PORT = process.env.PORT || 5000;
        (0, cronJobs_1.setupCronJobs)();
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
