import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

interface DecodedToken {
  id: string;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
};

export const verifyToken = async (
  token: string
): Promise<{ id: string; role: string }> => {
  if (!token) {
    throw new Error("Not authorized: No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const user = await User.findById(decoded.id).select("role");
    if (!user) {
      throw new Error("User not found");
    }
    return { id: decoded.id, role: user.role };
  } catch (error) {
    throw new Error("Invalid token");
  }
};
