import { Router } from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController";
import { protect, adminOnly } from "../middlewares/authMiddleware";

const router = Router();

router.use(protect);
router.get("/", getProjects);
router.post("/", adminOnly, createProject);
router.put("/:id", adminOnly, updateProject);
router.delete("/:id", adminOnly, deleteProject);

export default router;
