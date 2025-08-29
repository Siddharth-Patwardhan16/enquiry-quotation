import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './utils/supabase/info'
import { LoginForm } from './components/LoginForm'
import { MainLayout } from './components/MainLayout'
import { Dashboard } from './components/Dashboard'
import { CustomersPage } from './components/CustomersPage'
import { EnquiriesPage } from './components/EnquiriesPage'
import { QuotationsPage } from './components/QuotationsPage'
import { CustomerDetail } from './components/CustomerDetail'
import { EnquiryDetail } from './components/EnquiryDetail'
import { QuotationDetail } from './components/QuotationDetail'
import { NewEnquiryForm } from './components/NewEnquiryForm'
import { NewCustomerForm } from './components/NewCustomerForm'
import { NewQuotationForm } from './components/NewQuotationForm'

export default function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedId, setSelectedId] = useState(null)
  const [accessToken, setAccessToken] = useState(null)

  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  )

  useEffect(() => {
    checkUser()
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/init-schema`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        console.log('Schema initialization failed')
      }
    } catch (error) {
      console.log('Error initializing app:', error)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.log('Error getting session:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        setUser(session.user)
        setAccessToken(session.access_token)
        setUserProfile({
          name: session.user.user_metadata?.name || session.user.email,
          role: session.user.user_metadata?.role || 'Employee',
          email: session.user.email
        })
      }
    } catch (error) {
      console.log('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.session) {
        setUser(data.user)
        setAccessToken(data.session.access_token)
        setUserProfile({
          name: data.user.user_metadata?.name || data.user.email,
          role: data.user.user_metadata?.role || 'Employee',
          email: data.user.email
        })
      }
    } catch (error) {
      throw error
    }
  }

  const handleSignup = async (email, password, name, role) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cb9ae747/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed')
      }

      // After successful signup, sign in the user
      await handleLogin(email, password)
    } catch (error) {
      throw error
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setAccessToken(null)
    setCurrentPage('dashboard')
    setSelectedId(null)
  }

  const navigate = (page, id = null) => {
    setCurrentPage(page)
    setSelectedId(id)
  }

  const renderCurrentPage = () => {
    const pageProps = {
      accessToken,
      navigate,
      selectedId,
      userProfile
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} />
      case 'customers':
        return <CustomersPage {...pageProps} />
      case 'customer-detail':
        return <CustomerDetail {...pageProps} />
      case 'enquiries':
        return <EnquiriesPage {...pageProps} />
      case 'enquiry-detail':
        return <EnquiryDetail {...pageProps} />
      case 'quotations':
        return <QuotationsPage {...pageProps} />
      case 'quotation-detail':
        return <QuotationDetail {...pageProps} />
      case 'new-enquiry':
        return <NewEnquiryForm {...pageProps} />
      case 'new-customer':
        return <NewCustomerForm {...pageProps} />
      case 'new-quotation':
        return <NewQuotationForm {...pageProps} />
      default:
        return <Dashboard {...pageProps} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} onSignup={handleSignup} />
  }

  return (
    <MainLayout
      user={userProfile}
      currentPage={currentPage}
      onNavigate={navigate}
      onLogout={handleLogout}
      accessToken={accessToken}
    >
      {renderCurrentPage()}
    </MainLayout>
  )
}