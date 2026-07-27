# UrbanLog — TP Integrador 3° AS

Plataforma colaborativa de reporte y gestión de incidentes urbanos con clasificación automática por IA, mapa en tiempo real y roles diferenciados.

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

## Roles del sistema

- **citizen** — crea reportes y sigue los propios
- **moderator** — aprueba o rechaza reportes antes de que sean públicos
- **operator** — gestiona la resolución (`open` → `in_progress` → `resolved`)
- **admin** — control total: roles de usuarios, moderación, insights de IA

---

## Cómo levantar el proyecto

### 0. Cuentas necesarias (ninguna está creada todavía)

Necesitás crear cuenta y obtener credenciales en:
- [MongoDB Atlas](https://cloud.mongodb.com) (cluster gratuito)
- [Clerk](https://dashboard.clerk.com) (con Google OAuth habilitado)
- [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) (Maps JavaScript API + Places API)
- [Cloudinary](https://console.cloudinary.com)
- [Anthropic Console](https://console.anthropic.com/settings/keys)
- [Resend](https://resend.com/api-keys)

Sin estas credenciales el backend arranca igual, pero cada funcionalidad que dependa de un servicio externo cae a un fallback seguro (ver sección "Comportamiento sin credenciales").

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # completar con tus credenciales reales
npm run dev
```

El servidor arranca en: http://localhost:3001

### 2. Frontend (en otra terminal)

```bash
cd frontend
npm install
cp .env.example .env   # completar con tus credenciales reales
npm run dev
```

La app abre en: http://localhost:5173

---

## Comportamiento sin credenciales

El sistema está diseñado para no romperse si falta alguna integración externa:

| Falta... | Qué pasa |
|----------|----------|
| `ANTHROPIC_API_KEY` | Los incidentes se crean igual con `category:'otro'`, `priority:'media'` (fallback determinista) |
| `CLOUDINARY_*` | El incidente se crea sin imágenes, sin error |
| `RESEND_API_KEY` | No se envía el email de cambio de estado, sin error |
| `VITE_GOOGLE_MAPS_API_KEY` | El formulario de nuevo incidente permite cargar una dirección de texto simple, y el mapa muestra un aviso en vez de romper |
| `MONGODB_URI`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `PUBLIC_API_KEY` | El backend **no arranca** (son obligatorias) |

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

- **Scope 1 — privado** (`/api/v1/*`): usado por la SPA, protegido con sesión de Clerk.
- **Scope 2 — público** (`/api/public/v1/*`): solo lectura, pensado para consumo externo (ej. Power BI), protegido con un header `x-api-key` estático y con datos sanitizados (sin PII).

Ver la colección Postman en [`postman/UrbanLog.postman_collection.json`](postman/UrbanLog.postman_collection.json) (+ [`postman/UrbanLog.postman_environment.json`](postman/UrbanLog.postman_environment.json)) para probar ambos scopes.

---

## Endpoints principales

### Scope privado (`/api/v1`, requiere sesión de Clerk)

| Método | Ruta | Rol requerido | Descripción |
|--------|------|---------------|-------------|
| GET | `/auth/me` | cualquiera | Usuario actual (sincronizado desde Clerk) |
| GET | `/incidents` | cualquiera | Listar incidentes (filtros: status, category, priority, mine, moderationStatus) |
| POST | `/incidents` | cualquiera | Crear incidente (+ IA + imágenes opcionales) |
| GET | `/incidents/:id` | cualquiera | Detalle de un incidente |
| PATCH | `/incidents/:id/status` | operator, admin | Cambiar estado operativo |
| PATCH | `/incidents/:id/moderation` | moderator, admin | Aprobar/rechazar un reporte |
| GET | `/incidents/stats` | cualquiera | Estadísticas generales |
| GET | `/incidents/:id/comments` | cualquiera | Listar comentarios |
| POST | `/incidents/:id/comments` | cualquiera | Comentar un incidente |
| GET | `/users` | admin | Listar usuarios |
| PATCH | `/users/:id/role` | admin | Cambiar rol de un usuario |
| GET | `/insights` | admin | Insights de IA sobre el estado de la ciudad |

### Scope público (`/api/public/v1`, requiere header `x-api-key`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/incidents` | Incidentes aprobados, sin PII |
| GET | `/stats` | Estadísticas agregadas |

---

## Funcionalidades de IA

Implementadas en `backend/src/services/aiService.js`:

1. **Clasificación + normalización + priorización** — una sola llamada a Claude al crear el incidente, devuelve categoría, descripción normalizada, resumen y prioridad.
2. **Detección de duplicados** — filtro geoespacial barato en MongoDB (radio 150m, ventana 14 días) y solo si hay candidatos cercanos se consulta a Claude para la comparación semántica.
3. **Resumen para administradores** — insights on-demand sobre el estado de la ciudad, cacheados ~10 minutos.

---

## Limitaciones conocidas

- Clerk en modo desarrollo muestra un banner y tiene límite de usuarios de prueba.
- El mapa en tiempo real usa polling (React Query, cada ~12s), no WebSockets.
- No hay deploy configurado todavía (Vercel/Render) — el proyecto corre local.
