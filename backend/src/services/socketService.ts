// server/index.ts
import { Server } from "socket.io";
import { createTask, deleteTask } from "../controllers/taskController"; 

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {

    // Join rooms based on projects
    socket.on("joinProject", (projectId: string) => {
      socket.join(projectId);
    });

    // Handle task creation
    socket.on(
      "createTask",
      async (taskData: any, callback: (response: any) => void) => {
        try {
          const newTask = await createTask(taskData); // Call your controller
          io.to(taskData.projectId).emit("taskAdded", newTask);
          callback({ success: true, task: newTask });
        } catch (error: any) {
          console.error("Failed to create task:", error);
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
        try {
          await deleteTask(data.taskId); // Call your controller
          io.to(data.projectId).emit("taskDeleted", { taskId: data.taskId });
          callback({ success: true });
        } catch (error: any) {
          console.error("Failed to delete task:", error);
          callback({ success: false, error: error.message });
        }
      }
    );

    // Handle task status update (Kanban drag/drop)
    socket.on(
      "moveTask",
      (data: { taskId: string; newStatus: string; projectId: string }) => {
        io.to(data.projectId).emit("taskMoved", data);
      }
    );

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
