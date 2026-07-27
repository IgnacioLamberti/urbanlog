import crypto from "crypto";
import { env } from "../config/env.js";
import { fail } from "../utils/apiResponse.js";

// Guard del scope público (ej. consumo externo desde PowerBI): header x-api-key
export const apiKeyAuth = (req, res, next) => {
  const provided = req.headers["x-api-key"];
  if (!provided) return fail(res, 401, "Falta el header x-api-key");

  const expected = Buffer.from(env.publicApiKey);
  const received = Buffer.from(String(provided));

  const valid = expected.length === received.length && crypto.timingSafeEqual(expected, received);
  if (!valid) return fail(res, 401, "API key inválida");

  next();
};
