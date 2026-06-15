import { useMemo, useState } from 'react'
import {
  FlaskConical,
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Shield,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import CurrencyInput from '../components/CurrencyInput.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useFinancialData } from '../hooks/useFinancialData.js'
import { createAnalysisSnapshot } from '../utils/financialInsights.js'
import { formatCurrency } from '../utils/financeCalculations.js'
import {
  SCENARIO_TYPES,
  SCENARIO_LABELS,
  createScenarioSnapshot,
  compareSnapshots,
  getScenarioInsights,
  getDefaultScenarioParams,
} from '../utils/scenarioSimulator.js'

const inputClass =
  'w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40'

const scenarioTypeList = Object.values(SCENARIO_TYPES)

function TextField({ id, label, value, onChange, placeholder, type = 'text', min, max }) {
  const isNumber = type === 'number'
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        value={
          isNumber && (value === 0 || value === undefined || value === null) ? '' : value ?? ''
        }
        placeholder={placeholder}
        onChange={(e) => {
          if (isNumber) {
            const raw = e.target.value
            if (raw === '') return onChange(0)
            const parsed = parseFloat(raw)
            return onChange(Number.isFinite(parsed) ? parsed : 0)
          }
          onChange(e.target.value)
        }}
        className={[inputClass, type === 'date' ? '[color-scheme:dark]' : ''].join(' ')}
      />
    </div>
  )
}

