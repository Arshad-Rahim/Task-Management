"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const mongoose_1 = require("mongoose");
const projectSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ["active", "completed", "on-hold"],
        default: "active",
    },
    members: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
projectSchema.virtual("tasksCount").get(function () {
    return 0;
});
projectSchema.virtual("completedTasks").get(function () {
    return 0;
});
exports.Project = (0, mongoose_1.model)("Project", projectSchema);
