import { ok } from "../utils/apiResponse.js";

export const getMe = (req, res) => ok(res, req.dbUser);
