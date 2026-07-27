import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '../hooks/useCurrentUser'

export default function RoleGuard({ allow, children }) {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) return null
  if (!user || !allow.includes(user.role)) return <Navigate to="/unauthorized" replace />

  return children
}
