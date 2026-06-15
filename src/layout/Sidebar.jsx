import { X } from 'lucide-react'
import { navItems } from '../config/navigation.js'
import NavItem from '../components/NavItem.jsx'

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 shadow-card">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M4 16 L9 10 L13 13 L19 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="5" r="1.6" fill="white" />
        </svg>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-100">DebtVision</p>
        <p className="text-[11px] font-medium text-slate-500">Debt Management</p>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          Menu
        </p>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <div className="rounded-lg bg-slate-800/40 p-3">
          <p className="text-xs font-medium text-slate-300">DebtVision</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Versione 0.1.0 — Fase 1</p>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {/* Sidebar desktop fissa */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-slate-900/60 lg:block">
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar mobile a scomparsa */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-800/80 bg-slate-900 transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Chiudi menu"
        >
          <X size={18} />
        </button>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </>
  )
}
