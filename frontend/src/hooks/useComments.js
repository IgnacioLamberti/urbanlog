import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useComments(incidentId) {
  return useQuery({
    queryKey: ['comments', incidentId],
    queryFn: async () => (await api.get(`/incidents/${incidentId}/comments`)).data.data,
    enabled: Boolean(incidentId),
  })
}

export function useCreateComment(incidentId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (text) => (await api.post(`/incidents/${incidentId}/comments`, { text })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', incidentId] }),
  })
}
