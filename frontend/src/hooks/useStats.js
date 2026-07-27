import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => (await api.get('/incidents/stats')).data.data,
    refetchInterval: 15_000,
  })
}
