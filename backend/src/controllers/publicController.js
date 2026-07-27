import * as incidentService from "../services/incidentService.js";
import { toPublicIncidentList } from "../mappers/publicIncidentMapper.js";
import { toPublicStats } from "../mappers/publicStatsMapper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/apiResponse.js";

// Scope público (solo lectura, pensado para PowerBI u otras herramientas externas)
export const listPublicIncidents = asyncHandler(async (req, res) => {
  const { status, category, priority, search, page, limit } = req.query;
  const result = await incidentService.listIncidents({
    status,
    category,
    priority,
    search,
    moderationStatus: "approved",
    page,
    limit,
  });

  ok(res, toPublicIncidentList(result.items), {
    total: result.total,
    page: result.page,
    limit: result.limit,
    pages: result.pages,
  });
});

export const getPublicStats = asyncHandler(async (req, res) => {
  const stats = await incidentService.getStats();
  ok(res, toPublicStats(stats));
});
