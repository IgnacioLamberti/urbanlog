// Estado de sesión simulado, compartido entre las pruebas y los dobles de los
// middlewares de autenticación. Vive en su propio módulo para que las fábricas
// de vi.mock puedan importarlo sin caer en una dependencia circular.
export const session = { user: null };
