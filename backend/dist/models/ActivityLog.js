"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
const mongoose_1 = require("mongoose");
const activityLogSchema = new mongoose_1.Schema({
    task: { type: mongoose_1.Schema.Types.ObjectId, ref: "Task", required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
        type: String,
        enum: ["created", "updated", "status_changed", "completed"],
        required: true,
    },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});
exports.ActivityLog = (0, mongoose_1.model)("ActivityLog", activityLogSchema);
