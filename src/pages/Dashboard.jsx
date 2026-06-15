import {
  Wallet,
  Receipt,
  Scale,
  PiggyBank,
  Banknote,
  CalendarClock,
  Layers,
  Gauge,
  CreditCard,
  WalletCards,
  Activity,
  Repeat,
  TrendingDown,
  HeartPulse,
  Landmark,
  Droplets,
  Shield,
  Clock,
  ClipboardList,
  CalendarDays,
  AlertOctagon,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import Card from '../components/Card.jsx'
import InsightItem from '../components/InsightItem.jsx'
import RecoveryActionItem from '../components/RecoveryActionItem.jsx'
import { useFinancialData } from '../hooks/useFinancialData.js'
import {
  getTotalIncome,
  getTotalFixedExpenses,
  getMonthlyMargin,
  getTotalLoansDebt,
  getTotalLoansMonthlyPayment,
  getDebtLoadRatio,
  getDebtLoadRatioClass,
  getTotalCardUsed,
  getAvailableCardLimit,
  getCreditStressScore,
  getCreditStressClass,
  getTotalVariableDebt,
  getTotalVariableMonthlyPayment,
  getInstallmentEndEvents,
  getTotalLiquidity,
  getNetWorth,
  getNetDebt,
  getSurvivalMonths,
  formatCurrency,
  formatPercentage,
  formatMonths,
} from '../utils/financeCalculations.js'
import {
  createAnalysisSnapshot,
  healthStatusStyles,
} from '../utils/financialInsights.js'
import { overdraftRiskStyles } from '../utils/cashflowEngine.js'

const ratioColor = {
  ottimo: 'text-emerald-400',
  buono: 'text-brand-300',
  attenzione: 'text-amber-400',
  critico: 'text-rose-400',
}

export default function Dashboard() {
  const { data } = useFinancialData()
  const snapshot = createAnalysisSnapshot(data)
  const { financialHealthScore, financialHealthStatus, recoveryPlan, cashflow, overdraftRisk } = snapshot
  const topInsights = snapshot.insights.slice(0, 3)
  const topRecoveryActions = (recoveryPlan?.thirtyDays ?? []).slice(0, 3)
  const healthStyle = healthStatusStyles[financialHealthStatus.level]
  const riskStyle = overdraftRiskStyles[overdraftRisk?.level ?? 'LOW']

  const totalIncome = getTotalIncome(data)
  const totalExpenses = getTotalFixedExpenses(data)
  const margin = getMonthlyMargin(data)
  const savings = data.liquidity?.savings ?? 0

  const loansDebt = getTotalLoansDebt(data)
  const loansPayment = getTotalLoansMonthlyPayment(data)
  const loansCount = (data.loans ?? []).length
  const debtLoadRatio = getDebtLoadRatio(data)
  const debtLoadClass = getDebtLoadRatioClass(data)

  const cardsCount = (data.cards ?? []).length
  const cardUsed = getTotalCardUsed(data)
  const cardAvailable = getAvailableCardLimit(data)
  const creditStressScore = getCreditStressScore(data)
  const creditStressClass = getCreditStressClass(data)

  const variableProductsCount = (data.variableInstallmentProducts ?? []).length
  const variableMonthly = getTotalVariableMonthlyPayment(data)
  const variableDebt = getTotalVariableDebt(data)
  const endEvents = getInstallmentEndEvents(data)
  const firstRelief = endEvents[0] ?? null

  const netWorth = getNetWorth(data)
  const totalLiquidity = getTotalLiquidity(data)
  const netDebt = getNetDebt(data)
  const survivalMonths = getSurvivalMonths(data)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Panoramica generale della tua situazione finanziaria"
      />

      {/* Financial Health (Fase 6) */}
      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
              <HeartPulse size={28} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Financial Health</h3>
              <p className="mt-0.5 text-sm text-slate-400">
                Valutazione complessiva basata su margine, debiti, credito e forecast
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className={['text-4xl font-bold tabular-nums', healthStyle.text].join(' ')}>
                  {financialHealthScore}
                </span>
                <span className="text-lg text-slate-500">/100</span>
                <span
                  className={[
                    'ml-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-bold tracking-wide ring-1',
                    healthStyle.badge,
                  ].join(' ')}
                >
                  {financialHealthStatus.label}
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-800">
                <div
                  className={['h-full rounded-full transition-all', healthStyle.bar].join(' ')}
                  style={{ width: `${financialHealthScore}%` }}
                />
              </div>
            </div>
          </div>

          {topInsights.length > 0 && (
            <div className="min-w-0 flex-1 lg:max-w-xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Insight principali
              </p>
              <div className="space-y-2">
                {topInsights.map((insight) => (
                  <InsightItem key={insight.id} insight={insight} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Cashflow Mensile (Fase 9) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <CalendarDays size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Cashflow Mensile</h3>
            <p className="text-xs text-slate-500">
              Simulazione saldo giornaliero partendo dalla liquidità totale
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Saldo minimo previsto"
            icon={TrendingDown}
            accent="accent"
            value={formatCurrency(cashflow?.minimumBalance ?? 0)}
            valueClassName={
              (cashflow?.minimumBalance ?? 0) < 0 ? 'text-rose-400' : 'text-slate-100'
            }
            hint="Punto più basso del mese"
          />
          <StatCard
            label="Giorno più critico"
            icon={CalendarClock}
            accent="brand"
            value={
              cashflow?.minimumBalanceDay > 0 ? `Giorno ${cashflow.minimumBalanceDay}` : '—'
            }
            hint="Giorno con saldo minimo"
          />
          <StatCard
            label="Giorni in negativo"
            icon={AlertOctagon}
            accent="accent"
            value={
              (cashflow?.negativeDays?.length ?? 0) === 0
                ? 'Nessuno'
                : String(cashflow.negativeDays.length)
            }
            valueClassName={
              (cashflow?.negativeDays?.length ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
            }
            hint={
              (cashflow?.negativeDays?.length ?? 0) > 0
                ? `Giorni ${cashflow.negativeDays.join(', ')}`
                : 'Saldo sempre positivo'
            }
          />
          <StatCard
            label="Rischio sconfinamento"
            icon={Gauge}
            accent="brand"
            value={overdraftRisk?.label ?? '—'}
            valueClassName={riskStyle.text}
            hint="Basato su saldo minimo e giorni negativi"
          />
        </div>
      </Card>

      {/* Piano di Recupero (Fase 8) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <ClipboardList size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Piano di Recupero</h3>
            <p className="text-xs text-slate-500">Prime 3 azioni prioritarie per i prossimi 30 giorni</p>
          </div>
        </div>

        {topRecoveryActions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-800 py-6 text-center text-sm text-slate-500">
            Nessuna azione urgente. La situazione non richiede interventi immediati.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {topRecoveryActions.map((action) => (
              <RecoveryActionItem key={action.id} action={action} compact />
            ))}
          </div>
        )}
      </Card>

      {/* Card statistiche basate sui dati inseriti in Financial Data */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Entrate mensili"
          icon={Wallet}
          accent="brand"
          value={formatCurrency(totalIncome)}
          hint="Stipendio + altre entrate"
        />
        <StatCard
          label="Spese fisse"
          icon={Receipt}
          accent="accent"
          value={formatCurrency(totalExpenses)}
          hint="Totale spese fisse mensili"
        />
        <StatCard
          label="Margine mensile"
          icon={Scale}
          accent="brand"
          value={formatCurrency(margin)}
          valueClassName={margin < 0 ? 'text-rose-400' : 'text-emerald-400'}
          hint="Entrate - spese fisse"
        />
        <StatCard
          label="Risparmi disponibili"
          icon={PiggyBank}
          accent="accent"
          value={formatCurrency(savings)}
          hint="Liquidità accantonata"
        />
      </div>

      {/* Card finanziamenti (Fase 3) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Debito finanziamenti"
          icon={Banknote}
          accent="brand"
          value={formatCurrency(loansDebt)}
          hint="Totale importo residuo"
        />
        <StatCard
          label="Rate finanziamenti"
          icon={CalendarClock}
          accent="accent"
          value={formatCurrency(loansPayment)}
          hint="Totale rate mensili"
        />
        <StatCard
          label="Numero finanziamenti"
          icon={Layers}
          accent="brand"
          value={String(loansCount)}
          hint={loansCount === 1 ? 'Finanziamento attivo' : 'Finanziamenti attivi'}
        />
        <StatCard
          label="Debt Load Ratio"
          icon={Gauge}
          accent="accent"
          value={formatPercentage(debtLoadRatio)}
          valueClassName={ratioColor[debtLoadClass.level]}
          hint={`Classificazione: ${debtLoadClass.label}`}
        />
      </div>

      {/* Card carte di credito (Fase 4.1) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Carte attive"
          icon={CreditCard}
          accent="brand"
          value={String(cardsCount)}
          hint={cardsCount === 1 ? 'Carta di credito' : 'Carte di credito'}
        />
        <StatCard
          label="Plafond utilizzato"
          icon={WalletCards}
          accent="accent"
          value={formatCurrency(cardUsed)}
          hint="Totale plafond utilizzato"
        />
        <StatCard
          label="Plafond disponibile"
          icon={CreditCard}
          accent="brand"
          value={formatCurrency(cardAvailable)}
          hint="Plafond totale - utilizzato"
        />
        <StatCard
          label="Credit Stress Score"
          icon={Activity}
          accent="accent"
          value={`${creditStressScore}/100`}
          valueClassName={ratioColor[creditStressClass.level]}
          hint={`Classificazione: ${creditStressClass.label}`}
        />
      </div>

      {/* Card rateizzazioni variabili (Fase 5) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rateizzazioni variabili"
          icon={Repeat}
          accent="brand"
          value={String(variableProductsCount)}
          hint={variableProductsCount === 1 ? 'Prodotto attivo' : 'Prodotti attivi'}
        />
        <StatCard
          label="Rata variabile totale"
          icon={CalendarClock}
          accent="accent"
          value={formatCurrency(variableMonthly)}
          hint="Rate mensili variabili"
        />
        <StatCard
          label="Debito variabile stimato"
          icon={Banknote}
          accent="brand"
          value={formatCurrency(variableDebt)}
          hint="Residuo stimato totale"
        />
        <StatCard
          label="Primo alleggerimento previsto"
          icon={TrendingDown}
          accent="accent"
          value={firstRelief ? firstRelief.monthLabel : '—'}
          valueClassName="text-emerald-400"
          hint={
            firstRelief
              ? `${firstRelief.description} (-${formatCurrency(firstRelief.endingPayment)})`
              : 'Nessuna scadenza prevista'
          }
        />
      </div>

      {/* Card patrimonio e liquidità (Fase 7) */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Patrimonio Netto"
          icon={Landmark}
          accent="brand"
          value={formatCurrency(netWorth)}
          valueClassName={netWorth < 0 ? 'text-rose-400' : 'text-emerald-400'}
          hint="Liquidità + attività − debiti"
        />
        <StatCard
          label="Liquidità Totale"
          icon={Droplets}
          accent="accent"
          value={formatCurrency(totalLiquidity)}
          hint="Conti, contanti e fondo emergenza"
        />
        <StatCard
          label="Debito Netto"
          icon={Shield}
          accent="brand"
          value={formatCurrency(netDebt)}
          valueClassName={netDebt > 0 ? 'text-amber-400' : 'text-emerald-400'}
          hint="Debiti − liquidità"
        />
        <StatCard
          label="Mesi di Sopravvivenza"
          icon={Clock}
          accent="accent"
          value={formatMonths(survivalMonths)}
          hint="Liquidità / spese fisse mensili"
        />
      </div>

      {/* Aree contenuto placeholder */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200">Andamento debito</h3>
          <p className="mt-1 text-xs text-slate-500">Grafico disponibile nelle fasi successive</p>
          <div className="mt-4 flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-800 text-sm text-slate-600">
            Area grafico
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-200">Prossime scadenze</h3>
          <p className="mt-1 text-xs text-slate-500">Nessuna scadenza da mostrare</p>
          <div className="mt-4 flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-800 text-sm text-slate-600">
            Elenco scadenze
          </div>
        </Card>
      </div>
    </div>
  )
}
