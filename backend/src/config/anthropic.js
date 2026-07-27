import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env.js";

export const anthropicConfigured = Boolean(env.anthropicApiKey);

export const anthropic = anthropicConfigured
  ? new Anthropic({ apiKey: env.anthropicApiKey })
  : null;

export const AI_MODEL = "claude-sonnet-5";
