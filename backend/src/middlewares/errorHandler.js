import { logger } from "../utils/logger.js";
import { fail } from "../utils/apiResponse.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack || err.message);

  if (err.name === "ValidationError") {
    return fail(res, 400, "Datos inválidos", err.errors);
  }
  if (err.name === "CastError") {
    return fail(res, 400, "ID inválido");
  }
  if (err.code === 11000) {
    return fail(res, 409, "El recurso ya existe");
  }

  fail(res, err.status || 500, err.message || "Error interno del servidor");
};
