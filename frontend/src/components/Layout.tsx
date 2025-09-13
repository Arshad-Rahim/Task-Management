"use client";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import {
  LogOut,
  User,
  Home,
  FolderOpen,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

export function Layout() {
  const { user, logout } = useAuthStore();
  const { initializeSocket: initializeNotificationSocket, fetchNotifications } =
    useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (user?.id) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("joinUser", user.id);
      initializeNotificationSocket();
      fetchNotifications();
    }
  }, [user?.id, initializeNotificationSocket, fetchNotifications]);

  const navigation = [
    ...(user?.role === "admin"
      ? [{ name: "Dashboard", href: "/dashboard", icon: Home }]
      : []),
    { name: "Projects", href: "/projects", icon: FolderOpen },
    { name: "Kanban Board", href: "/kanban", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">TaskFlow</h1>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Top bar */}
        <header className="bg-card border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-4 ml-auto">
              <NotificationDropdown />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
