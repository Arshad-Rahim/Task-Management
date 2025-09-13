"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const taskController_1 = require("../controllers/taskController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10, // Max 10 files
    },
}).array("attachments", 10);
router.use(authMiddleware_1.protect);
router.get("/", taskController_1.getTasks);
router.post("/", authMiddleware_1.adminOnly, upload, taskController_1.createTask);
router.put("/:id", upload, taskController_1.updateTask);
router.delete("/:id", authMiddleware_1.adminOnly, taskController_1.deleteTask);
router.get("/:taskId/activitylogs", taskController_1.getActivityLogs);
router.get("/notifications", taskController_1.getNotifications);
router.put("/notifications/:id/read", taskController_1.markNotificationAsRead);
router.delete("/notifications/:id", taskController_1.deleteNotification);
exports.default = router;
