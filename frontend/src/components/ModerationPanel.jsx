import { useState } from 'react'
import { useModerateIncident } from '../hooks/useModerateIncident'

export default function ModerationPanel({ incident }) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const { mutate, isPending } = useModerateIncident()

  if (incident.moderation.status !== 'pending') {
    return (
      <div className="text-xs px-3 py-2 rounded-lg" style={{
        background: incident.moderation.status === 'approved' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
        color: incident.moderation.status === 'approved' ? '#34d399' : '#f87171',
      }}>
        {incident.moderation.status === 'approved' ? '✓ Aprobado' : `✕ Rechazado${incident.moderation.rejectionReason ? `: ${incident.moderation.rejectionReason}` : ''}`}
      </div>
    )
  }

  return (
    <div className="card" style={{ borderColor: 'rgba(251,191,36,0.3)' }}>
      <p className="text-sm font-medium text-white mb-3">Este reporte está pendiente de moderación</p>

      {showReject && (
        <input
          className="input-field mb-3"
          placeholder="Motivo del rechazo (opcional)"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      )}

      <div className="flex gap-2">
        <button
          className="btn-primary flex-1 justify-center"
          disabled={isPending}
          onClick={() => mutate({ id: incident._id, status: 'approved' })}
        >
          Aprobar
        </button>
        {!showReject ? (
          <button className="btn-secondary flex-1" onClick={() => setShowReject(true)}>
            Rechazar
          </button>
        ) : (
          <button
            className="btn-secondary flex-1"
            disabled={isPending}
            onClick={() => mutate({ id: incident._id, status: 'rejected', rejectionReason })}
          >
            Confirmar rechazo
          </button>
        )}
      </div>
    </div>
  )
}
