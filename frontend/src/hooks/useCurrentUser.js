import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { api } from '../lib/api'

export function useCurrentUser() {
  const { isSignedIn, isLoaded } = useAuth()

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => (await api.get('/auth/me')).data.data,
    enabled: isLoaded && isSignedIn,
  })
}
