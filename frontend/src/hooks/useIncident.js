import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useIncident(id) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: async () => (await api.get(`/incidents/${id}`)).data.data,
    enabled: Boolean(id),
  })
}
