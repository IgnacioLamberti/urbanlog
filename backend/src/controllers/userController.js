import * as userService from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/apiResponse.js";

export const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  ok(res, users);
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const user = await userService.changeUserRole(req.params.id, req.body.role);
  ok(res, user);
});
