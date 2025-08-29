'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'

import { createClient } from '../../lib/supabase-client';

type SupabaseContext = {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const Context = createContext<SupabaseContext>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const initializeAuth = async () => {
      try {
        // Wait a bit for the client to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.warn('Session error during initialization:', sessionError)
        }

        if (mounted) {
          if (initialSession) {
            setSession(initialSession)
            setUser(initialSession.user)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error during auth initialization:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event, session?.user?.email)
        
        try {
          switch (event) {
            case 'SIGNED_IN':
              if (session) {
                setUser(session.user)
                setSession(session)
              }
              break
            case 'SIGNED_OUT':
              setUser(null)
              setSession(null)
              break
            case 'TOKEN_REFRESHED':
              if (session) {
                setSession(session)
              }
              break
            case 'USER_UPDATED':
              if (session) {
                setUser(session.user)
                setSession(session)
              }
              break
            default:
              // For other events, update state if session exists
              if (session) {
                setUser(session.user)
                setSession(session)
              }
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Context.Provider value={{ user, session, loading, signOut }}>
      {children}
    </Context.Provider>
  )
}
