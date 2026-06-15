// Motore di analisi locale (Fase 6) — nessuna AI, nessuna API, tutto offline.
import {
  getTotalIncome,
  getTotalFixedExpenses,
  getMonthlyMargin,
  getSavingsCoverageMonths,
  getDebtLoadRatio,
  getCreditStressScore,
  getCreditUtilizationPercentage,
  getTotalLoansDebt,
  getTotalLoansMonthlyPayment,
  getTotalCardLimit,
  getTotalCardUsed,
  getAvailableCardLimit,
  getTotalCardMonthlyPayment,
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
  getSavingsAmount,
  formatCurrency,
  formatMonths,
} from './financeCalculations.js'
import { generateRecoveryPlan } from './recoveryPlanEngine.js'
import {
  simulateMonthlyBalance,
  generateTimelineWithBalances,
  getCashflowRecommendations,
} from './cashflowEngine.js'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

// --- Financial Health Score (0-100) ---

function scoreMargin(margin, income) {
  if (margin < 0) return Math.max(0, 10 + margin / 50) // penalità forte
  if (margin <= 300) return 35 + (margin / 300) * 25 // 35-60
  if (income <= 0) return 70
  const ratio = margin / income
  return Math.min(100, 60 + ratio * 80) // margine >300€ scala con % entrate
}

function scoreDebtLoad(ratio) {
  if (ratio <= 20) return 100
  if (ratio <= 35) return 75
  if (ratio <= 50) return 45
  return Math.max(0, 45 - (ratio - 50))
}

function scoreCreditStress(stressScore) {
  return Math.max(0, 100 - stressScore)
}

function scoreSavingsCoverage(months) {
  if (months >= 6) return 100
  if (months >= 3) return 75
  if (months >= 1) return 50
  return Math.max(0, months * 50)
}

function scoreForecast(forecast) {
  if (!forecast.length) return 70
  const negativeMonths = forecast.filter((row) => row.estimatedMargin < 0).length
  const firstMargin = forecast[0]?.estimatedMargin ?? 0
  const lastMargin = forecast[forecast.length - 1]?.estimatedMargin ?? 0
  const trendBonus = lastMargin > firstMargin ? 15 : lastMargin < firstMargin ? -10 : 0
  const negativePenalty = Math.min(60, negativeMonths * 8)
  return Math.max(0, Math.min(100, 85 - negativePenalty + trendBonus))
}

function scoreNetWorth(netWorth) {
  if (netWorth < 0) return Math.max(0, 15 + netWorth / 500)
  if (netWorth >= 20000) return 100
  if (netWorth >= 5000) return 80
  return 50 + (netWorth / 5000) * 30
}

function scoreSurvivalMonths(months) {
  if (months >= 6) return 100
  if (months >= 3) return 75
  if (months >= 1) return 50
  return Math.max(0, months * 50)
}

function scoreLiquidityBuffer(data) {
  const liq = data?.liquidity ?? {}
  const immediate =
    (liq.primaryAccount ?? 0) +
    (liq.cash ?? 0) +
    (liq.emergencyFund ?? 0)
  const expenses = getTotalFixedExpenses(data)
  if (expenses <= 0) return immediate > 0 ? 70 : 50
  const months = immediate / expenses
  if (months >= 6) return 100
  if (months >= 3) return 80
  if (months >= 1) return 55
  return Math.max(0, months * 55)
}

export function getFinancialHealthScore(data) {
  const income = getTotalIncome(data)
  const margin = getMonthlyMargin(data)
  const debtLoad = getDebtLoadRatio(data)
  const creditStress = getCreditStressScore(data)
  const savingsCoverage = getSavingsCoverageMonths(data)
  const forecast = getMonthlyPressureForecast(data, 24)
  const netWorth = getNetWorth(data)
  const survival = getSurvivalMonths(data)

  const components = {
    margin: scoreMargin(margin, income),
    debtLoad: scoreDebtLoad(debtLoad),
    creditStress: scoreCreditStress(creditStress),
    savings: scoreSavingsCoverage(savingsCoverage),
    forecast: scoreForecast(forecast),
    netWorth: scoreNetWorth(netWorth),
    survival: scoreSurvivalMonths(survival),
    liquidity: scoreLiquidityBuffer(data),
  }

  const score = Math.round(
    0.18 * components.margin +
      0.12 * components.debtLoad +
      0.08 * components.creditStress +
      0.08 * components.savings +
      0.15 * components.forecast +
      0.15 * components.netWorth +
      0.14 * components.survival +
      0.1 * components.liquidity,
  )

  return Math.max(0, Math.min(100, score))
}

