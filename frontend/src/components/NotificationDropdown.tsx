"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import type { Notification } from "@/types";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Info,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function NotificationDropdown() {
  const { user } = useAuthStore();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  // Log to debug if the component is re-rendering
  useEffect(() => {
    console.log("NotificationDropdown re-rendered, isOpen:", isOpen);
  }, [isOpen]);

  const userNotifications = notifications.filter((n) => n.userId === user?.id);
  const unreadUserNotifications = userNotifications.filter((n) => !n.read);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (
    type: Notification["type"],
    read: boolean
  ) => {
    if (read) return "bg-background";

    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/10";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/10";
      case "error":
        return "bg-red-50 dark:bg-red-900/10";
      default:
        return "bg-blue-50 dark:bg-blue-900/10";
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleToggle = () => {
    console.log("Toggling NotificationDropdown, current isOpen:", isOpen);
    setIsOpen((prev) => !prev);
  };

  const notificationContent = (
    <div className="w-80 max-h-96 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Notifications</h3>
        <div className="flex items-center space-x-1">
          {unreadUserNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7 px-2"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          {userNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-7 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {userNotifications.length > 0 ? (
          <div className="divide-y">
            {userNotifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-muted/50 transition-colors ${getNotificationBgColor(
                  notification.type,
                  notification.read
                )}`}
                onClick={() =>
                  console.log("Notification clicked:", notification.id)
                }
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            notification.read
                              ? "text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) =>
                              handleMarkAsRead(e, notification.id)
                            }
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(e, notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        )}
      </div>

      {userNotifications.length > 10 && (
        <div className="p-3 border-t text-center">
          <Button variant="ghost" size="sm" className="text-xs">
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={handleToggle}
        >
          <Bell className="h-5 w-5" />
          {unreadUserNotifications.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadUserNotifications.length > 9
                ? "9+"
                : unreadUserNotifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {notificationContent}
      </PopoverContent>
    </Popover>
  );
}
