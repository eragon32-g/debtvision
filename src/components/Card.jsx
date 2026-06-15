export default function Card({ children, className = '' }) {
  return (
    <div
      className={[
        'rounded-xl border border-slate-800/80 bg-slate-900/50 shadow-card',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
