import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { LogOut, User } from 'lucide-react'

export function UserMenu() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
          <User className="w-4 h-4 mr-1" />
          Sign In
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <span className="text-sm text-gray-500 truncate max-w-[180px]">
        {user.email}
      </span>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <LogOut className="w-4 h-4 mr-1" />
        Sign Out
      </Button>
    </div>
  )
}
