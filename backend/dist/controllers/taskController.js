"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markNotificationAsRead = exports.getNotifications = exports.getActivityLogs = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const zod_1 = require("zod");
const Task_1 = require("../models/Task");
const ActivityLog_1 = require("../models/ActivityLog");
const Project_1 = require("../models/Project");
const User_1 = require("../models/User");
const Notification_1 = require("../models/Notification");
const mongoose_1 = require("mongoose");
const app_1 = require("../app");
// Schema for creating a new task
const taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    assignee: zod_1.z.string().min(1, "Assignee ID is required"),
    status: zod_1.z.enum(["todo", "in-progress", "done"]).optional().default("todo"),
    priority: zod_1.z.enum(["low", "medium", "high"]).optional().default("medium"),
    deadline: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
    projectId: zod_1.z.string().min(1, "Project ID is required"),
});
// Schema for updating a task
const updateSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(1, "Title is required").optional(),
    description: zod_1.z.string().min(1, "Description is required").optional(),
    assignee: zod_1.z.string().min(1, "Assignee ID is required").optional(),
    status: zod_1.z.enum(["todo", "in-progress", "done"]).optional(),
    priority: zod_1.z.enum(["low", "medium", "high"]).optional(),
    deadline: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
        .optional(),
    projectId: zod_1.z.string().min(1, "Project ID is required").optional(),
})
    .strict();
