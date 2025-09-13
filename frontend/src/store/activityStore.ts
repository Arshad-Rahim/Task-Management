import { create } from "zustand";
import type { ActivityLog } from "@/types";
import api from "@/api";


interface ActivityState {
  activities: ActivityLog[];
  addActivity: (
    activity: Omit<ActivityLog, "id" | "timestamp">
  ) => Promise<void>;
  getActivitiesByTask: (taskId: string) => ActivityLog[];
  fetchActivitiesByTask: (
    taskId: string,
    onError?: (message: string) => void
  ) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],

  fetchActivitiesByTask: async (
    taskId: string,
    onError?: (message: string) => void
  ) => {
    try {
      const response = await api.get(`/tasks/${taskId}/activitylogs`); 
      const transformedActivities = response.data.map((log: any) => ({
        id: log._id,
        taskId: log.task, 
        userId: log.user?._id || "", 
        action: log.action,
        details: log.details,
        timestamp: log.timestamp,
      }));
      set((state) => ({
        activities: [
          ...state.activities.filter((a) => a.taskId !== taskId), 
          ...transformedActivities,
        ],
      }));
    } catch (error: any) {
      console.error("Failed to fetch activities:", error);
      onError?.("Failed to load activity logs. Please try again."); 
    }
  },

  addActivity: async (activityData: Omit<ActivityLog, "id" | "timestamp">) => {
    const newActivity: ActivityLog = {
      ...activityData,
      id: Date.now().toString(), 
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ activities: [...state.activities, newActivity] }));

    try {
   
    } catch (error) {
      console.error("Failed to add activity:", error);
      set((state) => ({
        activities: state.activities.filter((a) => a.id !== newActivity.id),
      }));
      throw error; 
    }
  },

  getActivitiesByTask: (taskId: string) => {
    return get()
      .activities.filter((activity) => activity.taskId === taskId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  },
}));
