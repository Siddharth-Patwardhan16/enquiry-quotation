import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase/client'
import { apiClient } from '../utils/api'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session?.access_token) {
          apiClient.setAccessToken(session.access_token)
          const userData = session.user
          setUser({
            id: userData.id,
            email: userData.email!,
            name: userData.user_metadata?.name || userData.email!,
            role: userData.user_metadata?.role || 'Marketing'
          })
        }
      } catch (error) {
        console.log('Session check error:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          apiClient.setAccessToken(session.access_token)
          const userData = session.user
          setUser({
            id: userData.id,
            email: userData.email!,
            name: userData.user_metadata?.name || userData.email!,
            role: userData.user_metadata?.role || 'Marketing'
          })
        } else {
          apiClient.setAccessToken(null)
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.session?.access_token) {
        apiClient.setAccessToken(data.session.access_token)
      }
    } catch (error: any) {
      console.log('Sign in error:', error)
      throw new Error(error.message || 'Failed to sign in')
    }
  }

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      const result = await apiClient.signup(email, password, name, role)
      console.log('Signup result:', result)
      
      // Now sign in the user
      await signIn(email, password)
    } catch (error: any) {
      console.log('Sign up error:', error)
      throw new Error(error.message || 'Failed to sign up')
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      apiClient.setAccessToken(null)
      setUser(null)
    } catch (error: any) {
      console.log('Sign out error:', error)
      throw new Error(error.message || 'Failed to sign out')
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}