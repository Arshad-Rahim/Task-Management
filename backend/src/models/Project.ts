import { Schema, model, Document } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  members: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "on-hold"],
      default: "active",
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

projectSchema.virtual("tasksCount").get(function () {
  return 0;
});
projectSchema.virtual("completedTasks").get(function () {
  return 0;
});

export const Project = model<IProject>("Project", projectSchema);
