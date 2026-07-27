import { fail } from "../utils/apiResponse.js";

export const notFound = (req, res) => fail(res, 404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
