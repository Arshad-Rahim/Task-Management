import { Schema, model, Document, Types } from "mongoose";

// Define IUser interface (based on User model and taskController.ts usage)
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  avatar?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

// Define IProject interface (based on taskController.ts usage)
export interface IProject extends Document {
  title: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  members: Types.ObjectId[];
}

// Define ITask interface
export interface ITask extends Document {
  _id: Types.ObjectId; // Explicitly define _id
  title: string;
  description: string;
  assignee: Types.ObjectId | IUser; // Allow ObjectId or populated IUser
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  deadline: Date;
  project: Types.ObjectId | IProject; // Allow ObjectId or populated IProject
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    deadline: { type: Date, required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

export const Task = model<ITask>("Task", taskSchema);
