"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KanbanColumn } from "@/components/KanbanColumn";
import { useTaskStore } from "@/store/taskStore";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { Task, Project } from "@/types";
import { Search, Filter, Plus, BarChart3 } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TaskCard } from "@/components/TaskCard";
import { TaskModal } from "@/components/TaskModal";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import api from "@/api";
import { socket } from "@/lib/socket";

export function AdminDashboardPage() {
  const { tasks, moveTask, fetchTasks, initializeSocket, addTask } =
    useTaskStore();
  const { user } = useAuthStore();
  const { fetchNotifications, initializeSocket: initializeNotificationSocket } =
    useNotificationStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"view" | "create">("view");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await api.get("/projects");
        console.log("Fetched admin projects:", response.data);
        const fetchedProjects = response.data.map((p: any) => ({
          ...p,
          id: p.id || p._id.toString(),
        }));
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchNotifications();

    if (!user?.id || projects.length === 0 || loadingProjects) return;

    socket.emit("leaveAllProjects");

    const projectIdsToJoin =
      selectedProject === "all" ? projects.map((p) => p.id) : [selectedProject];

    console.log("Joining admin project rooms:", projectIdsToJoin);

    projectIdsToJoin.forEach((projectId) => {
      if (projectId && projectId !== "all") {
        initializeSocket(projectId);
      }
    });

    if (user?.id) {
      initializeNotificationSocket();
    }

    socket.on("taskAdded", (newTask: Task) => {
      console.log("Admin received taskAdded:", newTask);
      addTask(newTask);
    });

    return () => {
      socket.off("taskAdded");
    };
  }, [
    fetchTasks,
    selectedProject,
    initializeSocket,
    fetchNotifications,
    user?.id,
    initializeNotificationSocket,
    projects,
    loadingProjects,
    addTask,
  ]);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject =
      selectedProject === "all" || task.projectId === selectedProject;
    return matchesSearch && matchesProject;
  });

  const todoTasks = filteredTasks.filter((task) => task.status === "todo");
  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "in-progress"
  );
  const doneTasks = filteredTasks.filter((task) => task.status === "done");

  const getContainer = (id: string) => {
    const validStatuses = ["todo", "in-progress", "done"] as const;
    if (validStatuses.includes(id as Task["status"])) {
      return id as Task["status"];
    }
    const task = tasks.find((t) => (t.id || t._id) === id);
    return task ? task.status : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => (t.id || t._id) === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => (t.id || t._id) === activeId);

    if (task) {
      const activeContainer = getContainer(activeId);
      const overContainer = getContainer(overId);

      if (
        activeContainer &&
        overContainer &&
        activeContainer !== overContainer &&
        ["todo", "in-progress", "done"].includes(overContainer)
      ) {
        console.log(
          `Moving task ${activeId} from ${activeContainer} to ${overContainer}`
        );
        moveTask(activeId, overContainer as Task["status"]);
      }
    }

    setActiveTask(null);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalMode("view");
    setTaskModalOpen(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setTaskModalMode("create");
    setTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setTaskModalOpen(false);
    setSelectedTask(null);
  };

  const columns = [
    {
      title: "To Do",
      status: "todo" as const,
      tasks: todoTasks,
      color: "bg-gray-400",
    },
    {
      title: "In Progress",
      status: "in-progress" as const,
      tasks: inProgressTasks,
      color: "bg-blue-500",
    },
    {
      title: "Done",
      status: "done" as const,
      tasks: doneTasks,
      color: "bg-green-500",
    },
  ];

  if (loadingProjects) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
            <BarChart3 className="h-8 w-8" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and assign tasks to users.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationDropdown />
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[600px]">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              title={column.title}
              status={column.status}
              tasks={column.tasks}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
              color={column.color}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inProgressTasks.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {doneTasks.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskModal
        task={selectedTask}
        isOpen={taskModalOpen}
        onClose={handleCloseModal}
        mode={taskModalMode}
      />
    </div>
  );
}
