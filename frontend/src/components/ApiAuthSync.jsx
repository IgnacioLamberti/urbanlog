import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '../lib/api'

// Cuelga el token de sesión de Clerk en cada request del cliente axios.
// No renderiza nada — solo mantiene el interceptor sincronizado.
export default function ApiAuthSync() {
  const { getToken } = useAuth()

  useEffect(() => {
    const id = api.interceptors.request.use(async (config) => {
      const token = await getToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
    return () => api.interceptors.request.eject(id)
  }, [getToken])

  return null
}
