import * as incidentService from "../services/incidentService.js";
import { generateCityInsights } from "../services/aiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/apiResponse.js";

export const getInsights = asyncHandler(async (req, res) => {
  const [stats, recent] = await Promise.all([
    incidentService.getStats(),
    incidentService.listIncidents({ limit: 15 }),
  ]);

  const insights = await generateCityInsights(stats, recent.items);
  ok(res, { insights });
});
