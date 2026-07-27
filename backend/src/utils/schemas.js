import { z } from "zod";
import { STATUSES, MODERATION_STATUSES } from "../models/Incident.js";
import { ROLES } from "../models/User.js";

export const createIncidentSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().trim().min(10, "La descripción debe tener al menos 10 caracteres"),
  location: z
    .object({
      address: z.string().optional(),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
    })
    .optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
});

export const moderateIncidentSchema = z.object({
  status: z.enum(MODERATION_STATUSES),
  rejectionReason: z.string().optional(),
});

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, "El comentario no puede estar vacío"),
});

export const changeRoleSchema = z.object({
  role: z.enum(ROLES),
});