const getTasks = async (req, res) => {
    try {
        const tasks = await Task_1.Task.find()
            .populate("assignee", "name email role")
            .populate("project", "title");
        const tasksWithId = tasks.map((task) => ({
            ...task.toObject(),
            id: task._id.toString(),
            assignee: {
                ...task.assignee.toObject(),
                id: task.assignee._id.toString(),
            },
            project: task.project
                ? {
                    ...task.project.toObject(),
                    id: task.project._id.toString(),
                }
                : null,
        }));
        res.json(tasksWithId);
    }
    catch (err) {
        console.error("Error fetching tasks:", err);
        res
            .status(500)
            .json({ message: "Error fetching tasks", error: err.message });
    }
};
exports.getTasks = getTasks;
const createTask = async (taskData, req, res) => {
    console.log("CreateTask input:", taskData);
    let isHttpRequest = !!(req && res);
    let userId = req?.user?._id?.toString();
    let taskInput;
    if (isHttpRequest) {
        taskInput = req.body;
        if (!userId || !(0, mongoose_1.isValidObjectId)(userId)) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Invalid user ID" });
        }
    }
    else {
        taskInput = taskData;
        userId = taskData.userId;
        if (!userId || !(0, mongoose_1.isValidObjectId)(userId)) {
            throw new Error("Unauthorized: Invalid user ID");
        }
    }
    const { success, data, error } = taskSchema.safeParse(taskInput);
    if (!success) {
        if (isHttpRequest) {
            return res
                .status(400)
                .json({ message: "Invalid data", errors: error?.issues });
        }
        throw new Error(JSON.stringify({ message: "Invalid data", errors: error?.issues }));
    }
    if (!(0, mongoose_1.isValidObjectId)(data.assignee)) {
        if (isHttpRequest) {
            return res.status(400).json({ message: "Invalid assignee ID" });
        }
        throw new Error("Invalid assignee ID");
    }
    if (!(0, mongoose_1.isValidObjectId)(data.projectId)) {
        if (isHttpRequest) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        throw new Error("Invalid project ID");
    }
    const assigneeExists = await User_1.User.findById(data.assignee);
    if (!assigneeExists) {
        if (isHttpRequest) {
            return res.status(400).json({ message: "Assignee not found" });
        }
        throw new Error("Assignee not found");
    }
    const projectExists = await Project_1.Project.findById(data.projectId);
    if (!projectExists) {
        if (isHttpRequest) {
            return res.status(400).json({ message: "Project not found" });
        }
        throw new Error("Project not found");
    }
    try {
        const task = await Task_1.Task.create({
            ...data,
            project: data.projectId,
        });
        await ActivityLog_1.ActivityLog.create({
            task: task._id,
            user: userId,
            action: "created",
            details: `Task created and assigned to ${assigneeExists.name}`,
        });
        const notification = await Notification_1.Notification.create({
            userId: data.assignee,
            title: "New Task Assigned",
            message: `You have been assigned a new task: "${data.title}" in project "${projectExists.title}".`,
            type: "info",
            read: false,
        });
        const populatedTask = await Task_1.Task.findById(task._id)
            .populate("assignee", "name email role")
            .populate("project", "title");
        if (!populatedTask) {
            if (isHttpRequest) {
                return res
                    .status(500)
                    .json({ message: "Failed to retrieve created task" });
            }
            throw new Error("Failed to retrieve created task");
        }
        const taskResponse = {
            ...populatedTask.toObject(),
            id: populatedTask._id.toString(),
            assignee: {
                ...populatedTask.assignee.toObject(),
                id: populatedTask.assignee._id.toString(),
            },
            project: {
                ...populatedTask.project.toObject(),
                id: populatedTask.project._id.toString(),
            },
        };
        app_1.io.to(data.projectId).emit("taskAdded", taskResponse);
        app_1.io.to(data.assignee).emit("notificationAdded", {
            ...notification.toObject(),
            id: notification._id.toString(),
        });
        if (isHttpRequest) {
            res.status(201).json(taskResponse);
        }
        return taskResponse;
    }
    catch (err) {
        if (isHttpRequest) {
            res
                .status(500)
                .json({ message: "Error creating task", error: err.message });
        }
        throw err;
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    if (!req.user?._id || !(0, mongoose_1.isValidObjectId)(req.user._id)) {
        return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
    }
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(400).json({ message: "Invalid task ID" });
    }
    const { success, data, error } = updateSchema.safeParse(req.body);
    if (!success) {
        return res
            .status(400)
            .json({ message: "Invalid data", errors: error?.issues });
    }
    const task = await Task_1.Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "admin" &&
        task.assignee.toString() !== req.user._id.toString()) {
        return res
            .status(403)
            .json({ message: "Not authorized to update this task" });
    }
    if (data.assignee) {
        if (!(0, mongoose_1.isValidObjectId)(data.assignee)) {
            return res.status(400).json({ message: "Invalid assignee ID" });
        }
        const assigneeExists = await User_1.User.findById(data.assignee);
        if (!assigneeExists) {
            return res.status(400).json({ message: "Assignee not found" });
        }
    }
    if (data.projectId) {
        if (!(0, mongoose_1.isValidObjectId)(data.projectId)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        const projectExists = await Project_1.Project.findById(data.projectId);
        if (!projectExists) {
            return res.status(400).json({ message: "Project not found" });
        }
    }
    const updateData = {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined
            ? { description: data.description }
            : {}),
        ...(data.assignee !== undefined ? { assignee: data.assignee } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
        ...(data.projectId !== undefined ? { project: data.projectId } : {}),
    };
    try {
        const updatedTask = await Task_1.Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate("assignee", "name email role")
            .populate("project", "title");
        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }
        let action = "updated";
        let details = "Task updated";
        if (data.status && data.status !== task.status) {
            action = "status_changed";
            details = `Status changed to ${data.status}`;
        }
        else if (data.assignee && data.assignee !== task.assignee.toString()) {
            const newAssignee = await User_1.User.findById(data.assignee);
            details = `Assignee changed to ${newAssignee?.name || "Unknown"}`;
        }
        await ActivityLog_1.ActivityLog.create({
            task: req.params.id,
            user: req.user._id,
            action,
            details,
        });
        const taskResponse = {
            ...updatedTask.toObject(),
            id: updatedTask._id.toString(),
            assignee: {
                ...updatedTask.assignee.toObject(),
                id: updatedTask.assignee._id.toString(),
            },
            project: {
                ...updatedTask.project.toObject(),
                id: updatedTask.project._id.toString(),
            },
        };
        app_1.io.to(updatedTask.project.toString()).emit("taskUpdated", taskResponse);
        res.json(taskResponse);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error updating task", error: err.message });
    }
};
exports.updateTask = updateTask;
// 🔹 Updated deleteTask to support both Express + Socket calls
const deleteTask = async (reqOrId, res) => {
    let taskId;
    if (typeof reqOrId !== "string") {
        taskId = reqOrId.params?.id;
    }
    else {
        taskId = reqOrId;
    }
    if (!taskId || !(0, mongoose_1.isValidObjectId)(taskId)) {
        if (res) {
            return res.status(400).json({ message: "Invalid task ID" });
        }
        throw new Error("Invalid task ID");
    }
    try {
        const task = await Task_1.Task.findById(taskId);
        if (!task) {
            if (res) {
                return res.status(404).json({ message: "Task not found" });
            }
            throw new Error("Task not found");
        }
        await Task_1.Task.findByIdAndDelete(taskId);
        await ActivityLog_1.ActivityLog.deleteMany({ task: taskId });
        app_1.io.to(task.project.toString()).emit("taskDeleted", { taskId });
        if (res) {
            return res.json({ message: "Task deleted" });
        }
        return { message: "Task deleted" };
    }
    catch (err) {
        if (res) {
            return res
                .status(500)
                .json({ message: "Error deleting task", error: err.message });
        }
        throw err;
    }
};
exports.deleteTask = deleteTask;
const getActivityLogs = async (req, res) => {
    if (!(0, mongoose_1.isValidObjectId)(req.params.taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
    }
    try {
        const logs = await ActivityLog_1.ActivityLog.find({ task: req.params.taskId }).populate("user", "name");
        res.json(logs);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error fetching activity logs", error: err.message });
    }
};
exports.getActivityLogs = getActivityLogs;
const getNotifications = async (req, res) => {
    if (!req.user?._id || !(0, mongoose_1.isValidObjectId)(req.user._id)) {
        return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
    }
    try {
        const notifications = await Notification_1.Notification.find({
            userId: req.user._id,
        }).sort({ createdAt: -1 });
        const notificationsWithId = notifications.map((notification) => ({
            ...notification.toObject(),
            id: notification._id.toString(),
        }));
        res.json(notificationsWithId);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error fetching notifications", error: err.message });
    }
};
exports.getNotifications = getNotifications;
const markNotificationAsRead = async (req, res) => {
    if (!req.user?._id || !(0, mongoose_1.isValidObjectId)(req.user._id)) {
        return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
    }
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(400).json({ message: "Invalid notification ID" });
    }
    try {
        const notification = await Notification_1.Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to update this notification" });
        }
        notification.read = true;
        await notification.save();
        res.json({
            ...notification.toObject(),
            id: notification._id.toString(),
        });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error updating notification", error: err.message });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const deleteNotification = async (req, res) => {
    if (!req.user?._id || !(0, mongoose_1.isValidObjectId)(req.user._id)) {
        return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
    }
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(400).json({ message: "Invalid notification ID" });
    }
    try {
        const notification = await Notification_1.Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res
                .status(403)
                .json({ message: "Not authorized to delete this notification" });
        }
        await Notification_1.Notification.findByIdAndDelete(req.params.id);
        res.json({ message: "Notification deleted" });
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Error deleting notification", error: err.message });
    }
};
exports.deleteNotification = deleteNotification;
