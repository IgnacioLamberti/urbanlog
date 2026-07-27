import "dotenv/config";

const required = ["MONGODB_URI", "CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY", "PUBLIC_API_KEY"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Falta la variable de entorno ${key}. Revisá tu .env (usá .env.example como referencia).`);
  }
}

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: process.env.PORT || 3001,
  frontendUrl,
  // FRONTEND_URL admite varios orígenes separados por coma (producción + local).
  allowedOrigins: frontendUrl
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
  mongoUri: process.env.MONGODB_URI,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || "UrbanLog <onboarding@resend.dev>",
  publicApiKey: process.env.PUBLIC_API_KEY,
};
