import { Request, Response } from "express";
import { z } from "zod";
import { Task, ITask } from "../models/Task";
import { ActivityLog } from "../models/ActivityLog";
import { Project } from "../models/Project";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import { isValidObjectId } from "mongoose";
import { io } from "../app";

// Schema for creating a new task
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  assignee: z.string().min(1, "Assignee ID is required"),
  status: z.enum(["todo", "in-progress", "done"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  projectId: z.string().min(1, "Project ID is required"),
});

// Schema for updating a task
const updateSchema = z
  .object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
    assignee: z.string().min(1, "Assignee ID is required").optional(),
    status: z.enum(["todo", "in-progress", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    deadline: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
      .optional(),
    projectId: z.string().min(1, "Project ID is required").optional(),
  })
  .strict();

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find()
      .populate("assignee", "name email role")
      .populate("project", "title");

    const tasksWithId = tasks.map((task: ITask) => ({
      ...task.toObject(),
      id: task._id.toString(),
      assignee: {
        ...(task.assignee as any).toObject(),
        id: (task.assignee as any)._id.toString(),
      },
      project: task.project
        ? {
            ...(task.project as any).toObject(),
            id: (task.project as any)._id.toString(),
          }
        : null,
    }));

    res.json(tasksWithId);
  } catch (err: any) {
    console.error("Error fetching tasks:", err);
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: err.message });
  }
};

export const createTask = async (
  taskData: any,
  req?: Request,
  res?: Response
) => {
  console.log("CreateTask input:", taskData);

  let isHttpRequest = !!(req && res);
  let userId: string | undefined = req?.user?._id?.toString();
  let taskInput: any;

  if (isHttpRequest) {
    taskInput = req!.body;

    if (!userId || !isValidObjectId(userId)) {
      return res!
        .status(401)
        .json({ message: "Unauthorized: Invalid user ID" });
    }
  } else {
    taskInput = taskData;
    userId = taskData.userId;
    if (!userId || !isValidObjectId(userId)) {
      throw new Error("Unauthorized: Invalid user ID");
    }
  }

  const { success, data, error } = taskSchema.safeParse(taskInput);
  if (!success) {
    if (isHttpRequest) {
      return res!
        .status(400)
        .json({ message: "Invalid data", errors: error?.issues });
    }
    throw new Error(
      JSON.stringify({ message: "Invalid data", errors: error?.issues })
    );
  }

  if (!isValidObjectId(data.assignee)) {
    if (isHttpRequest) {
      return res!.status(400).json({ message: "Invalid assignee ID" });
    }
    throw new Error("Invalid assignee ID");
  }

  if (!isValidObjectId(data.projectId)) {
    if (isHttpRequest) {
      return res!.status(400).json({ message: "Invalid project ID" });
    }
    throw new Error("Invalid project ID");
  }

  const assigneeExists = await User.findById(data.assignee);
  if (!assigneeExists) {
    if (isHttpRequest) {
      return res!.status(400).json({ message: "Assignee not found" });
    }
    throw new Error("Assignee not found");
  }

  const projectExists = await Project.findById(data.projectId);
  if (!projectExists) {
    if (isHttpRequest) {
      return res!.status(400).json({ message: "Project not found" });
    }
    throw new Error("Project not found");
  }

  try {
    const task: ITask = await Task.create({
      ...data,
      project: data.projectId,
    });

    await ActivityLog.create({
      task: task._id,
      user: userId,
      action: "created",
      details: `Task created and assigned to ${assigneeExists.name}`,
    });

    const notification = await Notification.create({
      userId: data.assignee,
      title: "New Task Assigned",
      message: `You have been assigned a new task: "${data.title}" in project "${projectExists.title}".`,
      type: "info",
      read: false,
    });

    const populatedTask: ITask | null = await Task.findById(task._id)
      .populate("assignee", "name email role")
      .populate("project", "title");

    if (!populatedTask) {
      if (isHttpRequest) {
        return res!
          .status(500)
          .json({ message: "Failed to retrieve created task" });
      }
      throw new Error("Failed to retrieve created task");
    }

    const taskResponse = {
      ...populatedTask.toObject(),
      id: populatedTask._id.toString(),
      assignee: {
        ...(populatedTask.assignee as any).toObject(),
        id: (populatedTask.assignee as any)._id.toString(),
      },
      project: {
        ...(populatedTask.project as any).toObject(),
        id: (populatedTask.project as any)._id.toString(),
      },
    };

    io.to(data.projectId).emit("taskAdded", taskResponse);

    io.to(data.assignee).emit("notificationAdded", {
      ...notification.toObject(),
      id: notification._id.toString(),
    });

    if (isHttpRequest) {
      res!.status(201).json(taskResponse);
    }
    return taskResponse;
  } catch (err: any) {
    if (isHttpRequest) {
      res!
        .status(500)
        .json({ message: "Error creating task", error: err.message });
    }
    throw err;
  }
};