export function getFinancialHealthStatus(data) {
  const score = getFinancialHealthScore(data)
  if (score <= 25) return { level: 'critico', label: 'CRITICO' }
  if (score <= 50) return { level: 'fragile', label: 'FRAGILE' }
  if (score <= 75) return { level: 'stabile', label: 'STABILE' }
  return { level: 'solido', label: 'SOLIDO' }
}

// --- Insight Engine ---

function makeInsight(id, type, title, message, priority) {
  return { id, type, title, message, priority }
}

export function generateFinancialInsights(data) {
  const insights = []
  const income = getTotalIncome(data)
  const margin = getMonthlyMargin(data)
  const debtLoad = getDebtLoadRatio(data)
  const cardUtilization = getCreditUtilizationPercentage(data)
  const savingsCoverage = getSavingsCoverageMonths(data)
  const forecast = getMonthlyPressureForecast(data, 24)
  const endEvents = getInstallmentEndEvents(data)
  const firstRelief = endEvents[0] ?? null
  const pressureDrop = forecast.find((row) => row.reduction > 0) ?? null
  const negativeForecastMonths = forecast.filter((row) => row.estimatedMargin < 0)

  const totalLiquidity = getTotalLiquidity(data)
  const totalAssets = getTotalAssets(data)
  const netWorth = getNetWorth(data)
  const netDebt = getNetDebt(data)
  const survival = getSurvivalMonths(data)
  const emergencyFund = Number(data?.liquidity?.emergencyFund) || 0
  const fixedExpenses = getTotalFixedExpenses(data)

  if (margin < 0) {
    insights.push(
      makeInsight(
        'margin-negative',
        'danger',
        'Margine mensile negativo',
        `Le spese fisse (${formatCurrency(getTotalFixedExpenses(data))}) superano le entrate (${formatCurrency(income)}). Intervieni subito su costi o entrate.`,
        'high',
      ),
    )
  } else if (margin < 300) {
    insights.push(
      makeInsight(
        'margin-low',
        'warning',
        'Margine mensile ridotto',
        `Il margine disponibile è ${formatCurrency(margin)}, sotto la soglia di 300 €. Tieni sotto controllo spese impreviste e nuovi impegni.`,
        'high',
      ),
    )
  }

  if (debtLoad > 35) {
    insights.push(
      makeInsight(
        'debt-load-high',
        'warning',
        'Rate finanziamenti elevate',
        `Le rate dei finanziamenti assorbono il ${debtLoad.toFixed(1)}% delle entrate (soglia consigliata: 35%). Valuta un consolidamento o anticipo rate.`,
        'high',
      ),
    )
  }

  if (cardUtilization > 70 && getTotalCardLimit(data) > 0) {
    insights.push(
      makeInsight(
        'card-utilization-high',
        'warning',
        'Plafond carte molto utilizzato',
        `Stai usando il ${cardUtilization.toFixed(1)}% del plafond disponibile sulle carte. Riduci l'utilizzo per migliorare il profilo di rischio.`,
        'medium',
      ),
    )
  }

  if (savingsCoverage < 1 && getTotalFixedExpenses(data) > 0) {
    insights.push(
      makeInsight(
        'savings-low',
        'danger',
        'Risparmi insufficienti',
        `I risparmi coprono meno di 1 mese di spese fisse. Costruisci un fondo di emergenza prima di nuovi acquisti rateizzati.`,
        'high',
      ),
    )
  }

  if (firstRelief) {
    insights.push(
      makeInsight(
        'first-relief',
        'positive',
        'Primo alleggerimento previsto',
        `A ${firstRelief.monthLabel} termina "${firstRelief.description}" (${firstRelief.productName}): la rata variabile scende di ${formatCurrency(firstRelief.endingPayment)}.`,
        'medium',
      ),
    )
  }

  if (pressureDrop) {
    insights.push(
      makeInsight(
        'variable-drop-month',
        'info',
        'Mese di calo delle rate variabili',
        `Da ${pressureDrop.month} la pressione mensile si alleggerisce di ${formatCurrency(pressureDrop.reduction)} grazie a rateizzazioni in scadenza.`,
        'medium',
      ),
    )
  }

  if (forecast.length >= 3) {
    const first = forecast[0].estimatedMargin
    const last = forecast[forecast.length - 1].estimatedMargin
    if (last > first + 50) {
      insights.push(
        makeInsight(
          'forecast-improving',
          'positive',
          'Margine in miglioramento',
          `Il forecast indica un margine stimato che passa da ${formatCurrency(first)} a ${formatCurrency(last)} nei prossimi 24 mesi.`,
          'medium',
        ),
      )
    }
  }

  if (negativeForecastMonths.length > 0) {
    const labels = negativeForecastMonths.slice(0, 3).map((r) => r.month).join(', ')
    insights.push(
      makeInsight(
        'forecast-negative-months',
        'warning',
        'Mesi critici nel forecast',
        `${negativeForecastMonths.length} mes${negativeForecastMonths.length === 1 ? 'e' : 'i'} con margine stimato negativo${negativeForecastMonths.length <= 3 ? `: ${labels}` : ` (es. ${labels}…)`}.`,
        'high',
      ),
    )
  }

  const marginOk = margin >= 300
  const debtOk = debtLoad <= 35
  const creditOk = getCreditStressScore(data) <= 50
  if (marginOk && debtOk && creditOk && income > 0) {
    insights.push(
      makeInsight(
        'situation-stable',
        'positive',
        'Situazione sotto controllo',
        `Margine di ${formatCurrency(margin)}, debiti e credito in fascia sostenibile. Mantieni la disciplina attuale.`,
        'low',
      ),
    )
  }

  // --- Patrimonio e Liquidità (Fase 7) ---

  if (netWorth < 0) {
    insights.push(
      makeInsight(
        'net-worth-negative',
        'danger',
        'Patrimonio netto negativo',
        `Liquidità e attività (${formatCurrency(totalLiquidity + totalAssets)}) non coprono i debiti (${formatCurrency(getTotalDebt(data))}). Patrimonio netto: ${formatCurrency(netWorth)}.`,
        'high',
      ),
    )
  } else if (netWorth > 0 && (totalLiquidity > 0 || totalAssets > 0)) {
    insights.push(
      makeInsight(
        'net-worth-positive',
        'positive',
        'Patrimonio netto positivo',
        `Il patrimonio netto è ${formatCurrency(netWorth)}. Liquidità ${formatCurrency(totalLiquidity)} e attività ${formatCurrency(totalAssets)}.`,
        'medium',
      ),
    )
  }

  if (fixedExpenses > 0 && survival < 1) {
    insights.push(
      makeInsight(
        'liquidity-under-1-month',
        'danger',
        'Liquidità inferiore a 1 mese',
        `La liquidità totale (${formatCurrency(totalLiquidity)}) copre meno di un mese di spese fisse (${formatCurrency(fixedExpenses)}).`,
        'high',
      ),
    )
  } else if (fixedExpenses > 0 && survival >= 1 && survival < 3) {
    insights.push(
      makeInsight(
        'liquidity-1-3-months',
        'warning',
        'Liquidità tra 1 e 3 mesi',
        `La liquidità copre ${formatMonths(survival)} di spese. Obiettivo consigliato: almeno 3-6 mesi.`,
        'medium',
      ),
    )
  } else if (fixedExpenses > 0 && survival >= 6) {
    insights.push(
      makeInsight(
        'liquidity-over-6-months',
        'positive',
        'Liquidità superiore a 6 mesi',
        `Ottimo buffer: la liquidità copre ${formatMonths(survival)} di spese fisse.`,
        'low',
      ),
    )
  }

  if (netDebt > 0 && netDebt > totalAssets) {
    insights.push(
      makeInsight(
        'net-debt-high',
        'warning',
        'Debito netto elevato',
        `I debiti netti (${formatCurrency(netDebt)}) superano le attività patrimoniali. Riduci passività o aumenta liquidità.`,
        'high',
      ),
    )
  }

  if (fixedExpenses > 0 && emergencyFund <= 0) {
    insights.push(
      makeInsight(
        'emergency-fund-missing',
        'warning',
        'Fondo emergenza assente',
        'Non risulta un fondo emergenza dedicato. Consigliato almeno 3 mesi di spese fisse.',
        'medium',
      ),
    )
  } else if (fixedExpenses > 0 && emergencyFund >= fixedExpenses * 3) {
    insights.push(
      makeInsight(
        'emergency-fund-ok',
        'positive',
        'Fondo emergenza adeguato',
        `Il fondo emergenza (${formatCurrency(emergencyFund)}) copre almeno 3 mesi di spese fisse.`,
        'low',
      ),
    )
  }

  // --- Cashflow mensile (Fase 9) ---
  const cashflowSim = simulateMonthlyBalance({
    incomeEntries: data.incomeEntries ?? [],
    fixedExpenseEntries: data.fixedExpenseEntries ?? [],
    loans: data.loans ?? [],
    cards: data.cards ?? [],
    variableInstallmentProducts: data.variableInstallmentProducts ?? [],
    totals: {
      totalLiquidity,
      totalFixedExpenses: fixedExpenses,
      loansMonthlyPayment: getTotalLoansMonthlyPayment(data),
      cardMonthlyPayment: getTotalCardMonthlyPayment(data),
      variableMonthlyPayment: getTotalVariableMonthlyPayment(data),
    },
  })

  const { minimumBalance, minimumBalanceDay, negativeDays, overdraftRisk } = cashflowSim

  if (overdraftRisk.level === 'CRITICAL' || overdraftRisk.level === 'HIGH') {
    insights.push(
      makeInsight(
        'overdraft-risk-high',
        'danger',
        'Rischio sconfinamento alto',
        `Il saldo minimo previsto è ${formatCurrency(minimumBalance)}${minimumBalanceDay > 0 ? ` (giorno ${minimumBalanceDay})` : ''}. Rischio: ${overdraftRisk.label}.`,
        'high',
      ),
    )
  }

  if (negativeDays.length > 0) {
    insights.push(
      makeInsight(
        'cashflow-negative-days',
        'danger',
        'Giorni in negativo',
        `Il saldo scende sotto zero nei giorni ${negativeDays.join(', ')} del mese. Pianifica un buffer aggiuntivo.`,
        'high',
      ),
    )
  }

  if (minimumBalance >= 0 && minimumBalance < totalLiquidity * 0.2 && totalLiquidity > 0) {
    insights.push(
      makeInsight(
        'cashflow-low-minimum',
        'warning',
        'Saldo minimo basso',
        `Il saldo minimo previsto (${formatCurrency(minimumBalance)}) è inferiore al 20% della liquidità attuale.`,
        'medium',
      ),
    )
  }

  const incomeEntries = data.incomeEntries ?? []
  const expenseEntries = data.fixedExpenseEntries ?? []
  if (incomeEntries.length > 0 && expenseEntries.length > 0) {
    const mainIncomeDay = Math.max(
      ...incomeEntries.map((e) => Number(e.day) || 1),
      15,
    )
    const expensesBeforeIncome = expenseEntries
      .filter((e) => (Number(e.day) || 1) < mainIncomeDay)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const totalExpenseEntries = expenseEntries.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0,
    )
    if (totalExpenseEntries > 0 && expensesBeforeIncome / totalExpenseEntries > 0.6) {
      insights.push(
        makeInsight(
          'cashflow-concentration-before-salary',
          'warning',
          'Uscite concentrate prima dello stipendio',
          `Oltre il 60% delle spese fisse (${formatCurrency(expensesBeforeIncome)}) cade prima del giorno ${mainIncomeDay}. Valuta di spostare alcuni addebiti.`,
          'medium',
        ),
      )
    }
  }

  if (overdraftRisk.level === 'LOW' && negativeDays.length === 0 && minimumBalance > totalLiquidity * 0.4) {
    insights.push(
      makeInsight(
        'cashflow-well-distributed',
        'positive',
        'Cashflow ben distribuito',
        `Il saldo minimo resta a ${formatCurrency(minimumBalance)} senza giorni negativi. Buona distribuzione degli addebiti nel mese.`,
        'low',
      ),
    )
  }

  return insights.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

