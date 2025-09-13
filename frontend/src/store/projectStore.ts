import { create } from "zustand";
import type { Project, Task } from "@/types";
import api from "@/api";


interface ProjectState {
  projects: Project[];
  tasks: Task[];
  addProject: (
    project: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  getTasksByProject: (projectId: string) => Task[];
  fetchProjects: () => Promise<void>;
  fetchTasks: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  tasks: [],

  fetchProjects: async () => {
    try {
      const response = await api.get("/projects");
      set({ projects: response.data });
    } catch (error) {
      console.error("Failed to fetch projects");
    }
  },

  fetchTasks: async () => {
    try {
      const response = await api.get("/tasks");
      set({ tasks: response.data });
    } catch (error) {
      console.error("Failed to fetch tasks");
    }
  },

  addProject: async (projectData) => {
    try {
      const response = await api.post("/projects", projectData);
      set((state) => ({ projects: [...state.projects, response.data] }));
    } catch (error) {
      console.error("Failed to add project");
    }
  },

  updateProject: async (id, updates) => {
    try {
      const response = await api.put(`/projects/${id}`, updates);
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === id ? response.data : project
        ),
      }));
    } catch (error) {
      console.error("Failed to update project");
    }
  },

  deleteProject: async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete project");
    }
  },

  getProjectById: (id) => {
    return get().projects.find((project) => project.id === id);
  },

  getTasksByProject: (projectId) => {
    return get().tasks.filter((task) => task.projectId === projectId);
  },
}));
