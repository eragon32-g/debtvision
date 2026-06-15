import { TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, ShieldAlert, Banknote, CreditCard, Repeat, HeartPulse, Landmark, ClipboardList, CalendarDays, FileDown } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import InsightItem from '../components/InsightItem.jsx'
import RecoveryActionItem from '../components/RecoveryActionItem.jsx'
import { useFinancialData } from '../hooks/useFinancialData.js'
import {
  getTotalIncome,
  getTotalFixedExpenses,
  getMonthlyMargin,
  getSavingsCoverageMonths,
  getExpensePercentage,
  getFinancialStatus,
  getTotalLoansDebt,
  getTotalLoansMonthlyPayment,
  getDebtLoadRatio,
  getDebtLoadRatioClass,
  getTotalCardLimit,
  getTotalCardUsed,
  getAvailableCardLimit,
  getCreditUtilizationPercentage,
  getCreditStressScore,
  getCreditStressClass,
  getTotalVariableDebt,
  getTotalVariableMonthlyPayment,
  getInstallmentEndEvents,
  getMonthlyPressureForecast,
  getTotalLiquidity,
  getTotalAssets,
  getTotalDebt,
  getNetWorth,
  getNetDebt,
  getSurvivalMonths,
  getWealthEvaluation,
  formatCurrency,
  formatMonths,
  formatPercentage,
} from '../utils/financeCalculations.js'
import {
  createAnalysisSnapshot,
  getInsightsByType,
  healthStatusStyles,
} from '../utils/financialInsights.js'
import { overdraftRiskStyles } from '../utils/cashflowEngine.js'
import { generateDebtVisionPdf } from '../utils/pdfReportGenerator.js'
import AiAdvisorSection from '../components/AiAdvisorSection.jsx'

// Stili e icone per ciascun livello di stato finanziario
const statusConfig = {
  stabile: {
    icon: ShieldCheck,
    title: 'Situazione stabile',
    description: 'Il margine mensile è superiore a 300 €. La gestione è sotto controllo.',
    badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    iconWrap: 'bg-emerald-500/10 text-emerald-300',
  },
  attenzione: {
    icon: AlertTriangle,
    title: 'Situazione da monitorare',
    description: 'Il margine mensile è compreso tra 0 € e 300 €. Margine ridotto: tieni sotto controllo le spese.',
    badge: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
    iconWrap: 'bg-amber-500/10 text-amber-300',
  },
  critico: {
    icon: ShieldAlert,
    title: 'Situazione critica',
    description: 'Il margine mensile è negativo: le spese superano le entrate. Intervieni il prima possibile.',
    badge: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
    iconWrap: 'bg-rose-500/10 text-rose-300',
  },
}

// Configurazione per la classificazione del Debt Load Ratio
const debtLoadConfig = {
  ottimo: {
    badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    bar: 'bg-emerald-500',
    text: 'L\'incidenza delle rate sul reddito è molto bassa: ottima capacità di sostenere i finanziamenti.',
  },
  buono: {
    badge: 'bg-brand-500/10 text-brand-300 ring-brand-500/30',
    bar: 'bg-brand-500',
    text: 'Le rate sono sostenibili. La situazione è equilibrata, ma evita di aggiungere nuovi finanziamenti senza valutazione.',
  },
  attenzione: {
    badge: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
    bar: 'bg-amber-500',
    text: 'Le rate assorbono una quota rilevante del reddito. Valuta di ridurre il debito prima di assumere nuovi impegni.',
  },
  critico: {
    badge: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
    bar: 'bg-rose-500',
    text: 'Le rate incidono in modo eccessivo sul reddito. È consigliabile rivedere o consolidare i finanziamenti al più presto.',
  },
}

