"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjects = void 0;
const zod_1 = require("zod");
const Project_1 = require("../models/Project");
const Task_1 = require("../models/Task");
const mongoose_1 = require("mongoose");
const projectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    status: zod_1.z
        .enum(["active", "completed", "on-hold"])
        .optional()
        .default("active"),
    members: zod_1.z
        .array(zod_1.z.string().min(1, "Invalid member ID"))
        .optional()
        .default([]),
});
const getProjects = async (req, res) => {
    try {
        const projects = await Project_1.Project.find().populate("members", "name email role");
        const enrichedProjects = await Promise.all(projects.map(async (proj) => {
            const tasks = await Task_1.Task.find({ project: proj._id });
            return {
                ...proj.toJSON(),
                tasksCount: tasks.length,
                completedTasks: tasks.filter((t) => t.status === "done").length,
            };
        }));
        res.json(enrichedProjects);
    }
    catch (err) {
        console.error("Error fetching projects:", err);
        res
            .status(500)
            .json({ message: "Error fetching projects", error: err.message });
    }
};
exports.getProjects = getProjects;
const createProject = async (req, res) => {
    const { success, error, data } = projectSchema.safeParse(req.body);
    console.log("Request data:", data);
    console.log("Request user:", req.user);
    if (!success) {
        return res
            .status(400)
            .json({ message: error?.issues[0].message || "Invalid data" });
    }
    if (!req.user?._id || !(0, mongoose_1.isValidObjectId)(req.user._id)) {
        return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
    }
    const finalMembers = data.members.length > 0
        ? data.members
        : [req.user._id.toString()];
    const invalidMembers = finalMembers.filter((id) => !(0, mongoose_1.isValidObjectId)(id));
    if (invalidMembers.length > 0) {
        return res.status(400).json({
            message: "Invalid member IDs",
            invalidMembers,
            hint: "Member IDs must be valid MongoDB ObjectIds",
        });
    }
    try {
        const project = await Project_1.Project.create({
            ...data,
            members: finalMembers,
        });
        console.log("Created project:", project);
        res.status(201).json(project);
    }
    catch (err) {
        console.error("Create project error:", err.name, err.message, err.stack);
        res
            .status(500)
            .json({ message: "Error creating project", error: err.message });
    }
};
exports.createProject = createProject;
const updateProject = async (req, res) => {
    const { success, error, data } = projectSchema.safeParse(req.body);
    if (!success) {
        return res
            .status(400)
            .json({ message: error?.issues[0].message || "Invalid data" });
    }
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(400).json({ message: "Invalid project ID" });
    }
    const invalidMembers = data.members.filter((id) => !(0, mongoose_1.isValidObjectId)(id));
    if (invalidMembers.length > 0) {
        return res.status(400).json({
            message: "Invalid member IDs",
            invalidMembers,
            hint: "Member IDs must be valid MongoDB ObjectIds",
        });
    }
    try {
        const project = await Project_1.Project.findByIdAndUpdate(req.params.id, data, {
            new: true,
        });
        if (!project)
            return res.status(404).json({ message: "Project not found" });
        res.json(project);
    }
    catch (err) {
        console.error("Update project error:", err);
        res
            .status(500)
            .json({ message: "Error updating project", error: err.message });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(400).json({ message: "Invalid project ID" });
    }
    try {
        const project = await Project_1.Project.findByIdAndDelete(req.params.id);
        if (!project)
            return res.status(404).json({ message: "Project not found" });
        await Task_1.Task.deleteMany({ project: req.params.id });
        res.json({ message: "Project deleted" });
    }
    catch (err) {
        console.error("Delete project error:", err);
        res
            .status(500)
            .json({ message: "Error deleting project", error: err.message });
    }
};
exports.deleteProject = deleteProject;
