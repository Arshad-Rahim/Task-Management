import { create } from "zustand";
import api from "@/api";
import type { Notification } from "@/types";
import { socket } from "@/lib/socket";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  initializeSocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const response = await api.get("/tasks/notifications");
      const notifications = response.data.map((n: any) => ({
        ...n,
        id: n.id || n._id.toString(),
      }));
      set({
        notifications,
        unreadCount: notifications.filter((n: Notification) => !n.read).length,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  },
  markAsRead: async (id: string) => {
    try {
      await api.put(`/tasks/notifications/${id}/read`);
      set((state) => {
        const updatedNotifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter((n) => !n.read).length,
        };
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },
  markAllAsRead: async () => {
    try {
      const unreadNotifications = get().notifications.filter((n) => !n.read);
      await Promise.all(
        unreadNotifications.map((n) =>
          api.put(`/tasks/notifications/${n.id}/read`)
        )
      );
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },
  deleteNotification: async (id: string) => {
    try {
      await api.delete(`/tasks/notifications/${id}`);
      set((state) => {
        const updatedNotifications = state.notifications.filter(
          (n) => n.id !== id
        );
        return {
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter((n) => !n.read).length,
        };
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  },
  clearAll: async () => {
    try {
      const notifications = get().notifications;
      await Promise.all(
        notifications.map((n) => api.delete(`/tasks/notifications/${n.id}`))
      );
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  },
  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    }));
  },
  initializeSocket: () => {
    socket.on("notificationAdded", (notification: Notification) => {
      get().addNotification(notification);
    });
  },
}));