function SelectField({ id, label, value, onChange, options }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={[inputClass, 'appearance-none'].join(' ')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function formatRowValue(row, which) {
  const value = row[which]
  if (row.format === 'currency') return formatCurrency(value)
  if (row.format === 'percent') return `${value.toFixed(1)}%`
  if (row.format === 'number') return String(Math.round(value))
  if (row.format === 'days') return `${value} ${value === 1 ? 'giorno' : 'giorni'}`
  return String(value)
}

function DiffBadge({ sentiment, diffFormatted }) {
  if (diffFormatted === '—') {
    return <span className="text-xs text-slate-500">—</span>
  }
  const Icon = sentiment === 'positive' ? TrendingUp : sentiment === 'negative' ? TrendingDown : Minus
  const color =
    sentiment === 'positive'
      ? 'text-emerald-400'
      : sentiment === 'negative'
        ? 'text-rose-400'
        : 'text-slate-400'
  return (
    <span className={['inline-flex items-center gap-1 text-sm font-medium', color].join(' ')}>
      <Icon size={14} />
      {diffFormatted}
    </span>
  )
}

function ScenarioForm({ type, params, onChange, data }) {
  const update = (key, value) => onChange({ ...params, [key]: value })

  const selectedProduct = (data.variableInstallmentProducts ?? []).find(
    (p) => p.id === params.productId,
  )
  const installments = selectedProduct?.installments ?? []

  const calcMonthly =
    type === SCENARIO_TYPES.NEW_INSTALLMENT && params.installmentsCount > 0
      ? Math.round((params.totalAmount / params.installmentsCount) * 100) / 100
      : 0

  switch (type) {
    case SCENARIO_TYPES.NEW_INSTALLMENT:
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="sim-inst-desc"
            label="Descrizione"
            value={params.description}
            onChange={(v) => update('description', v)}
            placeholder="Es. Nuovo elettrodomestico"
          />
          <CurrencyInput
            id="sim-inst-total"
            label="Importo totale"
            value={params.totalAmount}
            onChange={(v) => update('totalAmount', v)}
          />
          <TextField
            id="sim-inst-count"
            label="Numero rate"
            type="number"
            min={1}
            value={params.installmentsCount}
            onChange={(v) => update('installmentsCount', v)}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">Rata mensile calcolata</p>
            <p className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-sm font-semibold text-brand-300">
              {formatCurrency(calcMonthly)}
            </p>
          </div>
          <TextField
            id="sim-inst-day"
            label="Giorno addebito"
            type="number"
            min={1}
            max={31}
            value={params.billingDay}
            onChange={(v) => update('billingDay', v)}
            placeholder="1-31"
          />
          <TextField
            id="sim-inst-start"
            label="Data inizio"
            type="date"
            value={params.startDate}
            onChange={(v) => update('startDate', v)}
          />
        </div>
      )

    case SCENARIO_TYPES.NEW_LOAN:
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="sim-loan-name"
            label="Nome"
            value={params.name}
            onChange={(v) => update('name', v)}
            placeholder="Es. Prestito personale"
          />
          <CurrencyInput
            id="sim-loan-remaining"
            label="Importo residuo"
            value={params.remainingAmount}
            onChange={(v) => update('remainingAmount', v)}
          />
          <CurrencyInput
            id="sim-loan-payment"
            label="Rata mensile"
            value={params.monthlyPayment}
            onChange={(v) => update('monthlyPayment', v)}
          />
          <TextField
            id="sim-loan-day"
            label="Giorno addebito"
            type="number"
            min={1}
            max={31}
            value={params.billingDay}
            onChange={(v) => update('billingDay', v)}
          />
          <TextField
            id="sim-loan-start"
            label="Data inizio"
            type="date"
            value={params.startDate}
            onChange={(v) => update('startDate', v)}
          />
          <TextField
            id="sim-loan-end"
            label="Data fine"
            type="date"
            value={params.endDate}
            onChange={(v) => update('endDate', v)}
          />
        </div>
      )

    case SCENARIO_TYPES.CARD_USAGE:
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="sim-card-id"
            label="Carta selezionata"
            value={params.cardId}
            onChange={(v) => update('cardId', v)}
            options={(data.cards ?? []).map((c) => ({
              value: c.id,
              label: `${c.name} (utilizzato: ${formatCurrency(c.usedLimit)})`,
            }))}
          />
          <CurrencyInput
            id="sim-card-usage"
            label="Importo utilizzo aggiuntivo"
            value={params.additionalUsage}
            onChange={(v) => update('additionalUsage', v)}
          />
        </div>
      )

    case SCENARIO_TYPES.LOAN_PAYOFF:
      return (
        <SelectField
          id="sim-loan-payoff"
          label="Finanziamento da estinguere"
          value={params.loanId}
          onChange={(v) => update('loanId', v)}
          options={(data.loans ?? []).map((l) => ({
            value: l.id,
            label: `${l.name} — rata ${formatCurrency(l.monthlyPayment)}`,
          }))}
        />
      )

    case SCENARIO_TYPES.INSTALLMENT_PAYOFF:
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="sim-vip-product"
            label="Prodotto"
            value={params.productId}
            onChange={(v) => {
              const product = (data.variableInstallmentProducts ?? []).find((p) => p.id === v)
              onChange({
                ...params,
                productId: v,
                installmentId: product?.installments?.[0]?.id ?? '',
              })
            }}
            options={(data.variableInstallmentProducts ?? []).map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />
          <SelectField
            id="sim-vip-inst"
            label="Rateizzazione interna"
            value={params.installmentId}
            onChange={(v) => update('installmentId', v)}
            options={installments.map((inst) => ({
              value: inst.id,
              label: `${inst.description} — ${formatCurrency(inst.monthlyPayment)}/mese`,
            }))}
          />
        </div>
      )

    case SCENARIO_TYPES.INCOME_INCREASE:
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="sim-income-desc"
            label="Descrizione"
            value={params.description}
            onChange={(v) => update('description', v)}
            placeholder="Es. Bonus mensile"
          />
          <CurrencyInput
            id="sim-income-amount"
            label="Importo aumento mensile"
            value={params.amount}
            onChange={(v) => update('amount', v)}
          />
          <TextField
            id="sim-income-day"
            label="Giorno del mese"
            type="number"
            min={1}
            max={31}
            value={params.day}
            onChange={(v) => update('day', v)}
          />
        </div>
      )

    case SCENARIO_TYPES.EXPENSE_REDUCTION:
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={params.useManualDescription}
                onChange={(e) => update('useManualDescription', e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-brand-500"
              />
              Usa descrizione manuale invece della spesa esistente
            </label>
          </div>
          {params.useManualDescription ? (
            <TextField
              id="sim-exp-desc"
              label="Descrizione manuale"
              value={params.description}
              onChange={(v) => update('description', v)}
              placeholder="Es. Bollette"
            />
          ) : (
            <SelectField
              id="sim-exp-id"
              label="Spesa selezionata"
              value={params.expenseId}
              onChange={(v) => update('expenseId', v)}
              options={(data.fixedExpenseEntries ?? []).map((e) => ({
                value: e.id,
                label: `${e.description} — ${formatCurrency(e.amount)}`,
              }))}
            />
          )}
          <CurrencyInput
            id="sim-exp-reduction"
            label="Importo riduzione mensile"
            value={params.reductionAmount}
            onChange={(v) => update('reductionAmount', v)}
          />
        </div>
      )

    default:
      return null
  }
}

