import { Droplets } from 'lucide-react'
import Card from './Card.jsx'
import CurrencyInput from './CurrencyInput.jsx'

const liquidityFields = [
  { key: 'primaryAccount', label: 'Conto principale' },
  { key: 'secondaryAccount', label: 'Conto secondario' },
  { key: 'cash', label: 'Contanti disponibili' },
  { key: 'emergencyFund', label: 'Fondo emergenza' },
  { key: 'otherLiquidAssets', label: 'Altre disponibilità immediate' },
  { key: 'savings', label: 'Risparmi accantonati' },
]

export default function LiquiditySection({ liquidity, onChange }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
          <Droplets size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Liquidità</h3>
          <p className="text-xs text-slate-500">Conti, contanti, fondo emergenza e risparmi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {liquidityFields.map((field) => (
          <CurrencyInput
            key={field.key}
            id={`liquidity-${field.key}`}
            label={field.label}
            value={liquidity?.[field.key] ?? 0}
            onChange={(value) => onChange(field.key, value)}
          />
        ))}
      </div>
    </Card>
  )
}
