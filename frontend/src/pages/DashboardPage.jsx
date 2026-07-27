import { Link } from 'react-router-dom'
import { useStats } from '../hooks/useStats'
import { useIncidents } from '../hooks/useIncidents'
import { useCurrentUser } from '../hooks/useCurrentUser'
import StatsCards from '../components/StatsCards'
import InsightsPanel from '../components/InsightsPanel'
import { CATEGORY_LABELS } from '../lib/labels'

export default function DashboardPage() {
  const { data: user } = useCurrentUser()
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: incidentsData, isLoading: incidentsLoading } = useIncidents({ limit: 5 })

  if (statsLoading || incidentsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const incidents = incidentsData?.items || []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#4b5563' }}>
          Resumen del estado de incidentes urbanos
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Últimos incidentes</h2>
            <Link to="/incidents" className="text-xs" style={{ color: '#38bdf8' }}>Ver todos →</Link>
          </div>
          <div className="space-y-3">
            {incidents.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: '#4b5563' }}>Sin incidentes aún</p>
            )}
            {incidents.map(inc => (
              <div key={inc._id} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid #1f2937' }}>
                <div className="flex-1 min-w-0">
                  <Link to={`/incidents/${inc._id}`} className="text-sm font-medium text-white truncate hover:underline">{inc.title}</Link>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#4b5563' }}>
                    {inc.location?.address} · {new Date(inc.createdAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <span className={`badge badge-${inc.priority} flex-shrink-0`}>{inc.priority}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4">Por categoría</h2>
          {stats?.byCategory && Object.keys(stats.byCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byCategory).map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: '#94a3b8' }}>{CATEGORY_LABELS[cat] || cat}</span>
                    <span className="font-medium text-white">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: '#1f2937' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / stats.total) * 100}%`,
                        background: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: '#4b5563' }}>Sin datos</p>
          )}
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="mb-6">
          <InsightsPanel />
        </div>
      )}

      <div className="p-5 rounded-xl" style={{
        background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.1))',
        border: '1px solid rgba(14,165,233,0.2)'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">¿Encontraste un problema urbano?</h3>
            <p className="text-sm mt-0.5" style={{ color: '#4b5563' }}>La IA lo clasificará y priorizará automáticamente</p>
          </div>
          <Link to="/incidents/new" className="btn-primary flex-shrink-0">
            + Nuevo Reporte
          </Link>
        </div>
      </div>
    </div>
  )
}
