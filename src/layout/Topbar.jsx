import { useLocation } from 'react-router-dom'
import { Menu, Search, Bell, Settings } from 'lucide-react'
import { navItems } from '../config/navigation.js'
import AccountMenu from '../components/AccountMenu.jsx'

function useCurrentPage() {
  const { pathname } = useLocation()
  return (
    navItems.find((item) => item.path === pathname) ?? {
      label: 'DebtVision',
      description: '',
    }
  )
}

export default function Topbar({ onMenuClick }) {
  const current = useCurrentPage()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
        aria-label="Apri menu"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-slate-100">{current.label}</h1>
        {current.description && (
          <p className="hidden truncate text-xs text-slate-500 sm:block">{current.description}</p>
        )}
      </div>

      {/* Ricerca (solo UI) */}
      <div className="relative hidden md:block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Cerca..."
          className="w-56 rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          className="relative rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Notifiche"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-400" />
        </button>
        <button
          className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Impostazioni"
        >
          <Settings size={18} />
        </button>
      </div>

      <AccountMenu />
    </header>
  )
}
