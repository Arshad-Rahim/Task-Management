"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.adminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Not authorized" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = await User_1.User.findById(decoded.id).select("-password");
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};
exports.protect = protect;
const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin")
        return res.status(403).json({ message: "Admin access required" });
    next();
};
exports.adminOnly = adminOnly;
const verifyToken = async (token) => {
    if (!token) {
        throw new Error("Not authorized: No token provided");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id).select("role");
        if (!user) {
            throw new Error("User not found");
        }
        return { id: decoded.id, role: user.role };
    }
    catch (error) {
        throw new Error("Invalid token");
    }
};
exports.verifyToken = verifyToken;
