import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

// ✅ Export IUser so it can be imported in cronJobs.ts
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  avatar?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    avatar: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);
