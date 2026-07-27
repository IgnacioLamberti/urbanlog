import { Link } from 'react-router-dom'
import { CATEGORY_LABELS, STATUS_LABELS } from '../lib/labels'

export default function IncidentCard({ incident, actions }) {
  return (
    <div className="card fade-in" style={{ padding: '1.2rem 1.5rem' }}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link to={`/incidents/${incident._id}`} className="font-semibold text-white hover:underline">
              {incident.title}
            </Link>
            {incident.possibleDuplicateOf && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                ⚠ posible duplicado
              </span>
            )}
          </div>

          <p className="text-sm mb-2" style={{ color: '#94a3b8' }}>{incident.description}</p>

          {incident.aiSummary && (
            <div className="mb-2 text-xs px-2 py-1 rounded inline-block" style={{
              background: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.15)',
              color: '#818cf8'
            }}>
              ✦ IA: {incident.aiSummary}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: '#4b5563' }}>
            <span>📍 {incident.location?.address}</span>
            <span>·</span>
            <span>👤 {incident.reportedBy?.name}</span>
            <span>·</span>
            <span>🏷️ {CATEGORY_LABELS[incident.category] || incident.category}</span>
            <span>·</span>
            <span>{new Date(incident.createdAt).toLocaleDateString('es-AR')}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`badge badge-${incident.priority}`}>{incident.priority}</span>
          <span className={`badge badge-${incident.status}`}>{STATUS_LABELS[incident.status]}</span>
          {actions}
        </div>
      </div>
    </div>
  )
}
