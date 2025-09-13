"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const taskController_1 = require("../controllers/taskController");
const setupSocket = (io) => {
    io.on("connection", (socket) => {
        // Join rooms based on projects
        socket.on("joinProject", (projectId) => {
            socket.join(projectId);
        });
        // Handle task creation
        socket.on("createTask", async (taskData, callback) => {
            try {
                const newTask = await (0, taskController_1.createTask)(taskData); // Call your controller
                io.to(taskData.projectId).emit("taskAdded", newTask);
                callback({ success: true, task: newTask });
            }
            catch (error) {
                console.error("Failed to create task:", error);
                callback({ success: false, error: error.message });
            }
        });
        // Handle task deletion
        socket.on("deleteTask", async (data, callback) => {
            try {
                await (0, taskController_1.deleteTask)(data.taskId); // Call your controller
                io.to(data.projectId).emit("taskDeleted", { taskId: data.taskId });
                callback({ success: true });
            }
            catch (error) {
                console.error("Failed to delete task:", error);
                callback({ success: false, error: error.message });
            }
        });
        // Handle task status update (Kanban drag/drop)
        socket.on("moveTask", (data) => {
            io.to(data.projectId).emit("taskMoved", data);
        });
        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });
};
exports.setupSocket = setupSocket;
