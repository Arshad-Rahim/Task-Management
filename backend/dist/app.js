"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const socketService_1 = require("./services/socketService");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const allowedOrigins = [
    process.env.CORS_ORIGIN || "http://localhost:5173",
    "http://localhost:3000",
    "https://task-management-iota-dusky.vercel.app",
];
const createApp = () => {
    const app = (0, express_1.default)();
    const server = new http_1.Server(app);
    exports.io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                console.log("Socket.IO CORS origin:", origin); // Debug
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    exports.io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }
        try {
            const payload = await (0, authMiddleware_1.verifyToken)(token);
            socket.data.user = payload;
            next();
        }
        catch (error) {
            next(new Error("Authentication error: Invalid token"));
        }
    });
    (0, socketService_1.setupSocket)(exports.io);
    // Handle preflight requests globally
    app.options('*', (0, cors_1.default)({
        origin: (origin, callback) => {
            console.log("Preflight CORS origin:", origin); // Debug
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }));
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            console.log("HTTP CORS origin:", origin); // Debug
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use("/api/auth", authRoutes_1.default);
    app.use("/api/projects", projectRoutes_1.default);
    app.use("/api/tasks", taskRoutes_1.default);
    app.use("/api/users", userRoutes_1.default);
    app.use(errorMiddleware_1.errorHandler);
    return { app, server };
};
exports.createApp = createApp;
