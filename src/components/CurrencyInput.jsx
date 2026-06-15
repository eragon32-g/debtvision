// Input numerico in euro, riutilizzabile e coerente col tema scuro.
export default function CurrencyInput({ id, label, value, onChange }) {
  const displayValue = value === 0 || value === undefined || value === null ? '' : value

  const handleChange = (event) => {
    const raw = event.target.value
    if (raw === '') {
      onChange(0)
      return
    }
    const parsed = parseFloat(raw)
    onChange(Number.isFinite(parsed) ? parsed : 0)
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
          €
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={displayValue}
          onChange={handleChange}
          placeholder="0,00"
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 pl-7 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
        />
      </div>
    </div>
  )
}
