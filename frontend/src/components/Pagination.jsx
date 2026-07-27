export default function Pagination({ meta, onChange }) {
  if (!meta || meta.pages <= 1) return null

  const { page, pages, total, limit } = meta
  const desde = (page - 1) * limit + 1
  const hasta = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid #1f2937' }}>
      <p className="text-xs" style={{ color: '#4b5563' }}>
        Mostrando {desde}–{hasta} de {total} incidentes
      </p>

      <div className="flex items-center gap-2">
        <button
          className="btn-secondary text-xs py-1.5"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          style={page <= 1 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
        >
          ← Anterior
        </button>

        <span className="text-xs px-2" style={{ color: '#94a3b8' }}>
          Página {page} de {pages}
        </span>

        <button
          className="btn-secondary text-xs py-1.5"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          style={page >= pages ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
