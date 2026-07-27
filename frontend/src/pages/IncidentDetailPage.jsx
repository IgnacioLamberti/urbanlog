import { useParams, Link } from 'react-router-dom'
import { useIncident } from '../hooks/useIncident'
import { useComments } from '../hooks/useComments'
import { useUpdateIncidentStatus } from '../hooks/useUpdateIncidentStatus'
import { useCurrentUser } from '../hooks/useCurrentUser'
import ModerationPanel from '../components/ModerationPanel'
import CommentList from '../components/CommentList'
import CommentForm from '../components/CommentForm'
import { CATEGORY_LABELS, STATUS_LABELS } from '../lib/labels'

export default function IncidentDetailPage() {
  const { id } = useParams()
  const { data: user } = useCurrentUser()
  const { data: incident, isLoading } = useIncident(id)
  const { data: comments } = useComments(id)
  const { mutate: updateStatus, isPending } = useUpdateIncidentStatus()

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!incident) return (
    <div className="p-8"><p style={{ color: '#4b5563' }}>Incidente no encontrado.</p></div>
  )

  const canModerate = user?.role === 'moderator' || user?.role === 'admin'
  const canManageStatus = user?.role === 'operator' || user?.role === 'admin'

  return (
    <div className="p-8 max-w-3xl">
      <Link to="/incidents" className="text-xs" style={{ color: '#38bdf8' }}>← Volver a incidentes</Link>

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-2xl font-bold text-white">{incident.title}</h1>
          <span className={`badge badge-${incident.priority}`}>{incident.priority}</span>
          <span className={`badge badge-${incident.status}`}>{STATUS_LABELS[incident.status]}</span>
        </div>
        <p className="text-sm" style={{ color: '#4b5563' }}>
          📍 {incident.location?.address} · 🏷️ {CATEGORY_LABELS[incident.category] || incident.category} · 👤 {incident.reportedBy?.name}
        </p>
      </div>

      {canModerate && (
        <div className="mb-6">
          <ModerationPanel incident={incident} />
        </div>
      )}

      <div className="card mb-6">
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#4b5563' }}>Descripción normalizada por IA</p>
        <p className="text-sm text-white mb-4">{incident.normalizedDescription || incident.description}</p>

        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#4b5563' }}>Descripción original</p>
        <p className="text-sm" style={{ color: '#94a3b8' }}>{incident.description}</p>

        {incident.images?.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {incident.images.map((src) => (
              <img key={src} src={src} alt="" className="w-24 h-24 object-cover rounded-lg" style={{ border: '1px solid #1f2937' }} />
            ))}
          </div>
        )}

        {canManageStatus && (
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid #1f2937' }}>
            <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#4b5563' }}>Cambiar estado</label>
            <select
              value={incident.status}
              onChange={(e) => updateStatus({ id: incident._id, status: e.target.value })}
              disabled={isPending}
              className="text-sm rounded px-3 py-2"
              style={{ background: '#0a0f1e', border: '1px solid #374151', color: '#94a3b8', cursor: 'pointer', fontFamily: 'Space Grotesk' }}
            >
              <option value="open">Abrir</option>
              <option value="in_progress">En Proceso</option>
              <option value="resolved">Resolver</option>
            </select>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-white mb-4">Comentarios y seguimiento</h2>
        <CommentList comments={comments} />
        <CommentForm incidentId={id} />
      </div>
    </div>
  )
}
