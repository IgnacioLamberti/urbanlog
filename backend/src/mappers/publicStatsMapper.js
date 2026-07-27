// Las stats ya son agregadas y no contienen PII; se re-expone tal cual con
// un mapper propio para dejar el contrato del scope público desacoplado del privado.
export const toPublicStats = (stats) => ({
  total: stats.total,
  open: stats.open,
  inProgress: stats.inProgress,
  resolved: stats.resolved,
  critical: stats.critical,
  byCategory: stats.byCategory,
});
