import * as commentService from "../services/commentService.js";
import * as incidentService from "../services/incidentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/apiResponse.js";

// Los comentarios heredan la visibilidad del incidente: comprobarlo antes de
// leer o escribir evita exponer hilos de reportes sin moderar y evita crear
// comentarios huérfanos apuntando a un incidente inexistente.
export const listComments = asyncHandler(async (req, res) => {
  await incidentService.getVisibleIncident(req.params.incidentId, req.dbUser);
  const comments = await commentService.listCommentsByIncident(req.params.incidentId);
  ok(res, comments);
});

export const createComment = asyncHandler(async (req, res) => {
  await incidentService.getVisibleIncident(req.params.incidentId, req.dbUser);

  const comment = await commentService.createComment({
    incidentId: req.params.incidentId,
    authorId: req.dbUser._id,
    text: req.body.text,
  });
  created(res, comment);
});
