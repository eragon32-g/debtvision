import { recoveryPriorityStyles, recoveryTypeLabels } from '../utils/recoveryPlanEngine.js'

export default function RecoveryActionItem({ action, compact = false }) {
  const priorityStyle = recoveryPriorityStyles[action.priority] ?? recoveryPriorityStyles.low
  const typeLabel = recoveryTypeLabels[action.type] ?? action.type

  return (
    <div
      className={[
        'rounded-lg border border-slate-800/80 bg-slate-900/50',
        compact ? 'p-3' : 'p-4',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={[
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            priorityStyle,
          ].join(' ')}
        >
          {action.priority}
        </span>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          {typeLabel}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-100">{action.title}</p>
      <p className="mt-1 text-sm text-slate-400">{action.description}</p>
      {!compact && action.impact && (
        <p className="mt-2 text-xs text-brand-300">
          <span className="font-medium text-slate-500">Impatto: </span>
          {action.impact}
        </p>
      )}
    </div>
  )
}
