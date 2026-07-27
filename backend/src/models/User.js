import mongoose from "mongoose";

export const ROLES = ["citizen", "moderator", "operator", "admin"];

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    role: { type: String, enum: ROLES, default: "citizen" },
    clerkSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
