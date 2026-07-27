import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data.data,
  })
}

export function useChangeUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, role }) => (await api.patch(`/users/${id}/role`, { role })).data.data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
