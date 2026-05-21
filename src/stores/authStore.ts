import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean

  setUser: (user: User | null, session: Session | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setUser: (user, session) => set({ user, session, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))

// Initialize auth state from Supabase session
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setUser(session?.user ?? null, session)
})

// Listen for auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setUser(session?.user ?? null, session)
})
