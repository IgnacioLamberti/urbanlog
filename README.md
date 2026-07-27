# UrbanLog — TP Integrador 3° AS

Plataforma colaborativa de reporte y gestión de incidentes urbanos con clasificación automática por IA, mapa georreferenciado y roles diferenciados.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite + Tailwind CSS + React Router + React Query + Google Maps API |
| Backend | Node.js + Express (arquitectura en capas: routes → controllers → services → models) |
| Base de datos | MongoDB Atlas (Mongoose) |
| Auth | Clerk (Google + email/password), roles propios en Mongo |
| IA | API de Claude (Anthropic): clasificación, normalización, priorización, duplicados, insights |
| Imágenes | Cloudinary |
| Email | Resend (notificación al cambiar el estado de un reporte) |
| Pruebas | Vitest + Supertest + MongoDB en memoria |

## Roles del sistema

- **citizen** — crea reportes y sigue los propios
- **moderator** — aprueba o rechaza reportes antes de que sean públicos
- **operator** — gestiona la resolución (`open` → `in_progress` → `resolved`)
- **admin** — control total: roles de usuarios, moderación, insights de IA

---

## Cómo levantar el proyecto

### 0. Cuentas necesarias

| Servicio | Obligatorio | Para qué |
|----------|-------------|----------|
| [MongoDB Atlas](https://cloud.mongodb.com) | Sí | Base de datos (cluster M0 gratuito) |
| [Clerk](https://dashboard.clerk.com) | Sí | Autenticación con Google y email/contraseña |
| [Anthropic](https://console.anthropic.com/settings/keys) | No | Funcionalidades de IA |
| [Cloudinary](https://console.cloudinary.com) | No | Imágenes de los incidentes |
| [Resend](https://resend.com/api-keys) | No | Notificaciones por email |
| [Google Cloud](https://console.cloud.google.com/google/maps-apis) | No | Mapa y autocompletado de direcciones |

Sin las opcionales el sistema arranca igual: cada funcionalidad cae a un comportamiento alternativo seguro (ver más abajo).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # completar con tus credenciales
npm run dev            # http://localhost:3001
```

### 2. Frontend (en otra terminal)

```bash
cd frontend
npm install
cp .env.example .env   # completar con tus credenciales
npm run dev            # http://localhost:5173
```

### 3. Verificar que todo responde

```bash
cd backend && npm run check
```

Comprueba de forma efectiva la conectividad con cada servicio externo y reporta cuál está caído. Útil sobre todo porque el cluster gratuito de Atlas se pausa solo por inactividad.

### 4. Ejecutar las pruebas

```bash
cd backend && npm test
```

37 pruebas automatizadas sobre una base en memoria efímera: no requieren credenciales ni tocan datos reales.

---

## Comportamiento sin credenciales

El sistema está diseñado para no romperse si falta alguna integración externa:

| Falta... | Qué pasa |
|----------|----------|
| `ANTHROPIC_API_KEY` | Los incidentes se crean con `category:'otro'` y `priority:'media'` (fallback determinista) |
| `CLOUDINARY_*` | El incidente se crea sin imágenes, sin error |
| `RESEND_API_KEY` | No se envía el email de cambio de estado, sin error |
| `VITE_GOOGLE_MAPS_API_KEY` | La ubicación se carga como texto libre y el mapa muestra un aviso |
| `MONGODB_URI`, `CLERK_*`, `PUBLIC_API_KEY` | El backend **no arranca** (son obligatorias) |

---

## Arquitectura

```
Frontend (React + Clerk + React Query + Google Maps)
        │  HTTPS / REST (Bearer token de Clerk)
        ▼
Backend (Express, arquitectura en capas)
  routes → controllers → services → models
        │                    │
        │                    ├── Claude (clasificación, normalización, prioridad, duplicados, insights)
        │                    ├── Cloudinary (imágenes)
        │                    └── Resend (email)
        ▼
MongoDB Atlas
```

### Dos scopes de API REST

- **Scope privado** (`/api/v1/*`): usado por la SPA, protegido con sesión de Clerk.
- **Scope público** (`/api/public/v1/*`): solo lectura, para consumo externo (ej. Power BI), protegido con header `x-api-key` y con datos sanitizados (sin datos personales).

Ver la colección en [`postman/`](postman/) para probar ambos.

---

## Endpoints principales

### Scope privado (`/api/v1`, requiere sesión de Clerk)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/auth/me` | cualquiera | Usuario actual con su rol |
| GET | `/incidents` | cualquiera | Listar (filtros: `status`, `category`, `priority`, `mine`, `search`, `moderationStatus`, `page`, `limit`) |
| POST | `/incidents` | cualquiera | Crear incidente (+ IA + imágenes) |
| GET | `/incidents/:id` | cualquiera | Detalle (sujeto a reglas de visibilidad) |
| GET | `/incidents/stats` | cualquiera | Estadísticas |
| PATCH | `/incidents/:id/status` | operator, admin | Cambiar estado (requiere incidente aprobado) |
| PATCH | `/incidents/:id/moderation` | moderator, admin | Aprobar / rechazar |
| GET/POST | `/incidents/:id/comments` | cualquiera | Comentarios |
| GET | `/users` | admin | Listar usuarios |
| PATCH | `/users/:id/role` | admin | Cambiar rol |
| GET | `/insights` | admin | Resumen de IA sobre la ciudad |

### Scope público (`/api/public/v1`, requiere `x-api-key`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/incidents` | Incidentes aprobados, sin datos personales |
| GET | `/stats` | Estadísticas agregadas |

---

## Seguridad

- **Visibilidad de incidentes**: los aprobados son visibles para cualquier usuario autenticado; los pendientes y rechazados solo para su autor y el personal municipal. Se responde `404` (no `403`) para no revelar la existencia del recurso.
- **Roles**: verificados siempre en el servidor mediante el middleware `requireRole`. El rol vive únicamente en MongoDB, nunca en los metadatos de Clerk (que el propio usuario puede editar).
- **Paginación acotada**: `limit` tiene un tope de 100 para evitar volcados masivos.
- **Rate limiting**: 300 req/15 min en el scope privado, 100 req/15 min en el público y 20 altas de incidente por hora (porque consumen IA de pago).
- **Cabeceras de seguridad**: `helmet` en todas las respuestas.
- **Búsqueda**: el término se escapa antes de construir la expresión regular.
- **Secretos**: solo por variables de entorno; `.env` está excluido del control de versiones.

---

## Despliegue

### Backend en Render

1. Crear cuenta en [render.com](https://render.com) e iniciar sesión con GitHub.
2. **New → Blueprint**, seleccionar el repositorio. Render detecta [`render.yaml`](render.yaml).
3. Cargar las variables de entorno marcadas como `sync: false` (las mismas de `backend/.env`), más:
   - `FRONTEND_URL` = la URL de Vercel (admite varias separadas por coma).
4. Deploy. La URL queda como `https://urbanlog-api.onrender.com`.

> El plan gratuito de Render suspende el servicio tras 15 minutos sin tráfico: la primera petición después de ese lapso puede tardar ~50 segundos.

### Frontend en Vercel

1. Crear cuenta en [vercel.com](https://vercel.com) e iniciar sesión con GitHub.
2. **Add New → Project**, importar el repositorio.
3. Definir **Root Directory** = `frontend` (Vercel detecta Vite y lee [`frontend/vercel.json`](frontend/vercel.json)).
4. Cargar las variables de entorno:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_URL` = la URL del backend en Render
   - `VITE_GOOGLE_MAPS_API_KEY` (opcional)
5. Deploy.

### Después de desplegar

- Actualizar `FRONTEND_URL` en Render con la URL definitiva de Vercel y volver a desplegar.
- En Clerk, agregar el dominio de producción en **Domains**.
- En MongoDB Atlas, permitir el acceso desde las IP de Render (o `0.0.0.0/0` para un TP).
- Si usás Google Maps, agregar el dominio de Vercel a las restricciones por referrer de la API key.

---

## Limitaciones conocidas

- Google Maps requiere habilitar facturación en Google Cloud, que no acepta tarjetas prepagas. El código está listo y se activa al cargar la credencial.
- Clerk y Resend operan en modo desarrollo/sandbox: banner visible y entrega de correos limitada a la casilla registrada.
- El mapa se actualiza por sondeo cada 12 segundos, no mediante WebSockets.

---

## Documentación

En [`docs/`](docs/):

- **Administración de Proyectos** — objetivos, alcance, historias de usuario, riesgos, cronograma y modelo C4.
- **Ingeniería de Software 2** — modelo de dominio, casos de uso, trazo fino y realización de casos de uso.
- **Documentación Técnica** — arquitectura, modelo de datos, referencia de la API, seguridad, IA, pruebas y despliegue.
- **`diagramas/`** — los ocho diagramas en PNG.
