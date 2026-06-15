import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { insightTypeStyles } from '../utils/financialInsights.js'

const typeIcons = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
}

export default function InsightItem({ insight, compact = false }) {
  const styles = insightTypeStyles[insight.type] ?? insightTypeStyles.info
  const Icon = typeIcons[insight.type] ?? Info

  return (
    <div
      className={[
        'rounded-lg border p-3',
        styles.border,
        styles.bg,
        compact ? '' : 'p-4',
      ].join(' ')}
    >
      <div className="flex gap-3">
        <div className={['mt-0.5 shrink-0', styles.icon].join(' ')}>
          <Icon size={compact ? 16 : 18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-100">{insight.title}</p>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                styles.badge,
              ].join(' ')}
            >
              {insight.priority}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{insight.message}</p>
        </div>
      </div>
    </div>
  )
}
