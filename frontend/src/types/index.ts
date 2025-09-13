export interface User {
  id: string;
  _id?: string; // ✅ allow backend _id
  email: string;
  name: string;
  role: "admin" | "user";
  avatar?: string;
}

export interface Project {
  id: string;
  _id?: string; // ✅ allow backend _id
  title: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  createdAt: string;
  updatedAt: string;
  members: User[];
  tasksCount: number;
  completedTasks: number;
  __v?: number; // ✅ MongoDB version key
}

export interface Task {
  id: string;
  _id?: string; // ✅ backend ID
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignee: User | { id: string };
  projectId: string;
  project?: { id?: string; _id?: string } | string; // ✅ safer typing
  deadline: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  timestamp: string;
  details: string;
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
