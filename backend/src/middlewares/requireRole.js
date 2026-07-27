import { fail } from "../utils/apiResponse.js";

// Debe montarse DESPUÉS de attachUser. Uso: requireRole(['moderator', 'admin'])
export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.dbUser || !allowedRoles.includes(req.dbUser.role)) {
    return fail(res, 403, "No tenés permisos para realizar esta acción");
  }
  next();
};
