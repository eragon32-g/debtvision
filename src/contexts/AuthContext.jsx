import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { getAuthCallbackRedirectUrl } from '../utils/authCallback.js'
import {
  requestPasswordResetEmail,
  requestVerificationEmail,
  AuthEmailError,
} from '../utils/authEmailApi.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signUp = useCallback(async (email, password) => {
    const emailRedirectTo = getAuthCallbackRedirectUrl()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    })
    if (error) throw error

    try {
      await requestVerificationEmail(email, password)
    } catch (emailError) {
      const message =
        emailError instanceof AuthEmailError
          ? emailError.message
          : 'Registrazione creata, ma invio email di verifica non riuscito.'
      const err = new Error(message)
      err.code = emailError instanceof AuthEmailError ? emailError.code : 'EMAIL_SEND_FAILED'
      throw err
    }

    return data
  }, [])

  const resetPassword = useCallback(async (email) => {
    await requestPasswordResetEmail(email)
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signIn,
      signUp,
      resetPassword,
      signOut,
    }),
    [session, user, loading, signIn, signUp, resetPassword, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider')
  }
  return context
}
