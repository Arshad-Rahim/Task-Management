export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  avatar?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  members: User[];
  tasksCount: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignee: User;
  projectId: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  action: "created" | "updated" | "status_changed" | "completed";
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}
