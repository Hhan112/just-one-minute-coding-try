import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { syncService } from '../stores/syncService'
import { useUserStore } from '../stores/practiceStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Mail, Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) throw signUpError

        if (data.user) {
          setError('Registration successful! Please check your email to confirm your account.')
          setIsRegister(false)
        }
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        if (data.session) {
          // Sync cloud data to local store on login
          const cloudData = await syncService.pullAllData()
          if (cloudData) {
            useUserStore.getState().setSyncData(cloudData.sessions, cloudData.checkIns)
          }
          navigate('/')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <header className="p-4">
        <div className="max-w-xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">{isRegister ? '📝' : '🔐'}</div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {isRegister
                  ? 'Register to sync your practice data across devices'
                  : 'Sign in to access your practice history'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegister ? 'At least 6 characters' : 'Enter your password'}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className={`text-sm p-3 rounded-lg ${
                  error.includes('successful')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isRegister ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : isRegister ? (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Register"}
              </button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
