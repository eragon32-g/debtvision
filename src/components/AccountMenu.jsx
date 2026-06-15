import { useEffect, useRef, useState } from 'react'
import { CloudUpload, Loader2, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useFinancialData } from '../hooks/useFinancialData.js'

export default function AccountMenu() {
  const { user, signOut } = useAuth()
  const { cloudSaving, cloudError } = useFinancialData()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
      setOpen(false)
    }
  }

  const email = user?.email ?? 'Account'
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-1 flex items-center gap-2.5 rounded-lg border-l border-slate-800/80 pl-3 transition-colors hover:opacity-90"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="hidden text-right leading-tight sm:block">
          <p className="max-w-[180px] truncate text-sm font-medium text-slate-200">{email}</p>
          <p className="text-[11px] text-slate-500">
            {cloudSaving ? 'Salvataggio…' : cloudError ? 'Sync errore' : 'Account cloud'}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300 ring-1 ring-slate-700">
          {initials}
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-800/80 bg-slate-900 py-1 shadow-card"
        >
          <div className="border-b border-slate-800/80 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profilo</p>
            <p className="mt-1 truncate text-sm text-slate-200">{email}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              {cloudSaving ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  Salvataggio cloud…
                </>
              ) : cloudError ? (
                <span className="text-rose-400">{cloudError}</span>
              ) : (
                <>
                  <CloudUpload size={11} />
                  Sincronizzazione attiva
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/80"
            onClick={() => setOpen(false)}
          >
            <User size={16} className="text-slate-500" />
            Profilo
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
