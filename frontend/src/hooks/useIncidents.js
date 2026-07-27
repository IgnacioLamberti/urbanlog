import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const POLL_INTERVAL_MS = 12_000

export function useIncidents(filters = {}) {
  return useQuery({
    queryKey: ['incidents', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))
      const res = await api.get('/incidents', { params })
      return { items: res.data.data, meta: res.data.meta }
    },
    refetchInterval: POLL_INTERVAL_MS,
    // Evita que la lista parpadee a vacío al cambiar de página o de filtro.
    placeholderData: (previous) => previous,
  })
}
