export const ok = (res, data, meta) => res.status(200).json(meta ? { data, meta } : { data });

export const created = (res, data) => res.status(201).json({ data });

export const noContent = (res) => res.status(204).send();

export const fail = (res, status, message, details) =>
  res.status(status).json({ error: message, ...(details ? { details } : {}) });
