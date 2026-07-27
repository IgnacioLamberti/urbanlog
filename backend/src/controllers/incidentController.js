import * as incidentService from "../services/incidentService.js";
import { createIncidentSchema } from "../utils/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created, fail } from "../utils/apiResponse.js";

const MODERATOR_ROLES = ["moderator", "operator", "admin"];

function parseLocation(body) {
  if (typeof body.location === "string") {
    try {
      return { ...body, location: JSON.parse(body.location) };
    } catch {
      return { ...body, location: undefined };
    }
  }
  return body;
}

export const createIncident = asyncHandler(async (req, res) => {
  const parsed = createIncidentSchema.safeParse(parseLocation(req.body));
  if (!parsed.success) {
    return fail(res, 400, "Datos inválidos", parsed.error.flatten().fieldErrors);
  }

  const incident = await incidentService.createIncident({
    ...parsed.data,
    files: req.files,
    reportedBy: req.dbUser._id,
  });

  created(res, incident);
});

export const listIncidents = asyncHandler(async (req, res) => {
  const { status, category, priority, moderationStatus, mine, search, page, limit } = req.query;

  const canSeeModeration = MODERATOR_ROLES.includes(req.dbUser.role);
  const reportedBy = mine === "true" ? req.dbUser._id : undefined;

  const result = await incidentService.listIncidents({
    status,
    category,
    priority,
    moderationStatus: canSeeModeration ? moderationStatus : undefined,
    reportedBy,
    search,
    page,
    limit,
  });

  ok(res, result.items, {
    total: result.total,
    page: result.page,
    limit: result.limit,
    pages: result.pages,
  });
});

export const getIncident = asyncHandler(async (req, res) => {
  const incident = await incidentService.getVisibleIncident(req.params.id, req.dbUser);
  ok(res, incident);
});

export const updateIncidentStatus = asyncHandler(async (req, res) => {
  const incident = await incidentService.updateIncidentStatus(req.params.id, req.body.status);
  ok(res, incident);
});

export const moderateIncident = asyncHandler(async (req, res) => {
  const incident = await incidentService.moderateIncident(req.params.id, {
    status: req.body.status,
    rejectionReason: req.body.rejectionReason,
    moderatorId: req.dbUser._id,
  });
  ok(res, incident);
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await incidentService.getStats();
  ok(res, stats);
});
