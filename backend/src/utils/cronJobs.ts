import cron from "node-cron";
import { Task, ITask } from "../models/Task";
import { Project, IProject } from "../models/Project";
import { sendEmail } from "../services/emailService";
import moment from "moment-timezone";
import { IUser } from "../models/User"; // <-- add this

// Define a populated Task type
interface IPopulatedTask extends Omit<ITask, "assignee"> {
  assignee: IUser;
}

// Define a populated Project type
interface IPopulatedProject extends Omit<IProject, "members"> {
  members: IUser[];
}

export const setupCronJobs = () => {
  // Daily reminders
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

        const tasks = (await Task.find({
          deadline: { $gt: now, $lt: tomorrow },
          status: { $ne: "done" },
        }).populate("assignee", "email")) as unknown as IPopulatedTask[];

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
            await sendEmail(
              task.assignee.email,
              `Task Reminder: ${task.title}`,
              `Your task "${
                task.title
              }" is due within 24 hours. Deadline: ${moment(task.deadline)
                .tz("Asia/Kolkata")
                .format("YYYY-MM-DD HH:mm:ss")} IST`
            );
            console.log(
              `Reminder email sent for task ${task.title} to ${task.assignee.email}`
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

  // Weekly project summaries
  cron.schedule(
    "0 3 * * 1",
    async () => {
      try {
        const projects = (await Project.find().populate(
          "members",
          "email"
        )) as unknown as IPopulatedProject[];

        for (const project of projects) {
          const tasks = await Task.find({ project: project._id });
          const stats = {
            total: tasks.length,
            completed: tasks.filter((t) => t.status === "done").length,
            inProgress: tasks.filter((t) => t.status === "in-progress").length,
            todo: tasks.filter((t) => t.status === "todo").length,
          };

          const emails = project.members
            .map((m: IUser) => m.email)
            .filter((email: string | undefined): email is string =>
              Boolean(email)
            )
            .join(",");

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
