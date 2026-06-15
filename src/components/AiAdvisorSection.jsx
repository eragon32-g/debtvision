import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, Shield } from 'lucide-react'
import Card from './Card.jsx'
import { requestAiFinancialAnalysis, AiAdvisorError } from '../utils/aiAdvisorApi.js'
import { createAnalysisSnapshot } from '../utils/financialInsights.js'

const STATUS_STYLES = {
  critico: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  fragile: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  stabile: 'bg-brand-500/10 text-brand-300 ring-brand-500/30',
  solido: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
}

const STATUS_LABELS = {
  critico: 'CRITICO',
  fragile: 'FRAGILE',
  stabile: 'STABILE',
  solido: 'SOLIDO',
}

function BulletBlock({ title, items, emptyText = 'Nessun elemento.' }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-200">{title}</h4>
      {items?.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="rounded-lg border border-slate-800/80 bg-slate-900/50 px-3 py-2 text-sm text-slate-300"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  )
}

export default function AiAdvisorSection({ data }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const snapshot = createAnalysisSnapshot(data)
      const analysis = await requestAiFinancialAnalysis(snapshot)
      setResult(analysis)
    } catch (err) {
      const message =
        err instanceof AiAdvisorError
          ? err.message
          : 'Errore imprevisto durante l\'analisi AI.'
      setError(message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const statusStyle = result ? STATUS_STYLES[result.situationStatus] ?? STATUS_STYLES.stabile : ''

  return (
    <Card className="mb-6 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">AI Financial Advisor</h3>
          <p className="text-xs text-slate-500">
            Analisi aggiuntiva basata sullo snapshot — non sostituisce insight locali o piano di recupero
          </p>
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-slate-800/80 bg-slate-900/50 px-3 py-2.5 text-xs text-slate-400">
        I dati vengono inviati al provider AI solo quando premi Analizza con AI. Non vengono salvati nel
        database in questa fase.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? 'Analisi in corso…' : 'Analizza con AI'}
        </button>
        {loading && (
          <span className="text-xs text-slate-500">
            Analisi in corso, può richiedere fino a 60-90 secondi…
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
          <p className="text-sm text-rose-200">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 border-t border-slate-800/60 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sintesi AI</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{result.summary}</p>
            </div>
            <span
              className={[
                'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ring-1',
                statusStyle,
              ].join(' ')}
            >
              {STATUS_LABELS[result.situationStatus] ?? result.situationStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BulletBlock title="Rischi principali" items={result.keyRisks} />
            <BulletBlock title="Segnali positivi" items={result.positiveSignals} />
            <BulletBlock title="Azioni immediate" items={result.immediateActions} />
            <BulletBlock title="Priorità debiti" items={result.debtPriorities} />
            <BulletBlock title="Consigli cashflow" items={result.cashflowAdvice} />
            <BulletBlock title="Consigli carte" items={result.cardAdvice} />
            <BulletBlock title="Consigli rateizzazioni variabili" items={result.variableInstallmentAdvice} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <BulletBlock title="Piano AI 30 giorni" items={result.thirtyDayPlan} />
            <BulletBlock title="Piano AI 90 giorni" items={result.ninetyDayPlan} />
            <BulletBlock title="Piano AI 12 mesi" items={result.twelveMonthPlan} />
          </div>

          {result.finalWarning && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-3">
              <Shield size={18} className="mt-0.5 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-100">{result.finalWarning}</p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Questa analisi AI è un supporto organizzativo e non costituisce consulenza finanziaria,
            legale o fiscale certificata. Valuta sempre le decisioni con attenzione e, se necessario,
            con un professionista qualificato.
          </p>
        </div>
      )}
    </Card>
  )
}
