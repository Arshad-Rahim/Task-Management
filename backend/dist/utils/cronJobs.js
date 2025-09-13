"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Task_1 = require("../models/Task");
const Project_1 = require("../models/Project");
const emailService_1 = require("../services/emailService");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const setupCronJobs = () => {
    // Daily reminders
    node_cron_1.default.schedule("0 2 * * *", async () => {
        try {
            const now = (0, moment_timezone_1.default)().tz("Asia/Kolkata").toDate();
            const tomorrow = (0, moment_timezone_1.default)(now)
                .tz("Asia/Kolkata")
                .add(24, "hours")
                .toDate();
            console.log(`Running daily reminder at ${now} IST for tasks due between ${now} and ${tomorrow}`);
            const tasks = (await Task_1.Task.find({
                deadline: { $gt: now, $lt: tomorrow },
                status: { $ne: "done" },
            }).populate("assignee", "email"));
            if (tasks.length === 0) {
                console.log("No tasks due within 24 hours.");
                return;
            }
            for (const task of tasks) {
                if (!task.assignee?.email) {
                    console.warn(`No email found for assignee of task ${task.title}`);
                    continue;
                }
                try {
                    await (0, emailService_1.sendEmail)(task.assignee.email, `Task Reminder: ${task.title}`, `Your task "${task.title}" is due within 24 hours. Deadline: ${(0, moment_timezone_1.default)(task.deadline)
                        .tz("Asia/Kolkata")
                        .format("YYYY-MM-DD HH:mm:ss")} IST`);
                    console.log(`Reminder email sent for task ${task.title} to ${task.assignee.email}`);
                }
                catch (emailError) {
                    console.error(`Failed to send reminder for task ${task.title}:`, emailError);
                }
            }
        }
        catch (error) {
            console.error("Error in daily reminder cron job:", error);
        }
    }, {
        timezone: "Asia/Kolkata",
    });
    // Weekly project summaries
    node_cron_1.default.schedule("0 3 * * 1", async () => {
        try {
            const projects = (await Project_1.Project.find().populate("members", "email"));
            for (const project of projects) {
                const tasks = await Task_1.Task.find({ project: project._id });
                const stats = {
                    total: tasks.length,
                    completed: tasks.filter((t) => t.status === "done").length,
                    inProgress: tasks.filter((t) => t.status === "in-progress").length,
                    todo: tasks.filter((t) => t.status === "todo").length,
                };
                const emails = project.members
                    .map((m) => m.email)
                    .filter((email) => Boolean(email))
                    .join(",");
                if (emails) {
                    await (0, emailService_1.sendEmail)(emails, `Weekly Project Summary: ${project.title}`, `Project Stats: Total Tasks: ${stats.total}, Completed: ${stats.completed}, In Progress: ${stats.inProgress}, Todo: ${stats.todo}`);
                    console.log(`Weekly summary sent for project ${project.title} to ${emails}`);
                }
                else {
                    console.warn(`No valid emails found for project ${project.title}`);
                }
            }
        }
        catch (error) {
            console.error("Error in weekly report cron job:", error);
        }
    }, {
        timezone: "Asia/Kolkata",
    });
};
exports.setupCronJobs = setupCronJobs;