// Configurazione per la classificazione del Credit Stress Score
const creditStressConfig = {
  ottimo: {
    badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    bar: 'bg-emerald-500',
    text: 'Esposizione al credito molto contenuta: ampi margini disponibili su carte e fidi.',
  },
  buono: {
    badge: 'bg-brand-500/10 text-brand-300 ring-brand-500/30',
    bar: 'bg-brand-500',
    text: 'Esposizione sotto controllo. L\'utilizzo del credito è equilibrato rispetto alle disponibilità.',
  },
  attenzione: {
    badge: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
    bar: 'bg-amber-500',
    text: 'Esposizione elevata: stai utilizzando una quota importante del credito disponibile. Valuta di rientrare.',
  },
  critico: {
    badge: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
    bar: 'bg-rose-500',
    text: 'Esposizione critica: il credito utilizzato è molto vicino ai limiti disponibili. Intervieni con priorità.',
  },
}

function SummaryRow({ label, value, valueClassName = 'text-slate-100' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/60 py-3 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={['text-sm font-semibold', valueClassName].join(' ')}>{value}</span>
    </div>
  )
}

export default function Report() {
  const { data } = useFinancialData()
  const snapshot = createAnalysisSnapshot(data)
  const {
    financialHealthScore,
    financialHealthStatus,
    insights,
    recoveryPlan,
    cashflow,
    monthlyTimeline,
    minimumBalance,
    negativeDays,
    overdraftRisk,
    cashflowRecommendations,
  } = snapshot
  const healthStyle = healthStatusStyles[financialHealthStatus.level]
  const riskStyle = overdraftRiskStyles[overdraftRisk?.level ?? 'LOW']
  const riskInsights = getInsightsByType(insights, 'danger').concat(
    getInsightsByType(insights, 'warning'),
  )
  const positiveInsights = getInsightsByType(insights, 'positive')

  const totalIncome = getTotalIncome(data)
  const totalExpenses = getTotalFixedExpenses(data)
  const margin = getMonthlyMargin(data)
  const coverage = getSavingsCoverageMonths(data)
  const expensePercentage = getExpensePercentage(data)
  const status = getFinancialStatus(data)
  const config = statusConfig[status.level]
  const StatusIcon = config.icon

  const loansDebt = getTotalLoansDebt(data)
  const loansPayment = getTotalLoansMonthlyPayment(data)
  const debtLoadRatio = getDebtLoadRatio(data)
  const debtLoadClass = getDebtLoadRatioClass(data)
  const debtLoad = debtLoadConfig[debtLoadClass.level]

  const cardsCount = (data.cards ?? []).length
  const cardLimit = getTotalCardLimit(data)
  const cardUsed = getTotalCardUsed(data)
  const cardAvailable = getAvailableCardLimit(data)
  const creditUtilization = getCreditUtilizationPercentage(data)
  const creditStressScore = getCreditStressScore(data)
  const creditStressClass = getCreditStressClass(data)
  const creditStress = creditStressConfig[creditStressClass.level]

  const variableProductsCount = (data.variableInstallmentProducts ?? []).length
  const variableDebt = getTotalVariableDebt(data)
  const variableMonthly = getTotalVariableMonthlyPayment(data)
  const endEvents = getInstallmentEndEvents(data)
  const nextRelief = endEvents[0] ?? null
  const firstFiveEvents = endEvents.slice(0, 5)
  const pressureDrop = getMonthlyPressureForecast(data, 24).find((row) => row.reduction > 0) ?? null

  const totalLiquidity = getTotalLiquidity(data)
  const totalAssets = getTotalAssets(data)
  const totalDebt = getTotalDebt(data)
  const netWorth = getNetWorth(data)
  const netDebt = getNetDebt(data)
  const survivalMonths = getSurvivalMonths(data)
  const wealthEval = getWealthEvaluation(data)
  const wealthStyle = healthStatusStyles[wealthEval.level]

  const handleDownloadPdf = () => {
    try {
      const freshSnapshot = createAnalysisSnapshot(data)
      generateDebtVisionPdf(freshSnapshot)
    } catch (err) {
      console.error(err)
      window.alert('Impossibile generare il PDF. Riprova dopo aver caricato i dati finanziari.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Report"
        subtitle="Riepilogo e valutazione della tua situazione finanziaria"
        actions={
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
          >
            <FileDown size={16} />
            Scarica PDF
          </button>
        }
      />

      {/* AI Financial Advisor (Fase 12) */}
      <AiAdvisorSection data={data} />

      {/* Banner di stato */}
      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={['flex h-12 w-12 items-center justify-center rounded-xl', config.iconWrap].join(' ')}>
              <StatusIcon size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">{config.title}</h3>
              <p className="mt-0.5 max-w-xl text-sm text-slate-400">{config.description}</p>
            </div>
          </div>
          <span
            className={[
              'inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-bold tracking-wide ring-1',
              config.badge,
            ].join(' ')}
          >
            {status.label}
          </span>
        </div>
      </Card>

      {/* Analisi Finanziaria (Fase 6) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <HeartPulse size={18} />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Analisi Finanziaria</h3>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">Financial Health Score</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={['text-3xl font-bold tabular-nums', healthStyle.text].join(' ')}>
                {financialHealthScore}
              </span>
              <span className="text-slate-500">/100</span>
            </div>
          </div>
          <span
            className={[
              'inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-bold tracking-wide ring-1',
              healthStyle.badge,
            ].join(' ')}
          >
            {financialHealthStatus.label}
          </span>
        </div>

        <div className="mb-6 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={['h-full rounded-full transition-all', healthStyle.bar].join(' ')}
            style={{ width: `${financialHealthScore}%` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-slate-300">Rischi principali</p>
            {riskInsights.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-800 py-4 text-center text-sm text-slate-500">
                Nessun rischio rilevato.
              </p>
            ) : (
              <div className="space-y-2">
                {riskInsights.map((insight) => (
                  <InsightItem key={insight.id} insight={insight} compact />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-slate-300">Punti positivi</p>
            {positiveInsights.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-800 py-4 text-center text-sm text-slate-500">
                Nessun punto positivo evidenziato.
              </p>
            ) : (
              <div className="space-y-2">
                {positiveInsights.map((insight) => (
                  <InsightItem key={insight.id} insight={insight} compact />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-800/60 pt-5">
          <p className="mb-3 text-sm font-medium text-slate-300">Tutti gli insight</p>
          <div className="space-y-2">
            {insights.map((insight) => (
              <InsightItem key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      </Card>

      {/* Piano Operativo (Fase 8) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <ClipboardList size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Piano Operativo</h3>
            <p className="text-xs text-slate-500">
              Piano di recupero prudente basato sui tuoi dati. Non sostituisce consulenza professionale.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-200">Piano 30 giorni</h4>
            <div className="space-y-3">
              {(recoveryPlan?.thirtyDays ?? []).map((action) => (
                <RecoveryActionItem key={action.id} action={action} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-200">Piano 90 giorni</h4>
            <div className="space-y-3">
              {(recoveryPlan?.ninetyDays ?? []).map((action) => (
                <RecoveryActionItem key={action.id} action={action} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-200">Piano 12 mesi</h4>
            <div className="space-y-3">
              {(recoveryPlan?.twelveMonths ?? []).map((action) => (
                <RecoveryActionItem key={action.id} action={action} />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Calendario Finanziario (Fase 9) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Calendario Finanziario</h3>
              <p className="text-xs text-slate-500">
                Simulazione cashflow mensile e raccomandazioni operative
              </p>
            </div>
          </div>
          <span
            className={[
              'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ring-1',
              riskStyle.badge,
            ].join(' ')}
          >
            Rischio: {overdraftRisk?.label ?? '—'}
          </span>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-800/40 p-3">
            <p className="text-xs text-slate-400">Saldo minimo previsto</p>
            <p
              className={[
                'mt-1 text-sm font-semibold',
                minimumBalance < 0 ? 'text-rose-400' : 'text-slate-100',
              ].join(' ')}
            >
              {formatCurrency(minimumBalance)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3">
            <p className="text-xs text-slate-400">Giorno critico</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {cashflow?.minimumBalanceDay > 0 ? `Giorno ${cashflow.minimumBalanceDay}` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/40 p-3">
            <p className="text-xs text-slate-400">Giorni in negativo</p>
            <p
              className={[
                'mt-1 text-sm font-semibold',
                negativeDays.length > 0 ? 'text-rose-400' : 'text-emerald-400',
              ].join(' ')}
            >
              {negativeDays.length === 0 ? 'Nessuno' : negativeDays.join(', ')}
            </p>
          </div>
        </div>

        {monthlyTimeline.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <p className="mb-2 text-sm font-medium text-slate-300">Timeline mensile</p>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-4 font-medium">Giorno</th>
                  <th className="py-2 pr-4 font-medium">Evento</th>
                  <th className="py-2 pr-4 text-right font-medium">Importo</th>
                  <th className="py-2 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTimeline.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800/50 text-slate-300 last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-200">{row.dateDay}</td>
                    <td className="py-2 pr-4">{row.description}</td>
                    <td
                      className={[
                        'py-2 pr-4 text-right tabular-nums',
                        row.direction === 'income' ? 'text-emerald-400' : 'text-rose-400',
                      ].join(' ')}
                    >
                      {row.direction === 'income' ? '+' : '−'}
                      {formatCurrency(row.amount)}
                    </td>
                    <td
                      className={[
                        'py-2 text-right tabular-nums font-medium',
                        row.resultingBalance < 0 ? 'text-rose-400' : 'text-slate-100',
                      ].join(' ')}
                    >
                      {formatCurrency(row.resultingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">Raccomandazioni operative</p>
          {(cashflowRecommendations ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-800 py-4 text-center text-sm text-slate-500">
              Nessuna raccomandazione specifica.
            </p>
          ) : (
            <ul className="space-y-2">
              {cashflowRecommendations.map((rec, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-slate-800/80 bg-slate-900/50 px-3 py-2 text-sm text-slate-300"
                >
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Riepilogo numerico */}
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-100">Riepilogo finanziario</h3>
          <SummaryRow label="Entrate totali" value={formatCurrency(totalIncome)} />
          <SummaryRow label="Spese totali" value={formatCurrency(totalExpenses)} />
          <SummaryRow
            label="Margine mensile"
            value={formatCurrency(margin)}
            valueClassName={margin < 0 ? 'text-rose-400' : 'text-emerald-400'}
          />
          <SummaryRow label="Copertura risparmi" value={formatMonths(coverage)} />
        </Card>

        {/* Indicatori */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-100">Indicatori</h3>

          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-400">Incidenza delle spese sulle entrate</span>
              <span className="font-semibold text-slate-200">{formatPercentage(expensePercentage)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={[
                  'h-full rounded-full transition-all',
                  expensePercentage > 100
                    ? 'bg-rose-500'
                    : expensePercentage > 75
                      ? 'bg-amber-500'
                      : 'bg-brand-500',
                ].join(' ')}
                style={{ width: `${Math.min(expensePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-3">
            <div className={['flex h-9 w-9 items-center justify-center rounded-lg', margin < 0 ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'].join(' ')}>
              {margin < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
            </div>
            <div>
              <p className="text-xs text-slate-400">Margine mensile</p>
              <p className={['text-sm font-semibold', margin < 0 ? 'text-rose-400' : 'text-emerald-400'].join(' ')}>
                {formatCurrency(margin)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sezione finanziamenti (Fase 3) */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
              <Banknote size={18} />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Finanziamenti</h3>
          </div>
          <span
            className={[
              'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ring-1',
              debtLoad.badge,
            ].join(' ')}
          >
            {debtLoadClass.label}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SummaryRow label="Totale debito residuo" value={formatCurrency(loansDebt)} />
            <SummaryRow label="Totale rate mensili" value={formatCurrency(loansPayment)} />
            <SummaryRow
              label="Entrate assorbite dalle rate"
              value={formatPercentage(debtLoadRatio)}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-400">Debt Load Ratio</span>
              <span className="font-semibold text-slate-200">{formatPercentage(debtLoadRatio)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={['h-full rounded-full transition-all', debtLoad.bar].join(' ')}
                style={{ width: `${Math.min(debtLoadRatio, 100)}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-400">{debtLoad.text}</p>
          </div>
        </div>
      </Card>

      {/* Sezione esposizione al credito (Fase 4) */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
              <CreditCard size={18} />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Esposizione Carte di Credito</h3>
          </div>
          <span
            className={[
              'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ring-1',
              creditStress.badge,
            ].join(' ')}
          >
            {creditStressClass.label}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SummaryRow label="Numero carte" value={String(cardsCount)} />
            <SummaryRow label="Plafond totale" value={formatCurrency(cardLimit)} />
            <SummaryRow label="Plafond utilizzato" value={formatCurrency(cardUsed)} />
            <SummaryRow label="Plafond disponibile" value={formatCurrency(cardAvailable)} />
            <SummaryRow label="Utilizzo del plafond" value={formatPercentage(creditUtilization)} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-400">Credit Stress Score</span>
              <span className="font-semibold text-slate-200">{creditStressScore}/100</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={['h-full rounded-full transition-all', creditStress.bar].join(' ')}
                style={{ width: `${Math.min(creditStressScore, 100)}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-400">{creditStress.text}</p>
          </div>
        </div>
      </Card>

      {/* Sezione rateizzazioni variabili (Fase 5) */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <Repeat size={18} />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Rateizzazioni Variabili</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SummaryRow label="Numero prodotti" value={String(variableProductsCount)} />
            <SummaryRow label="Debito variabile stimato" value={formatCurrency(variableDebt)} />
            <SummaryRow label="Rata variabile mensile totale" value={formatCurrency(variableMonthly)} />
            <SummaryRow
              label="Prossimo alleggerimento"
              value={nextRelief ? `${nextRelief.monthLabel} (−${formatCurrency(nextRelief.endingPayment)})` : '—'}
              valueClassName={nextRelief ? 'text-emerald-400' : 'text-slate-100'}
            />
            <SummaryRow
              label="La pressione mensile cala da"
              value={pressureDrop ? pressureDrop.month : '—'}
              valueClassName={pressureDrop ? 'text-emerald-400' : 'text-slate-100'}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">Prime 5 rateizzazioni che finiscono</p>
            {firstFiveEvents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-800 py-6 text-center text-sm text-slate-500">
                Nessuna rateizzazione in scadenza.
              </p>
            ) : (
              <div className="space-y-2">
                {firstFiveEvents.map((event, index) => (
                  <div
                    key={`${event.productId}-${event.description}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{event.description}</p>
                      <p className="truncate text-xs text-slate-500">{event.productName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-emerald-300">{event.monthLabel}</p>
                      <p className="text-xs text-slate-400">−{formatCurrency(event.endingPayment)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Patrimonio e Liquidità (Fase 7) */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
              <Landmark size={18} />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Patrimonio e Liquidità</h3>
          </div>
          <span
            className={[
              'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ring-1',
              wealthStyle.badge,
            ].join(' ')}
          >
            {wealthEval.label}
          </span>
        </div>

        <p className="mb-4 text-sm text-slate-400">{wealthEval.description}</p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SummaryRow label="Liquidità totale" value={formatCurrency(totalLiquidity)} />
            <SummaryRow label="Attività totali" value={formatCurrency(totalAssets)} />
            <SummaryRow label="Debiti totali" value={formatCurrency(totalDebt)} />
          </div>
          <div>
            <SummaryRow
              label="Patrimonio netto"
              value={formatCurrency(netWorth)}
              valueClassName={netWorth < 0 ? 'text-rose-400' : 'text-emerald-400'}
            />
            <SummaryRow
              label="Debito netto"
              value={formatCurrency(netDebt)}
              valueClassName={netDebt > 0 ? 'text-amber-400' : 'text-emerald-400'}
            />
            <SummaryRow label="Mesi di sopravvivenza" value={formatMonths(survivalMonths)} />
          </div>
        </div>
      </Card>
    </div>
  )
}
