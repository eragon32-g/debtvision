import { TrendingUp, CalendarCheck, ArrowDownRight, LineChart, TrendingDown, Minus, CalendarDays } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useFinancialData } from '../hooks/useFinancialData.js'
import {
  getMonthlyPressureForecast,
  getInstallmentEndEvents,
  formatCurrency,
} from '../utils/financeCalculations.js'
import { getForecastReading, createAnalysisSnapshot } from '../utils/financialInsights.js'

export default function Forecast() {
  const { data } = useFinancialData()

  const forecast = getMonthlyPressureForecast(data, 24)
  const endEvents = getInstallmentEndEvents(data)
  const reading = getForecastReading(data)
  const snapshot = createAnalysisSnapshot(data)
  const monthlyTimeline = snapshot.monthlyTimeline ?? []

  const trendIcon =
    reading.trend === 'migliora' ? TrendingUp : reading.trend === 'peggiora' ? TrendingDown : Minus
  const trendColor =
    reading.trend === 'migliora'
      ? 'text-emerald-400'
      : reading.trend === 'peggiora'
        ? 'text-rose-400'
        : 'text-slate-400'
  const TrendIcon = trendIcon

  const hasData =
    (data.variableInstallmentProducts ?? []).length > 0 ||
    (data.loans ?? []).length > 0 ||
    (data.cards ?? []).length > 0 ||
    (data.incomeEntries ?? []).length > 0 ||
    (data.fixedExpenseEntries ?? []).length > 0

  if (!hasData) {
    return (
      <div>
        <PageHeader
          title="Forecast"
          subtitle="Proiezioni e previsioni dei flussi finanziari futuri"
        />
        <EmptyState
          icon={TrendingUp}
          title="Nessun dato per la previsione"
          description="Inserisci finanziamenti, carte o rateizzazioni variabili in Financial Data per generare la previsione dei prossimi 24 mesi."
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Forecast"
        subtitle="Previsione della pressione mensile sui prossimi 24 mesi"
      />

      {/* Eventi di fine rateizzazione */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
            <CalendarCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Eventi di fine rateizzazione</h3>
            <p className="text-xs text-slate-500">
              Quando una rateizzazione termina, la rata variabile si alleggerisce
            </p>
          </div>
        </div>

        {endEvents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-800 py-6 text-center text-sm text-slate-500">
            Nessun evento di fine rateizzazione previsto.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {endEvents.map((event, index) => (
              <div
                key={`${event.productId}-${event.description}-${index}`}
                className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300">{event.monthLabel}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <ArrowDownRight size={14} />
                    {formatCurrency(event.endingPayment)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-100">{event.description}</p>
                <p className="text-xs text-slate-500">{event.productName}</p>
                <p className="mt-1.5 text-xs text-slate-400">
                  Nuova rata prodotto: {formatCurrency(event.newProductPayment)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lettura forecast (Fase 6) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <LineChart size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Lettura forecast</h3>
            <p className="text-xs text-slate-500">Sintesi automatica della previsione a 24 mesi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-800/40 p-3">
            <p className="text-xs text-slate-400">Primo alleggerimento</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {reading.firstReliefMonth ?? '—'}
            </p>
            {reading.firstReliefDescription && (
              <p className="mt-0.5 text-xs text-slate-500">{reading.firstReliefDescription}</p>
            )}
          </div>

          <div className="rounded-lg bg-slate-800/40 p-3">
            <p className="text-xs text-slate-400">Importo recuperato</p>
            <p className="mt-1 text-sm font-semibold text-emerald-400">
              {reading.recoveredAmount > 0
                ? `−${formatCurrency(reading.recoveredAmount)}`
                : '—'}
            </p>
            {reading.recoveredMonth && (
              <p className="mt-0.5 text-xs text-slate-500">da {reading.recoveredMonth}</p>
            )}
          </div>

          <div className="rounded-lg bg-slate-800/40 p-3">
            <p className="text-xs text-slate-400">Mesi critici</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {reading.criticalMonths.length === 0
                ? 'Nessuno'
                : `${reading.criticalMonths.length} mes${reading.criticalMonths.length === 1 ? 'e' : 'i'}`}
            </p>
            {reading.criticalMonths.length > 0 && (
              <p className="mt-0.5 truncate text-xs text-rose-400">
                {reading.criticalMonths
                  .slice(0, 2)
                  .map((m) => m.month)
                  .join(', ')}
                {reading.criticalMonths.length > 2 ? '…' : ''}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-slate-800/40 p-3">
            <p className="text-xs text-slate-400">Trend generale</p>
            <div className="mt-1 flex items-center gap-2">
              <TrendIcon size={18} className={trendColor} />
              <p className={['text-sm font-semibold', trendColor].join(' ')}>
                {reading.trendLabel}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline Mensile (Fase 9) */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <CalendarDays size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Timeline Mensile</h3>
            <p className="text-xs text-slate-500">
              Eventi del mese ordinati cronologicamente con saldo risultante
            </p>
          </div>
        </div>

        {monthlyTimeline.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-800 py-6 text-center text-sm text-slate-500">
            Nessun evento cashflow configurato. Inserisci entrate, spese e addebiti in Financial Data.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Giorno</th>
                  <th className="py-2.5 pr-4 font-medium">Evento</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Importo</th>
                  <th className="py-2.5 text-right font-medium">Saldo risultante</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTimeline.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-800/50 text-slate-300 last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-200">{row.dateDay}</td>
                    <td className="py-2.5 pr-4">{row.description}</td>
                    <td
                      className={[
                        'py-2.5 pr-4 text-right tabular-nums font-medium',
                        row.direction === 'income' ? 'text-emerald-400' : 'text-rose-400',
                      ].join(' ')}
                    >
                      {row.direction === 'income' ? '+' : '−'}
                      {formatCurrency(row.amount)}
                    </td>
                    <td
                      className={[
                        'py-2.5 text-right tabular-nums font-medium',
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
      </Card>

      {/* Tabella previsione 24 mesi */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-100">Previsione prossimi 24 mesi</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Mese</th>
                <th className="py-2.5 pr-4 text-right font-medium">Finanziamenti</th>
                <th className="py-2.5 pr-4 text-right font-medium">Carte</th>
                <th className="py-2.5 pr-4 text-right font-medium">Variabili</th>
                <th className="py-2.5 pr-4 text-right font-medium">Rate totali</th>
                <th className="py-2.5 pr-4 text-right font-medium">Riduzione</th>
                <th className="py-2.5 text-right font-medium">Margine stimato</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((row) => (
                <tr
                  key={row.monthIndex}
                  className="border-b border-slate-800/50 text-slate-300 last:border-0"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-200">{row.month}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(row.loanPayment)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(row.cardPayment)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatCurrency(row.variablePayment)}</td>
                  <td className="py-2.5 pr-4 text-right font-medium tabular-nums text-slate-100">
                    {formatCurrency(row.totalPayment)}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {row.reduction > 0 ? (
                      <span className="text-emerald-400">−{formatCurrency(row.reduction)}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td
                    className={[
                      'py-2.5 text-right font-medium tabular-nums',
                      row.estimatedMargin < 0 ? 'text-rose-400' : 'text-emerald-400',
                    ].join(' ')}
                  >
                    {formatCurrency(row.estimatedMargin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