export function getTopInsights(data, count = 3) {
  return generateFinancialInsights(data).slice(0, count)
}

export function getInsightsByType(insights, type) {
  return insights.filter((i) => i.type === type)
}

// --- Lettura forecast (per pagina Forecast) ---

export function getForecastReading(data) {
  const forecast = getMonthlyPressureForecast(data, 24)
  const endEvents = getInstallmentEndEvents(data)
  const firstRelief = endEvents[0] ?? null
  const pressureDrop = forecast.find((row) => row.reduction > 0) ?? null
  const criticalMonths = forecast.filter((row) => row.estimatedMargin < 0)

  let trend = 'stabile'
  if (forecast.length >= 2) {
    const first = forecast[0].estimatedMargin
    const last = forecast[forecast.length - 1].estimatedMargin
    if (last > first + 30) trend = 'migliora'
    else if (last < first - 30) trend = 'peggiora'
  }

  return {
    firstReliefMonth: firstRelief?.monthLabel ?? null,
    firstReliefDescription: firstRelief?.description ?? null,
    recoveredAmount: pressureDrop?.reduction ?? 0,
    recoveredMonth: pressureDrop?.month ?? null,
    criticalMonths: criticalMonths.map((r) => ({
      month: r.month,
      margin: r.estimatedMargin,
    })),
    trend,
    trendLabel: trend === 'migliora' ? 'Migliora' : trend === 'peggiora' ? 'Peggiora' : 'Stabile',
  }
}

