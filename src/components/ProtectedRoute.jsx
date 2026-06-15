import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useFinancialData } from '../hooks/useFinancialData.js'

export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth()
  const { cloudLoading } = useFinancialData()

  if (authLoading || (user && cloudLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 px-5 py-4">
          <Loader2 size={20} className="animate-spin text-brand-400" />
          <span className="text-sm">Caricamento account e dati…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
