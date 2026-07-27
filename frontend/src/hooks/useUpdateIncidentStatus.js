import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }) => (await api.patch(`/incidents/${id}/status`, { status })).data.data,
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['incident', String(incident._id)] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
