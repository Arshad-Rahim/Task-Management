import express, { Application } from "express";
import cors from "cors";
import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import userRoutes from "./routes/userRoutes";
import { errorHandler } from "./middlewares/errorMiddleware";
import { setupSocket } from "./services/socketService";
import { verifyToken } from "./middlewares/authMiddleware";

const allowedOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:5173",
  "http://localhost:3000",
  "https://task-management-iota-dusky.vercel.app",
];

export let io: SocketServer;

export const createApp = (): { app: Application; server: HttpServer } => {
  const app = express();
  const server = new HttpServer(app);

  io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        console.log("Socket.IO CORS origin:", origin); // Debug
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const payload = await verifyToken(token);
      socket.data.user = payload;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  setupSocket(io);

  // Handle preflight requests globally
  app.options('*', cors({
    origin: (origin, callback) => {
      console.log("Preflight CORS origin:", origin); // Debug
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));

  app.use(
    cors({
      origin: (origin, callback) => {
        console.log("HTTP CORS origin:", origin); // Debug
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/users", userRoutes);

  app.use(errorHandler);

  return { app, server };
};
