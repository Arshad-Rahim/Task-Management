import { Server } from "socket.io";
import { createTask, deleteTask } from "../controllers/taskController"; 

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join rooms based on projects
    socket.on("joinProject", (projectId: string) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined project: ${projectId}`);
    });

    // Handle task creation
    socket.on(
      "createTask",
      async (taskData: any, callback: (response: any) => void) => {
        console.log("Received createTask emit:", {
          projectId: taskData.projectId,
          userId: taskData.userId,
          socketId: socket.id,
        });
        try {
          const newTask = await createTask(taskData);
          console.log("Task created successfully:", {
            taskId: newTask.id,
            projectId: taskData.projectId,
          });
          io.to(taskData.projectId).emit("taskAdded", newTask);
          callback({ success: true, task: newTask });
        } catch (error: any) {
          console.error("Failed to create task:", {
            error: error.message,
            stack: error.stack,
            taskData,
          });
          callback({ success: false, error: error.message });
        }
      }
    );

    // Handle task deletion
    socket.on(
      "deleteTask",
      async (
        data: { taskId: string; projectId: string },
        callback: (response: any) => void
      ) => {
        console.log("Received deleteTask emit:", {
          taskId: data.taskId,
          projectId: data.projectId,
          socketId: socket.id,
        });
        try {
          await deleteTask(data.taskId);
          console.log("Task deleted successfully:", {
            taskId: data.taskId,
            projectId: data.projectId,
          });
          io.to(data.projectId).emit("taskDeleted", { taskId: data.taskId });
          callback({ success: true });
        } catch (error: any) {
          console.error("Failed to delete task:", {
            error: error.message,
            stack: error.stack,
            taskId: data.taskId,
          });
          callback({ success: false, error: error.message });
        }
      }
    );

    // Handle task status update (Kanban drag/drop)
    socket.on(
      "moveTask",
      (data: { taskId: string; newStatus: string; projectId: string }) => {
        console.log("Received moveTask emit:", {
          taskId: data.taskId,
          newStatus: data.newStatus,
          projectId: data.projectId,
          socketId: socket.id,
        });
        io.to(data.projectId).emit("taskMoved", data);
      }
    );

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};