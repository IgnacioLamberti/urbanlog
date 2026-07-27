// Diagnóstico rápido: verifica que cada integración externa esté realmente
// respondiendo (no solo que la variable de entorno exista). Uso: npm run check
import "dotenv/config";
import mongoose from "mongoose";
import { Resend } from "resend";
import { v2 as cloudinary } from "cloudinary";
import Anthropic from "@anthropic-ai/sdk";
import { createClerkClient } from "@clerk/express";

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
  }
}

await check("MongoDB Atlas", async () => {
  if (!process.env.MONGODB_URI) throw new Error("Falta MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await mongoose.connection.db.admin().ping();
});

await check("Clerk", async () => {
  if (!process.env.CLERK_SECRET_KEY) throw new Error("Falta CLERK_SECRET_KEY");
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  await clerkClient.users.getUserList({ limit: 1 });
});

await check("Anthropic (Claude)", async () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta ANTHROPIC_API_KEY");
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 5,
    messages: [{ role: "user", content: "ping" }],
  });
});

await check("Cloudinary", async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error("Falta configurar Cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  await cloudinary.api.ping();
});

await check("Resend", async () => {
  if (!process.env.RESEND_API_KEY) throw new Error("Falta RESEND_API_KEY");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.domains.list();
  if (error) throw new Error(error.message);
});

await check("Google Maps (frontend)", async () => {
  throw new Error("No verificable desde el backend — revisar VITE_GOOGLE_MAPS_API_KEY en frontend/.env");
});

console.log("\n─── Estado de integraciones ───\n");
for (const r of results) {
  console.log(`${r.ok ? "✅" : "❌"} ${r.name}${r.ok ? "" : ` — ${r.error}`}`);
}
console.log("");

await mongoose.disconnect().catch(() => {});

const criticalFailed = results.some((r) => !r.ok && ["MongoDB Atlas", "Clerk"].includes(r.name));
process.exit(criticalFailed ? 1 : 0);
