import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useIncidents } from '../hooks/useIncidents'
import { useUpdateIncidentStatus } from '../hooks/useUpdateIncidentStatus'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import IncidentCard from '../components/IncidentCard'
import Pagination from '../components/Pagination'

export default function IncidentsPage() {
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', mine: '' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 400)

  const { data: user } = useCurrentUser()
  const { data, isLoading } = useIncidents({ ...filters, search: debouncedSearch, page })
  const { mutate: updateStatus, isPending, variables } = useUpdateIncidentStatus()

  // Al cambiar un filtro o la búsqueda, la página actual puede quedar fuera de rango.
  useEffect(() => {
    setPage(1)
  }, [filters, debouncedSearch])

  const incidents = data?.items || []
  const meta = data?.meta
  const canManageStatus = user?.role === 'operator' || user?.role === 'admin'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Incidentes</h1>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>
            {meta?.total ?? 0} incidente{meta?.total !== 1 ? 's' : ''} encontrado{meta?.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/incidents/new" className="btn-primary">+ Nuevo Reporte</Link>
      </div>

      <input
        className="input-field mb-4"
        placeholder="Buscar por título, descripción o dirección..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-3 mb-6">
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="input-field"
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="in_progress">En Proceso</option>
          <option value="resolved">Resuelto</option>
        </select>

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

        <label className="flex items-center gap-2 text-sm px-3" style={{ color: '#94a3b8' }}>
          <input
            type="checkbox"
            checked={filters.mine === 'true'}
            onChange={e => setFilters(f => ({ ...f, mine: e.target.checked ? 'true' : '' }))}
          />
          Solo mis reportes
        </label>

        {(filters.status || filters.priority || filters.mine) && (
          <button onClick={() => setFilters({ status: '', priority: '', category: '', mine: '' })} className="btn-secondary text-xs">
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : incidents.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-2xl mb-2">📋</p>
          <p className="font-medium text-white">Sin incidentes</p>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>No hay incidentes con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => (
            <IncidentCard
              key={inc._id}
              incident={inc}
              actions={canManageStatus && (
                <select
                  value={inc.status}
                  onChange={e => updateStatus({ id: inc._id, status: e.target.value })}
                  disabled={isPending && variables?.id === inc._id}
                  className="text-xs rounded px-2 py-1"
                  style={{ background: '#0a0f1e', border: '1px solid #374151', color: '#94a3b8', cursor: 'pointer', fontFamily: 'Space Grotesk' }}
                >
                  <option value="open">Abrir</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="resolved">Resolver</option>
                </select>
              )}
            />
          ))}

          <Pagination meta={meta} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
