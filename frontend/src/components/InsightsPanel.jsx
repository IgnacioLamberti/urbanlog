import { useInsights } from '../hooks/useInsights'

export default function InsightsPanel() {
  const { data: insights, refetch, isFetching, isFetched } = useInsights()

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#818cf8' }}></div>
          <h2 className="font-semibold text-white text-sm">Insights de IA para la ciudad</h2>
        </div>
        <button onClick={() => refetch()} className="btn-secondary text-xs py-1.5" disabled={isFetching}>
          {isFetching ? 'Analizando...' : isFetched ? 'Regenerar' : 'Generar insights'}
        </button>
      </div>

      {!isFetched && !isFetching && (
        <p className="text-sm" style={{ color: '#4b5563' }}>
          Generá un resumen ejecutivo automático sobre el estado de la ciudad basado en los incidentes reportados.
        </p>
      )}

      {isFetching && (
        <div className="flex items-center gap-2 text-sm" style={{ color: '#818cf8' }}>
          <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          Generando insights...
        </div>
      )}

      {isFetched && !isFetching && (
        <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>{insights}</p>
      )}
    </div>
  )
}
