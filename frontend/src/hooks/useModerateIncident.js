import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useModerateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, rejectionReason }) =>
      (await api.patch(`/incidents/${id}/moderation`, { status, rejectionReason })).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
