import { requireAuth } from "@clerk/express";

// Guard de ruta: exige una sesión de Clerk válida (scope privado de la API)
export const clerkAuth = requireAuth();
