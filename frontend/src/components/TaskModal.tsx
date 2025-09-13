"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTaskStore } from "@/store/taskStore";
import { useActivityStore } from "@/store/activityStore";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { Task, User, Project } from "@/types";
import { Calendar, UserIcon, Clock, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import api from "@/api";
import { socket } from "@/lib/socket";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "create";
}

interface SocketResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export function TaskModal({ task, isOpen, onClose, mode }: TaskModalProps) {
  const { deleteTask, addTask } = useTaskStore();
  const { addActivity, getActivitiesByTask, fetchActivitiesByTask } =
    useActivityStore();
  const { user } = useAuthStore();
  const { initializeSocket: initializeNotificationSocket } =
    useNotificationStore();
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    deadline: "",
    assigneeId: "",
    projectId: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (user?.id && isOpen) {
      if (!socket.connected) {
        console.log("Connecting socket...");
        const token = localStorage.getItem("token");
        if (token) {
          socket.auth = { token };
        }
        socket.connect();
      }
      socket.emit("joinUser", user.id);
      initializeNotificationSocket();
    }

    return () => {};
  }, [user, isOpen, initializeNotificationSocket]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await api.get("/users");
        console.log("Fetched users:", response.data);
        setUsers(
          response.data.map((u: any) => ({
            ...u,
            id: u.id || u._id?.toString() || "",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError("Failed to load users. Please try again.");
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await api.get("/projects");
        console.log("Fetched projects:", response.data);
        setProjects(
          response.data.map((p: any) => ({
            ...p,
            id: p.id || p._id?.toString() || "",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setError("Failed to load projects. Please try again.");
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    if (user?.role === "admin") {
      fetchUsers();
      fetchProjects();
    } else {
      setLoadingUsers(false);
      setLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (task && isOpen && mode !== "create") {
        const taskId = task.id || task._id;
        if (!taskId) {
          setError("Task ID is missing.");
          return;
        }
        try {
          await fetchActivitiesByTask(taskId, (message) => setError(message));
        } catch (error) {
          setError("Failed to load activity logs. Please try again.");
        }
      }
    };
    fetchActivities();
  }, [task, isOpen, mode, fetchActivitiesByTask]);

  useEffect(() => {
    if (!isOpen) return;

    console.log("Initializing formData for mode:", mode, "task:", task);
    if (task && mode !== "create" && !isInitialized.current) {
      let assigneeId = "";
      if (typeof task.assignee === "string") {
        assigneeId = task.assignee;
      } else if (task.assignee && "id" in task.assignee) {
        assigneeId = task.assignee.id;
      }

      let projectId = "";
      if (typeof task.project === "string") {
        projectId = task.project;
      } else if (task.project && "id" in task.project && task.project.id) {
        projectId = task.project.id;
      } else if (task.projectId) {
        projectId = task.projectId;
      }

      console.log(
        "Extracted IDs – assigneeId:",
        assigneeId,
        "projectId:",
        projectId
      );

      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        deadline: task.deadline ? task.deadline.split("T")[0] : "",
        assigneeId,
        projectId,
      });
      isInitialized.current = true;
    } else if (mode === "create" && !isInitialized.current) {
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: "",
        assigneeId: users.length > 0 ? users[0].id : "",
        projectId: projects.length > 0 ? projects[0].id : "",
      });
      isInitialized.current = true;
    }
  }, [task, mode, users, projects, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      isInitialized.current = false;
      setError(null);
      setSaving(false);
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    console.log("Input change:", name, "=", value);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (saving) return;

    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!formData.assigneeId) {
      setError("Please select an assignee.");
      return;
    }
    if (!formData.projectId) {
      setError("Please select a project.");
      return;
    }
    if (!formData.deadline) {
      setError("Deadline is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const taskPayload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      assignee: formData.assigneeId,
      projectId: formData.projectId,
      deadline: new Date(formData.deadline).toISOString(),
      userId: user?.id || "",
    };

    try {
      let response: SocketResponse;
      if (mode === "create") {
        console.log("Creating task with payload:", taskPayload);
        console.log("[CREATE] Emitting createTask via Socket.IO");
        if (!socket.connected) {
          console.log("Socket not connected, attempting to connect...");
          const token = localStorage.getItem("token");
          if (token) {
            socket.auth = { token };
          }
          socket.connect();
          await new Promise<void>((resolve) => {
            socket.once("connect", () => {
              console.log("Socket connected successfully");
              resolve();
            });
            socket.once("connect_error", (err) => {
              console.error("Socket connection error:", err);
              resolve(); // Proceed to emit even if connection fails
            });
            setTimeout(() => {
              if (!socket.connected) {
                console.warn("Socket connection timeout, proceeding with emit");
                resolve();
              }
            }, 5000);
          });
        }
        response = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Socket request timed out"));
          }, 10000); // 10 second timeout
          socket.emit("createTask", taskPayload, (res: SocketResponse) => {
            clearTimeout(timeoutId);
            console.log("[CREATE] Socket.IO response:", res);
            if (res.success && res.task) {
              resolve(res);
            } else {
              reject(new Error(res.error || "Failed to create task"));
            }
          });
        });
        if (response.task) {
          addTask({
            ...response.task,
            id: response.task.id || response.task._id || "",
            assignee: {
              id: taskPayload.assignee,
              name:
                users.find((u) => u.id === taskPayload.assignee)?.name ||
                "Unknown",
            },
            projectId: taskPayload.projectId,
            createdAt: response.task.createdAt || new Date().toISOString(),
            updatedAt: response.task.updatedAt || new Date().toISOString(),
          });
          addActivity({
            taskId: response.task.id || response.task._id || "",
            userId: user?.id || "",
            action: "created",
            details: `Task created and assigned to ${
              users.find((u) => u.id === taskPayload.assignee)?.name ||
              "Unknown"
            }`,
          });
        }
        onClose();
      }
    } catch (error: any) {
      console.error(
        `[${mode.toUpperCase()}] Failed to save task:`,
        error.response?.data || error
      );
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save task. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) {
      setError("No task selected for deletion.");
      return;
    }

    const taskId = task.id || task._id;
    if (!taskId) {
      setError("Task ID is missing.");
      return;
    }

    let projectId = "";
    if (typeof task.project === "string") {
      projectId = task.project;
    } else if (task.project && "id" in task.project && task.project.id) {
      projectId = task.project.id;
    } else if (task.projectId) {
      projectId = task.projectId;
    }

    if (!projectId) {
      setError("Project ID is missing.");
      return;
    }

    if (!socket.connected) {
      console.log("Socket not connected, attempting to connect...");
      const token = localStorage.getItem("token");
      if (token) {
        socket.auth = { token };
      }
      socket.connect();
      await new Promise<void>((resolve) => {
        socket.once("connect", () => {
          console.log("Socket connected successfully");
          resolve();
        });
        socket.once("connect_error", (err) => {
          console.error("Socket connection error:", err);
          resolve(); // Proceed to emit even if connection fails
        });
        setTimeout(() => {
          if (!socket.connected) {
            console.warn("Socket connection timeout, proceeding with emit");
            resolve();
          }
        }, 5000);
      });
    }

    setSaving(true);
    try {
      console.log("Emitting deleteTask with payload:", { taskId, projectId });
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Socket request timed out"));
        }, 10000); // 10 second timeout
        socket.emit(
          "deleteTask",
          { taskId, projectId },
          (res: { success: boolean; error?: string }) => {
            clearTimeout(timeoutId);
            console.log("deleteTask response:", res);
            if (res.success) {
              resolve(res);
            } else {
              reject(new Error(res.error || "Failed to delete task"));
            }
          }
        );
      });

      deleteTask(taskId);
      addActivity({
        taskId,
        userId: user?.id || "",
        action: "deleted",
        details: `Task "${task.title}" deleted`,
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      setError(error.message || "Failed to delete task. Please try again.");
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    onClose();
    setError(null);
  };

  const taskActivities =
    task && (task.id || task._id)
      ? getActivitiesByTask(task.id || task._id || "")
      : [];
  const isCreating = mode === "create";
  const isAdmin = user?.role === "admin";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Task" : "Task Details"}
          </DialogTitle>
          <DialogClose />
        </DialogHeader>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    disabled={!isCreating}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={!isCreating}
                    className="mt-1"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="projectId">Project</Label>
                  <select
                    id="projectId"
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    disabled={!isCreating || loadingProjects}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="assigneeId">Assignee</Label>
                  <select
                    id="assigneeId"
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleInputChange}
                    disabled={!isCreating || !isAdmin || loadingUsers}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                  >
                    <option value="">Select User</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={!isCreating}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    disabled={!isCreating}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    disabled={!isCreating}
                    className="mt-1"
                    required
                  />
                </div>
                {!isCreating && task && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Created{" "}
                        {format(new Date(task.createdAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Updated{" "}
                        {format(new Date(task.updatedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-6 border-t">
              <div className="flex items-center space-x-2">
                {isCreating && (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Create Task"}
                    </Button>
                  </>
                )}
                {!isCreating && task && isAdmin && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Activity Log</h3>
              {taskActivities.length > 0 ? (
                <div className="space-y-3">
                  {taskActivities.map((activity) => {
                    const activityUser = users.find(
                      (u) => u.id === activity.userId
                    );
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">
                              {activityUser?.name || "Admin"}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {activity.details}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(
                              new Date(activity.timestamp),
                              "MMM dd, yyyy at h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No activity recorded for this task yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                task.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}