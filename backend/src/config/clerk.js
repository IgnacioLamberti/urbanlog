import { createClerkClient } from "@clerk/express";
import { env } from "./env.js";

export const clerkClient = createClerkClient({
  secretKey: env.clerkSecretKey,
  publishableKey: env.clerkPublishableKey,
});
