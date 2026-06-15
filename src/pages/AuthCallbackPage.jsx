import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, LogIn } from 'lucide-react'
import Card from '../components/Card.jsx'
import { supabase } from '../lib/supabase.js'
import {
  hasAuthCallbackParams,
  mapSupabaseAuthError,
  parseAuthUrlError,
} from '../utils/authCallback.js'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    let resolved = false

    const finishSuccess = () => {
      if (resolved) return
      resolved = true
      clearTimeout(timeoutId)
      navigate('/email-confirmed', { replace: true })
    }

    const finishError = (message) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeoutId)
      setStatus('error')
      setErrorMessage(message)
    }

    const urlError = parseAuthUrlError()
    if (urlError) {
      finishError(urlError)
      return undefined
    }

    const timeoutId = setTimeout(() => {
      finishError(
        'Impossibile completare la conferma. Il link potrebbe essere scaduto, già utilizzato o non valido.',
      )
    }, 12000)

    async function handleCallback() {
      const queryParams = new URLSearchParams(window.location.search)
      const code = queryParams.get('code')

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          finishError(mapSupabaseAuthError(error))
          return
        }
        if (data.session) {
          finishSuccess()
          return
        }
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        finishError(mapSupabaseAuthError(sessionError))
        return
      }

      if (session && hasAuthCallbackParams()) {
        finishSuccess()
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || resolved) return

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        (event === 'INITIAL_SESSION' && hasAuthCallbackParams())
      ) {
        finishSuccess()
      }
    })

    handleCallback()

    return () => {
      resolved = true
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-200">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/30">
              <span className="text-sm font-bold">DV</span>
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-slate-100">DebtVision</p>
              <p className="text-xs text-slate-500">Conferma account</p>
            </div>
          </div>
        </div>

        <Card className="p-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <Loader2 size={32} className="animate-spin text-brand-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">Verifica conferma email…</p>
                <p className="mt-1 text-xs text-slate-500">
                  Attendi qualche secondo mentre controlliamo il link di conferma.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5 py-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30">
                <AlertCircle size={24} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-100">Conferma non riuscita</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{errorMessage}</p>
              </div>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500"
              >
                <LogIn size={16} />
                Torna al login
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
