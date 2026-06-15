import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { requestPasswordResetEmail, requestRegister, AuthEmailError } from '../utils/authEmailApi.js'

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
    try {
      const result = await requestRegister(email, password)
      return result
    } catch (err) {
      const message =
        err instanceof AuthEmailError
          ? err.message
          : 'Errore durante la registrazione. Riprova.'
      const error = new Error(message)
      error.code = err instanceof AuthEmailError ? err.code : 'REGISTER_FAILED'
      throw error
    }
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
