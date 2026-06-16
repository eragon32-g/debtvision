import { useState, useEffect } from 'react'
import { parseMoney, roundMoney } from '../utils/money.js'

// Input monetario: accetta virgola o punto, salva come number decimale.
export default function CurrencyInput({ id, label, value, onChange }) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      const n = roundMoney(value)
      setText(n === 0 ? '' : String(n).replace('.', ','))
    }
  }, [value, focused])

  const handleFocus = () => {
    setFocused(true)
    const n = roundMoney(value)
    setText(n === 0 ? '' : String(n).replace('.', ','))
  }

  const handleBlur = () => {
    setFocused(false)
    onChange(parseMoney(text))
  }

  const handleChange = (event) => {
    const raw = event.target.value
    if (raw !== '' && !/^[\d.,]*$/.test(raw)) return

    setText(raw)

    if (raw === '' || raw === ',' || raw === '.') {
      onChange(0)
      return
    }

    // Consenti digitazione parziale tipo "1800," prima dei centesimi
    if (/[.,]$/.test(raw)) return

    onChange(parseMoney(raw))
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
          type="text"
          inputMode="decimal"
          value={text}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0,00"
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 pl-7 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
        />
      </div>
    </div>
  )
}
