import { User, ROLES } from "../models/User.js";

export const listUsers = () => User.find().sort({ createdAt: -1 });

export const changeUserRole = async (userId, role) => {
  if (!ROLES.includes(role)) {
    const err = new Error(`Rol inválido. Debe ser uno de: ${ROLES.join(", ")}`);
    err.status = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
  if (!user) {
    const err = new Error("Usuario no encontrado");
    err.status = 404;
    throw err;
  }
  return user;
};
