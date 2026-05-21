import { useAuthStore } from '../../stores/authStore'
import { Navigate } from 'react-router-dom'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
