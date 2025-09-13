"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const zod_1 = require("zod");
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(["admin", "user"]),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const signup = async (req, res) => {
    const { success, data, error } = signupSchema.safeParse(req.body);
    if (!success)
        return res.status(400).json({ message: error?.issues[0].message });
    const existingUser = await User_1.User.findOne({ email: data.email });
    if (existingUser)
        return res.status(400).json({ message: "User exists" });
    const user = await User_1.User.create(data);
    const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
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
exports.signup = signup;
const login = async (req, res) => {
    const { success, data, error } = loginSchema.safeParse(req.body);
    if (!success)
        return res.status(400).json({ message: error?.issues[0].message });
    const user = await User_1.User.findOne({ email: data.email });
    if (!user || !(await user.comparePassword(data.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
    res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
};
exports.login = login;
