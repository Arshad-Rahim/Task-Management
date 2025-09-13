"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = require("mongoose");
const taskSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    assignee: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: ["todo", "in-progress", "done"],
        default: "todo",
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
    },
    deadline: { type: Date, required: true },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", required: true },
    attachments: [{ type: String }],
}, { timestamps: true });
exports.Task = (0, mongoose_1.model)("Task", taskSchema);