function canSimulate(type, params, data) {
  switch (type) {
    case SCENARIO_TYPES.NEW_INSTALLMENT:
      return params.description?.trim() && params.totalAmount > 0 && params.installmentsCount > 0
    case SCENARIO_TYPES.NEW_LOAN:
      return params.name?.trim() && params.monthlyPayment > 0
    case SCENARIO_TYPES.CARD_USAGE:
      return params.cardId && params.additionalUsage > 0
    case SCENARIO_TYPES.LOAN_PAYOFF:
      return !!params.loanId
    case SCENARIO_TYPES.INSTALLMENT_PAYOFF:
      return !!params.productId && !!params.installmentId
    case SCENARIO_TYPES.INCOME_INCREASE:
      return params.description?.trim() && params.amount > 0
    case SCENARIO_TYPES.EXPENSE_REDUCTION:
      return (
        params.reductionAmount > 0 &&
        (params.useManualDescription
          ? params.description?.trim()
          : params.expenseId)
      )
    default:
      return false
  }
}

function formNeedsData(type, data) {
  switch (type) {
    case SCENARIO_TYPES.CARD_USAGE:
      return (data.cards ?? []).length === 0
    case SCENARIO_TYPES.LOAN_PAYOFF:
      return (data.loans ?? []).length === 0
    case SCENARIO_TYPES.INSTALLMENT_PAYOFF: {
      const hasInstallments = (data.variableInstallmentProducts ?? []).some(
        (p) => (p.installments ?? []).length > 0,
      )
      return !hasInstallments
    }
    case SCENARIO_TYPES.EXPENSE_REDUCTION:
      return false
    default:
      return false
  }
}

