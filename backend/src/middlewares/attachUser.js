import { getAuth } from "@clerk/express";
import { clerkClient } from "../config/clerk.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Debe montarse DESPUÉS de clerkAuth. Sincroniza (lazy upsert atómico) el
// usuario de Clerk contra nuestro modelo Mongo y cuelga req.dbUser con su role.
// El role SIEMPRE nace en 'citizen' acá — nunca se toma de Clerk.
export const attachUser = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);

  let dbUser = await User.findOne({ clerkId: userId });

  if (!dbUser) {
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || "";
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email;

    dbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $setOnInsert: {
          clerkId: userId,
          email,
          name,
          imageUrl: clerkUser.imageUrl || "",
          role: "citizen",
        },
      },
      { upsert: true, new: true }
    );
  }

  req.dbUser = dbUser;
  next();
});
