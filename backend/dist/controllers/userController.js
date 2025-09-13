"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = void 0;
const User_1 = require("../models/User");
const getUsers = async (req, res) => {
    const users = await User_1.User.find({ role: 'user' }, "name email role");
    res.json(users);
};
exports.getUsers = getUsers;