export default function ScenarioSimulator() {
  const { data } = useFinancialData()
  const [scenarioType, setScenarioType] = useState(SCENARIO_TYPES.NEW_INSTALLMENT)
  const [params, setParams] = useState(() => getDefaultScenarioParams(SCENARIO_TYPES.NEW_INSTALLMENT, data))
  const [scenarioSnapshot, setScenarioSnapshot] = useState(null)
  const [appliedLabel, setAppliedLabel] = useState('')

  const currentSnapshot = useMemo(() => createAnalysisSnapshot(data), [data])

  const comparison = useMemo(() => {
    if (!scenarioSnapshot) return null
    return compareSnapshots(currentSnapshot, scenarioSnapshot)
  }, [currentSnapshot, scenarioSnapshot])

  const scenarioInsights = useMemo(() => {
    if (!comparison || !scenarioSnapshot) return null
    return getScenarioInsights(comparison, scenarioSnapshot)
  }, [comparison, scenarioSnapshot])

  const handleTypeChange = (type) => {
    setScenarioType(type)
    setParams(getDefaultScenarioParams(type, data))
    setScenarioSnapshot(null)
    setAppliedLabel('')
  }

  const handleSimulate = () => {
    const scenario = { type: scenarioType, params }
    const snapshot = createScenarioSnapshot(data, scenario)
    setScenarioSnapshot(snapshot)
    setAppliedLabel(SCENARIO_LABELS[scenarioType])
  }

  const handleReset = () => {
    setScenarioSnapshot(null)
    setAppliedLabel('')
    setParams(getDefaultScenarioParams(scenarioType, data))
  }

  const hasFinancialData =
    (data.incomeEntries ?? []).length > 0 ||
    (data.loans ?? []).length > 0 ||
    (data.cards ?? []).length > 0 ||
    (data.variableInstallmentProducts ?? []).length > 0 ||
    (data.fixedExpenseEntries ?? []).length > 0

  const simulateReady = canSimulate(scenarioType, params, data)
  const missingData = formNeedsData(scenarioType, data)

  if (!hasFinancialData) {
    return (
      <div>
        <PageHeader
          title="Scenario Simulator"
          subtitle="Confronta la situazione attuale con uno scenario ipotetico"
        />
        <EmptyState
          icon={FlaskConical}
          title="Nessun dato finanziario"
          description='Carica i dati in Financial Data (usa "Carica esempio") per simulare scenari decisionali.'
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Scenario Simulator"
        subtitle="Confronta la situazione attuale con uno scenario ipotetico — i dati reali non vengono modificati"
        actions={
          <button
            type="button"
            disabled
            title="Disponibile in una fase futura"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-500 opacity-60"
          >
            Applica scenario ai dati reali
          </button>
        }
      />

      {/* Configurazione scenario */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <FlaskConical size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Configura scenario</h3>
            <p className="text-xs text-slate-500">Lo scenario resta temporaneo e non salva su localStorage</p>
          </div>
        </div>

        <div className="mb-4 max-w-md">
          <SelectField
            id="scenario-type"
            label="Tipo scenario"
            value={scenarioType}
            onChange={handleTypeChange}
            options={scenarioTypeList.map((t) => ({ value: t, label: SCENARIO_LABELS[t] }))}
          />
        </div>

        {missingData ? (
          <p className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 py-4 text-center text-sm text-amber-300">
            Nessun elemento disponibile per questo tipo di scenario. Aggiungi i dati necessari in Financial Data.
          </p>
        ) : (
          <ScenarioForm type={scenarioType} params={params} onChange={setParams} data={data} />
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={!simulateReady || missingData}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={16} />
            Simula scenario
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <RotateCcw size={16} />
            Reset scenario
          </button>
        </div>
      </Card>

      {/* Confronto */}
      {comparison && (
        <>
          <Card className="mb-6 p-5">
            <h3 className="mb-1 text-sm font-semibold text-slate-100">Confronto situazione</h3>
            <p className="mb-4 text-xs text-slate-500">
              Scenario simulato: <span className="text-brand-300">{appliedLabel}</span>
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 pr-4 font-medium">Indicatore</th>
                    <th className="py-2.5 pr-4 text-right font-medium">Attuale</th>
                    <th className="py-2.5 pr-4 text-right font-medium">Scenario</th>
                    <th className="py-2.5 text-right font-medium">Differenza</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-slate-800/50 text-slate-300 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-medium text-slate-200">{row.label}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {formatRowValue(row, 'current')}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-slate-100">
                        {formatRowValue(row, 'scenario')}
                      </td>
                      <td className="py-2.5 text-right">
                        <DiffBadge sentiment={row.sentiment} diffFormatted={row.diffFormatted} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Insight scenario */}
          {scenarioInsights && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ThumbsUp size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-100">Cosa migliora</h3>
                </div>
                {scenarioInsights.improves.length === 0 ? (
                  <p className="text-sm text-slate-500">Nessun indicatore migliora in questo scenario.</p>
                ) : (
                  <ul className="space-y-2">
                    {scenarioInsights.improves.map((item, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-200"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ThumbsDown size={18} className="text-rose-400" />
                  <h3 className="text-sm font-semibold text-slate-100">Cosa peggiora</h3>
                </div>
                {scenarioInsights.worsens.length === 0 ? (
                  <p className="text-sm text-slate-500">Nessun indicatore peggiora in questo scenario.</p>
                ) : (
                  <ul className="space-y-2">
                    {scenarioInsights.worsens.map((item, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-200"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-100">Rischio principale</h3>
                </div>
                <p className="text-sm text-slate-300">{scenarioInsights.mainRisk}</p>
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Shield size={18} className="text-brand-300" />
                  <h3 className="text-sm font-semibold text-slate-100">Raccomandazione prudente</h3>
                </div>
                <p className="text-sm text-slate-300">{scenarioInsights.recommendation}</p>
              </Card>
            </div>
          )}
        </>
      )}

      {!scenarioSnapshot && (
        <Card className="p-5">
          <p className="text-center text-sm text-slate-500">
            Configura uno scenario e premi &quot;Simula scenario&quot; per vedere il confronto con la situazione attuale.
          </p>
        </Card>
      )}
    </div>
  )
}
