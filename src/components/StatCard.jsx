import Card from './Card.jsx'

// Card statistica. Se "value" è assente mostra un placeholder ("—").
export default function StatCard({
  label,
  icon: Icon,
  accent = 'brand',
  value,
  hint,
  valueClassName = 'text-slate-100',
}) {
  const accentClasses =
    accent === 'accent'
      ? 'bg-accent-500/10 text-accent-400'
      : 'bg-brand-500/10 text-brand-300'

  const hasValue = value !== undefined && value !== null && value !== ''

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p
            className={[
              'mt-2 text-2xl font-semibold tracking-tight',
              hasValue ? valueClassName : 'text-slate-500',
            ].join(' ')}
          >
            {hasValue ? value : '—'}
          </p>
        </div>
        {Icon && (
          <div className={['flex h-10 w-10 items-center justify-center rounded-lg', accentClasses].join(' ')}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-600">{hint ?? 'Nessun dato disponibile'}</p>
    </Card>
  )
}
