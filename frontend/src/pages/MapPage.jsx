import { useState } from 'react'
import { useIncidents } from '../hooks/useIncidents'
import IncidentMap from '../components/IncidentMap'

// En el mapa no aplica la paginación: se pide el máximo de incidentes que
// admite la API para no mostrar una ciudad incompleta.
const MAX_MARCADORES = 100

export default function MapPage() {
  const [filters, setFilters] = useState({ category: '', priority: '' })
  const { data, isLoading } = useIncidents({ ...filters, limit: MAX_MARCADORES })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mapa de incidentes</h1>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>Se actualiza automáticamente cada pocos segundos</p>
        </div>

        <select
          value={filters.priority}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          className="input-field"
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="">Todas las prioridades</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <IncidentMap incidents={data?.items || []} />
      )}
    </div>
  )
}
