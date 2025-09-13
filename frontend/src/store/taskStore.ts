import { create } from "zustand";
import type { Task } from "@/types";
import api from "@/api";
import { socket } from "@/lib/socket";

interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: Task["status"]) => void;
  getTasksByStatus: (status: Task["status"]) => Task[];
  fetchTasks: () => Promise<void>;
  initializeSocket: (projectId: string) => void;
}

// 🔹 Utility: normalize to guarantee `id` and `projectId` are always strings
const normalizeTask = (t: any): Task => ({
  ...t,
  id: t.id ?? t._id ?? "", // always a string (empty fallback)
  assignee: typeof t.assignee === "string" ? { id: t.assignee } : t.assignee,
  projectId:
    typeof t.project === "string"
      ? t.project
      : t.projectId ?? t.project?._id ?? "",
});

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],

  fetchTasks: async () => {
    try {
      const response = await api.get("/tasks");
      set({
        tasks: response.data.map((t: any) => normalizeTask(t)),
      });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  },

  addTask: (task: Task) => {
    set((state) => {
      const normalized = normalizeTask(task);
      if (state.tasks.some((t) => t.id === normalized.id)) {
        return state;
      }
      return { tasks: [...state.tasks, normalized] };
    });
  },

  updateTask: async (id, updates) => {
    try {
      const response = await api.put(`/tasks/${id}`, updates);
      const updated = normalizeTask(response.data);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updated } : task
        ),
      }));
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },

  moveTask: async (taskId, newStatus) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, { status: newStatus });
      const updated = normalizeTask(response.data);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updated, status: newStatus } : task
        ),
      }));
    } catch (error) {
      console.error("Failed to move task:", error);
    }
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter((task) => task.status === status);
  },

  initializeSocket: (projectId: string) => {
    socket.connect();
    socket.emit("joinProject", projectId);

    socket.on("taskAdded", (newTask: Task) => {
      set((state) => {
        const normalized = normalizeTask(newTask);
        if (state.tasks.some((t) => t.id === normalized.id)) {
          return state;
        }
        return { tasks: [...state.tasks, normalized] };
      });
    });

    socket.on("taskDeleted", ({ taskId }: { taskId: string }) => {
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
      }));
    });

    socket.on(
      "taskMoved",
      ({
        taskId,
        newStatus,
      }: {
        taskId: string;
        newStatus: Task["status"];
      }) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          ),
        }));
      }
    );
  },
}));
