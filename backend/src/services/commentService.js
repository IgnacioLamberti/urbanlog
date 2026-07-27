import { Comment } from "../models/Comment.js";

export const listCommentsByIncident = (incidentId) =>
  Comment.find({ incident: incidentId }).populate("author", "name imageUrl role").sort({ createdAt: 1 });

export async function createComment({ incidentId, authorId, text }) {
  const comment = await Comment.create({ incident: incidentId, author: authorId, text });
  return comment.populate("author", "name imageUrl role");
}
