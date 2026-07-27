import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// On-demand: el admin dispara refetch() con un botón, no se pide solo.
export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: async () => (await api.get('/insights')).data.data.insights,
    enabled: false,
    retry: false,
  })
}