// --- Analysis Snapshot (per AI/PDF futuri) ---

export function createAnalysisSnapshot(data) {
  const income = getTotalIncome(data)
  const fixedExpenses = getTotalFixedExpenses(data)
  const margin = getMonthlyMargin(data)
  const forecast = getMonthlyPressureForecast(data, 24)
  const insights = generateFinancialInsights(data)
  const financialHealthScore = getFinancialHealthScore(data)
  const financialHealthStatus = getFinancialHealthStatus(data)

  const base = {
    generatedAt: new Date().toISOString(),
    incomeEntries: [...(data.incomeEntries ?? [])],
    fixedExpenseEntries: [...(data.fixedExpenseEntries ?? [])],
    loans: [...(data.loans ?? [])],
    cards: [...(data.cards ?? [])],
    variableInstallmentProducts: [...(data.variableInstallmentProducts ?? [])],
    liquidity: { ...(data.liquidity ?? {}) },
    assets: [...(data.assets ?? [])],
    totals: {
      totalIncome: income,
      totalFixedExpenses: fixedExpenses,
      monthlyMargin: margin,
      savings: getSavingsAmount(data),
      loansDebt: getTotalLoansDebt(data),
      loansMonthlyPayment: getTotalLoansMonthlyPayment(data),
      cardLimit: getTotalCardLimit(data),
      cardUsed: getTotalCardUsed(data),
      cardAvailable: getAvailableCardLimit(data),
      cardMonthlyPayment: getTotalCardMonthlyPayment(data),
      variableDebt: getTotalVariableDebt(data),
      variableMonthlyPayment: getTotalVariableMonthlyPayment(data),
      totalLiquidity: getTotalLiquidity(data),
      totalAssets: getTotalAssets(data),
      totalDebt: getTotalDebt(data),
    },
    ratios: {
      debtLoadRatio: getDebtLoadRatio(data),
      creditUtilization: getCreditUtilizationPercentage(data),
      creditStressScore: getCreditStressScore(data),
      savingsCoverageMonths: getSavingsCoverageMonths(data),
    },
    netWorth: getNetWorth(data),
    netDebt: getNetDebt(data),
    survivalMonths: getSurvivalMonths(data),
    forecast,
    forecastReading: getForecastReading(data),
    insights,
    financialHealthScore,
    financialHealthStatus,
  }

  const cashflow = simulateMonthlyBalance(base)
  const monthlyTimeline = generateTimelineWithBalances(base)
  const cashflowRecommendations = getCashflowRecommendations(cashflow)

  return {
    ...base,
    recoveryPlan: generateRecoveryPlan(base),
    cashflow,
    monthlyTimeline,
    minimumBalance: cashflow.minimumBalance,
    negativeDays: cashflow.negativeDays,
    overdraftRisk: cashflow.overdraftRisk,
    cashflowRecommendations,
  }
}

// Stili per tipo insight (riutilizzabili nelle pagine)
export const insightTypeStyles = {
  positive: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    icon: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    icon: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-300',
  },
  danger: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    icon: 'text-rose-400',
    badge: 'bg-rose-500/10 text-rose-300',
  },
  info: {
    border: 'border-brand-500/30',
    bg: 'bg-brand-500/5',
    icon: 'text-brand-300',
    badge: 'bg-brand-500/10 text-brand-300',
  },
}

export const healthStatusStyles = {
  critico: {
    badge: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
    bar: 'bg-rose-500',
    text: 'text-rose-400',
  },
  fragile: {
    badge: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
    bar: 'bg-amber-500',
    text: 'text-amber-400',
  },
  stabile: {
    badge: 'bg-brand-500/10 text-brand-300 ring-brand-500/30',
    bar: 'bg-brand-500',
    text: 'text-brand-300',
  },
  solido: {
    badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
    bar: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
}
