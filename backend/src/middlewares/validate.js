import { fail } from "../utils/apiResponse.js";

// Uso: validate(schema) donde schema es un objeto Zod. Reemplaza req.body por
// el resultado parseado (con defaults/coerciones aplicados).
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return fail(res, 400, "Datos inválidos", result.error.flatten().fieldErrors);
  }
  req.body = result.data;
  next();
};
