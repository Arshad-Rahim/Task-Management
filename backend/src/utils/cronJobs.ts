import cron from "node-cron";
import { Task, ITask, IUser } from "../models/Task";
import { Project, IProject } from "../models/Project";
import { sendEmail } from "../services/emailService";
import moment from "moment-timezone";
import { Schema } from "mongoose";

// Type guard to check if an array is IUser[]
function isIUserArray(
  members: Schema.Types.ObjectId[] | IUser[]
): members is IUser[] {
  return members.length > 0 && "email" in members[0];
}

export const setupCronJobs = () => {
  cron.schedule(
    "0 2 * * *",
    async () => {
      try {
        const now = moment().tz("Asia/Kolkata").toDate();
        const tomorrow = moment(now)
          .tz("Asia/Kolkata")
          .add(24, "hours")
          .toDate();

        console.log(
          `Running daily reminder at ${now} IST for tasks due between ${now} and ${tomorrow}`
        );

        const tasks = await Task.find({
          deadline: { $gt: now, $lt: tomorrow },
          status: { $ne: "done" },
        }).populate("assignee", "email");

        if (tasks.length === 0) {
          console.log("No tasks due within 24 hours.");
          return;
        }

        for (const task of tasks) {
          const assignee = task.assignee as IUser; // Type assertion since populate ensures IUser
          if (!assignee.email) {
            console.warn(`No email found for assignee of task ${task.title}`);
            continue;
          }
          try {
            await sendEmail(
              assignee.email,
              `Task Reminder: ${task.title}`,
              `Your task "${
                task.title
              }" is due within 24 hours. Deadline: ${moment(task.deadline)
                .tz("Asia/Kolkata")
                .format("YYYY-MM-DD HH:mm:ss")} IST`
            );
            console.log(
              `Reminder email sent for task ${task.title} to ${assignee.email}`
            );
          } catch (emailError) {
            console.error(
              `Failed to send reminder for task ${task.title}:`,
              emailError
            );
          }
        }
      } catch (error) {
        console.error("Error in daily reminder cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  cron.schedule(
    "0 3 * * 1",
    async () => {
      try {
        const projects = await Project.find().populate("members", "email");
        for (const project of projects) {
          const tasks = await Task.find({ project: project._id });
          const stats = {
            total: tasks.length,
            completed: tasks.filter((t) => t.status === "done").length,
            inProgress: tasks.filter((t) => t.status === "in-progress").length,
            todo: tasks.filter((t) => t.status === "todo").length,
          };

          const emails = isIUserArray(project.members)
            ? project.members
                .map((m: IUser) => m.email)
                .filter((email: string) => email)
                .join(",")
            : "";
          if (emails) {
            await sendEmail(
              emails,
              `Weekly Project Summary: ${project.title}`,
              `Project Stats: Total Tasks: ${stats.total}, Completed: ${stats.completed}, In Progress: ${stats.inProgress}, Todo: ${stats.todo}`
            );
            console.log(
              `Weekly summary sent for project ${project.title} to ${emails}`
            );
          } else {
            console.warn(`No valid emails found for project ${project.title}`);
          }
        }
      } catch (error) {
        console.error("Error in weekly report cron job:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};
