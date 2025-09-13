import { Request, Response } from "express";
import { z } from "zod";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { isValidObjectId } from "mongoose";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z
    .enum(["active", "completed", "on-hold"])
    .optional()
    .default("active"),
  members: z
    .array(z.string().min(1, "Invalid member ID"))
    .optional()
    .default([]),
});

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find().populate(
      "members",
      "name email role"
    );
    const enrichedProjects = await Promise.all(
      projects.map(async (proj) => {
        const tasks = await Task.find({ project: proj._id });
        return {
          ...proj.toJSON(),
          tasksCount: tasks.length,
          completedTasks: tasks.filter((t) => t.status === "done").length,
        };
      })
    );
    res.json(enrichedProjects);
  } catch (err: any) {
    console.error("Error fetching projects:", err);
    res
      .status(500)
      .json({ message: "Error fetching projects", error: err.message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  const { success, error, data } = projectSchema.safeParse(req.body);
  console.log("Request data:", data);
  console.log("Request user:", req.user);
  if (!success) {
    return res
      .status(400)
      .json({ message: error?.issues[0].message || "Invalid data" });
  }

  if (!req.user?._id || !isValidObjectId(req.user._id)) {
    return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
  }

  const finalMembers: string[] =
    data.members.length > 0
      ? (data.members as string[])
      : [req.user._id.toString()];
  const invalidMembers = finalMembers.filter(
    (id: string) => !isValidObjectId(id)
  );
  if (invalidMembers.length > 0) {
    return res.status(400).json({
      message: "Invalid member IDs",
      invalidMembers,
      hint: "Member IDs must be valid MongoDB ObjectIds",
    });
  }

  try {
    const project = await Project.create({
      ...data,
      members: finalMembers,
    });
    console.log("Created project:", project);
    res.status(201).json(project);
  } catch (err: any) {
    console.error("Create project error:", err.name, err.message, err.stack);
    res
      .status(500)
      .json({ message: "Error creating project", error: err.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  const { success, error, data } = projectSchema.safeParse(req.body);
  if (!success) {
    return res
      .status(400)
      .json({ message: error?.issues[0].message || "Invalid data" });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  const invalidMembers = data.members.filter(
    (id: string) => !isValidObjectId(id)
  );
  if (invalidMembers.length > 0) {
    return res.status(400).json({
      message: "Invalid member IDs",
      invalidMembers,
      hint: "Member IDs must be valid MongoDB ObjectIds",
    });
  }

  try {
    const project = await Project.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err: any) {
    console.error("Update project error:", err);
    res
      .status(500)
      .json({ message: "Error updating project", error: err.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: "Project deleted" });
  } catch (err: any) {
    console.error("Delete project error:", err);
    res
      .status(500)
      .json({ message: "Error deleting project", error: err.message });
  }
};
