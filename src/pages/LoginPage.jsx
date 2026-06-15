import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Loader2, LogIn, UserPlus } from 'lucide-react'
import Card from '../components/Card.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'forgot') {
        await resetPassword(email.trim())
        setMessage(
          'Se l\'email è registrata, riceverai a breve un messaggio per reimpostare la password.',
        )
        setMode('login')
        setPassword('')
      } else if (mode === 'login') {
        await signIn(email.trim(), password)
        navigate('/', { replace: true })
      } else {
        await signUp(email.trim(), password)
        setMessage(
          'Registrazione completata. Controlla la tua email e conferma l\'account prima di accedere.',
        )
        setMode('login')
        setPassword('')
      }
    } catch (err) {
      setError(err.message || 'Errore di autenticazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-200">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/30">
              <span className="text-sm font-bold">DV</span>
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-slate-100">DebtVision</p>
              <p className="text-xs text-slate-500">Cloud sync con account personale</p>
            </div>
          </Link>
        </div>

        <Card className="p-6">
          {mode !== 'forgot' && (
            <div className="mb-6 flex rounded-lg border border-slate-800/80 bg-slate-900/60 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setMessage(null)
                }}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mode === 'login'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-200',
                ].join(' ')}
              >
                <LogIn size={16} />
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setError(null)
                  setMessage(null)
                }}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mode === 'register'
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-200',
                ].join(' ')}
              >
                <UserPlus size={16} />
                Registrazione
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-brand-300">
                <KeyRound size={18} />
                <h2 className="text-sm font-semibold text-slate-100">Recupero password</h2>
              </div>
              <p className="text-xs text-slate-500">
                Inserisci la tua email: ti invieremo un link per reimpostare la password.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                placeholder="nome@esempio.it"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot')
                        setError(null)
                        setMessage(null)
                      }}
                      className="text-xs text-brand-300 hover:text-brand-200"
                    >
                      Password dimenticata?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                    placeholder="Minimo 6 caratteri"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-lg border border-brand-500/30 bg-brand-500/5 px-3 py-2 text-sm text-brand-100">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'forgot'
                ? 'Invia link reset'
                : mode === 'login'
                  ? 'Accedi'
                  : 'Crea account'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setMessage(null)
                }}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
              >
                Torna al login
              </button>
            )}
          </form>
        </Card>
      </div>
    </div>
  )
}
