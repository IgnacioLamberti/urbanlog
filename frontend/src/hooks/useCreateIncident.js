import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useCreateIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, description, location, images }) => {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      if (location) formData.append('location', JSON.stringify(location))
      ;(images || []).forEach((file) => formData.append('images', file))

      const res = await api.post('/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
