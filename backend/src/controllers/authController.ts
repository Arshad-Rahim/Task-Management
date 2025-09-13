import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import jwt from "jsonwebtoken";

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signup = async (req: Request, res: Response) => {
  const { success, data, error } = signupSchema.safeParse(req.body);
  if (!success)
    return res.status(400).json({ message: error?.issues[0].message });

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) return res.status(400).json({ message: "User exists" });

  const user = await User.create(data);
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { success, data, error } = loginSchema.safeParse(req.body);
  if (!success)
    return res.status(400).json({ message: error?.issues[0].message });

  const user = await User.findOne({ email: data.email });
  if (!user || !(await user.comparePassword(data.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};