export const updateTask = async (req: Request, res: Response) => {
  if (!req.user?._id || !isValidObjectId(req.user._id)) {
    return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  const { success, data, error } = updateSchema.safeParse(req.body);
  if (!success) {
    return res
      .status(400)
      .json({ message: "Invalid data", errors: error?.issues });
  }

  const task: ITask | null = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (
    req.user.role !== "admin" &&
    task.assignee.toString() !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ message: "Not authorized to update this task" });
  }

  if (data.assignee) {
    if (!isValidObjectId(data.assignee)) {
      return res.status(400).json({ message: "Invalid assignee ID" });
    }
    const assigneeExists = await User.findById(data.assignee);
    if (!assigneeExists) {
      return res.status(400).json({ message: "Assignee not found" });
    }
  }

  if (data.projectId) {
    if (!isValidObjectId(data.projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    const projectExists = await Project.findById(data.projectId);
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
    const updatedTask: ITask | null = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
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
    } else if (data.assignee && data.assignee !== task.assignee.toString()) {
      const newAssignee = await User.findById(data.assignee);
      details = `Assignee changed to ${newAssignee?.name || "Unknown"}`;
    }

    await ActivityLog.create({
      task: req.params.id,
      user: req.user._id,
      action,
      details,
    });

    const taskResponse = {
      ...updatedTask.toObject(),
      id: updatedTask._id.toString(),
      assignee: {
        ...(updatedTask.assignee as any).toObject(),
        id: (updatedTask.assignee as any)._id.toString(),
      },
      project: {
        ...(updatedTask.project as any).toObject(),
        id: (updatedTask.project as any)._id.toString(),
      },
    };

    io.to(updatedTask.project.toString()).emit("taskUpdated", taskResponse);

    res.json(taskResponse);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error updating task", error: err.message });
  }
};

// 🔹 Updated deleteTask to support both Express + Socket calls
export const deleteTask = async (reqOrId: Request | string, res?: Response) => {
  let taskId: string | undefined;

  if (typeof reqOrId !== "string") {
    taskId = reqOrId.params?.id;
  } else {
    taskId = reqOrId;
  }

  if (!taskId || !isValidObjectId(taskId)) {
    if (res) {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    throw new Error("Invalid task ID");
  }

  try {
    const task: ITask | null = await Task.findById(taskId);
    if (!task) {
      if (res) {
        return res.status(404).json({ message: "Task not found" });
      }
      throw new Error("Task not found");
    }

    await Task.findByIdAndDelete(taskId);
    await ActivityLog.deleteMany({ task: taskId });

    io.to(task.project.toString()).emit("taskDeleted", { taskId });

    if (res) {
      return res.json({ message: "Task deleted" });
    }
    return { message: "Task deleted" };
  } catch (err: any) {
    if (res) {
      return res
        .status(500)
        .json({ message: "Error deleting task", error: err.message });
    }
    throw err;
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  if (!isValidObjectId(req.params.taskId)) {
    return res.status(400).json({ message: "Invalid task ID" });
  }

  try {
    const logs = await ActivityLog.find({ task: req.params.taskId }).populate(
      "user",
      "name"
    );
    res.json(logs);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching activity logs", error: err.message });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  if (!req.user?._id || !isValidObjectId(req.user._id)) {
    return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
  }

  try {
    const notifications = await Notification.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    const notificationsWithId = notifications.map((notification) => ({
      ...notification.toObject(),
      id: notification._id.toString(),
    }));

    res.json(notificationsWithId);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: err.message });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  if (!req.user?._id || !isValidObjectId(req.user._id)) {
    return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification ID" });
  }

  try {
    const notification = await Notification.findById(req.params.id);
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
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error updating notification", error: err.message });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  if (!req.user?._id || !isValidObjectId(req.user._id)) {
    return res.status(401).json({ message: "Unauthorized: Invalid user ID" });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification ID" });
  }

  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this notification" });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error deleting notification", error: err.message });
  }
};
