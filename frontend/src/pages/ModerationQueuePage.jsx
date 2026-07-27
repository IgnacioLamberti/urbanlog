import { useState } from 'react'
import { useIncidents } from '../hooks/useIncidents'
import IncidentCard from '../components/IncidentCard'
import ModerationPanel from '../components/ModerationPanel'
import Pagination from '../components/Pagination'

export default function ModerationQueuePage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useIncidents({ moderationStatus: 'pending', page })

  const incidents = data?.items || []
  const meta = data?.meta

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Cola de moderación</h1>
        <p className="text-sm mt-1" style={{ color: '#4b5563' }}>
          {meta?.total ?? 0} reporte{meta?.total !== 1 ? 's' : ''} pendiente{meta?.total !== 1 ? 's' : ''} de validación
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : incidents.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-medium text-white">Todo al día</p>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>No hay reportes pendientes de moderación</p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div key={inc._id} className="space-y-2">
              <IncidentCard incident={inc} />
              <ModerationPanel incident={inc} />
            </div>
          ))}

          <Pagination meta={meta} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
