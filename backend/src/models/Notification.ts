import { Schema, model } from "mongoose";

interface INotification {
  userId: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Notification = model<INotification>(
  "Notification",
  notificationSchema
);
