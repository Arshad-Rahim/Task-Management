import { Schema, model } from "mongoose";

interface IActivityLog {
  task: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  action: "created" | "updated" | "status_changed" | "completed";
  details: string;
  timestamp: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: {
    type: String,
    enum: ["created", "updated", "status_changed", "completed"],
    required: true,
  },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const ActivityLog = model<IActivityLog>(
  "ActivityLog",
  activityLogSchema
);
