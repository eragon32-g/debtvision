import { NavLink } from 'react-router-dom'

export default function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-500/10 text-brand-300'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'absolute left-0 h-6 w-1 rounded-r-full transition-all',
              isActive ? 'bg-brand-400' : 'bg-transparent',
            ].join(' ')}
            aria-hidden="true"
          />
          {Icon && (
            <Icon
              size={18}
              className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}
            />
          )}
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
