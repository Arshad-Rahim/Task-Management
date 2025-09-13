import { Router } from "express";
import multer from "multer";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getActivityLogs,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/taskController";
import { protect, adminOnly } from "../middlewares/authMiddleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Max 10 files
  },
}).array("attachments", 10);

router.use(protect);
router.get("/", getTasks);
router.post("/", adminOnly, upload, createTask);
router.put("/:id", upload, updateTask);
router.delete("/:id", adminOnly, deleteTask);
router.get("/:taskId/activitylogs", getActivityLogs);
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markNotificationAsRead);
router.delete("/notifications/:id", deleteNotification);

export default router;
