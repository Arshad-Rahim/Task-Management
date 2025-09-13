import { Document } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  avatar?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser;
  }
}
