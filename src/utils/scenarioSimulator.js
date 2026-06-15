// Simulatore decisionale locale (Fase 10) — nessuna persistenza, nessuna API.
import { createAnalysisSnapshot } from './financialInsights.js'
import { getInternalInstallmentsMonthlyPayment } from './financeCalculations.js'
import { formatCurrency } from './financeCalculations.js'
import { normalizeFinancialData } from './financialStorage.js'

function num(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? n : 0
}

function generateSimId(prefix) {
  return `sim-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export const SCENARIO_TYPES = {
  NEW_INSTALLMENT: 'new_installment',
  NEW_LOAN: 'new_loan',
  CARD_USAGE: 'card_usage',
  LOAN_PAYOFF: 'loan_payoff',
  INSTALLMENT_PAYOFF: 'installment_payoff',
  INCOME_INCREASE: 'income_increase',
  EXPENSE_REDUCTION: 'expense_reduction',
}

export const SCENARIO_LABELS = {
  [SCENARIO_TYPES.NEW_INSTALLMENT]: 'Nuova rateizzazione',
  [SCENARIO_TYPES.NEW_LOAN]: 'Nuovo finanziamento',
  [SCENARIO_TYPES.CARD_USAGE]: 'Nuovo utilizzo carta',
  [SCENARIO_TYPES.LOAN_PAYOFF]: 'Estinzione finanziamento',
  [SCENARIO_TYPES.INSTALLMENT_PAYOFF]: 'Estinzione rateizzazione variabile',
  [SCENARIO_TYPES.INCOME_INCREASE]: 'Aumento entrate',
  [SCENARIO_TYPES.EXPENSE_REDUCTION]: 'Riduzione spese',
}

// Deep clone + normalizzazione (non tocca localStorage)
export function cloneFinancialData(data) {
  return normalizeFinancialData(data)
}

function calcMonthlyFromTotal(totalAmount, installmentsCount) {
  const count = Math.max(1, Math.round(num(installmentsCount)))
  const total = num(totalAmount)
  return Math.round((total / count) * 100) / 100
}

// Applica uno scenario ipotetico su una copia dei dati
export function applyScenario(data, scenario) {
  const cloned = cloneFinancialData(data)
  const type = scenario?.type
  const params = scenario?.params ?? {}

  switch (type) {
    case SCENARIO_TYPES.NEW_INSTALLMENT: {
      const installmentsCount = Math.max(1, Math.round(num(params.installmentsCount)))
      const totalAmount = num(params.totalAmount)
      const monthlyPayment = calcMonthlyFromTotal(totalAmount, installmentsCount)
      const description = String(params.description ?? '').trim() || 'Nuova rateizzazione'
      const instId = generateSimId('inst')
      const productId = generateSimId('vip')

      cloned.variableInstallmentProducts = [
        ...(cloned.variableInstallmentProducts ?? []),
        {
          id: productId,
          name: description,
          issuer: 'Simulazione',
          monthlyPayment,
          billingDay: Math.min(31, Math.max(1, Math.round(num(params.billingDay)) || 5)),
          remainingAmount: totalAmount,
          notes: 'Scenario simulato',
          installments: [
            {
              id: instId,
              description,
              initialAmount: totalAmount,
              remainingAmount: totalAmount,
              monthlyPayment,
              totalInstallments: installmentsCount,
              paidInstallments: 0,
              remainingInstallments: installmentsCount,
              startDate: params.startDate ?? '',
              endDate: '',
              notes: 'Scenario simulato',
            },
          ],
        },
      ]
      break
    }

    case SCENARIO_TYPES.NEW_LOAN: {
      const remainingAmount = num(params.remainingAmount)
      cloned.loans = [
        ...(cloned.loans ?? []),
        {
          id: generateSimId('loan'),
          name: String(params.name ?? '').trim() || 'Nuovo finanziamento',
          lender: 'Simulazione',
          initialAmount: remainingAmount,
          remainingAmount,
          monthlyPayment: num(params.monthlyPayment),
          billingDay: Math.min(31, Math.max(1, Math.round(num(params.billingDay)) || 10)),
          startDate: params.startDate ?? '',
          endDate: params.endDate ?? '',
          notes: 'Scenario simulato',
        },
      ]
      break
    }

    case SCENARIO_TYPES.CARD_USAGE: {
      const cardId = params.cardId
      const additional = num(params.additionalUsage)
      cloned.cards = (cloned.cards ?? []).map((card) => {
        if (card.id !== cardId) return card
        const newUsed = num(card.usedLimit) + additional
        const limit = num(card.totalLimit)
        return {
          ...card,
          usedLimit: limit > 0 ? Math.min(newUsed, limit) : newUsed,
        }
      })
      break
    }

    case SCENARIO_TYPES.LOAN_PAYOFF: {
      const loanId = params.loanId
      cloned.loans = (cloned.loans ?? []).filter((loan) => loan.id !== loanId)
      break
    }

    case SCENARIO_TYPES.INSTALLMENT_PAYOFF: {
      const { productId, installmentId } = params
      cloned.variableInstallmentProducts = (cloned.variableInstallmentProducts ?? []).map(
        (product) => {
          if (product.id !== productId) return product
          const installments = (product.installments ?? []).filter(
            (inst) => inst.id !== installmentId,
          )
          const updated = { ...product, installments }
          updated.monthlyPayment = getInternalInstallmentsMonthlyPayment(updated)
          const remaining = installments.reduce(
            (sum, inst) => sum + num(inst.remainingAmount),
            0,
          )
          if (remaining > 0) updated.remainingAmount = remaining
          return updated
        },
      )
      break
    }

    case SCENARIO_TYPES.INCOME_INCREASE: {
      cloned.incomeEntries = [
        ...(cloned.incomeEntries ?? []),
        {
          id: generateSimId('income'),
          description: String(params.description ?? '').trim() || 'Aumento entrata',
          amount: num(params.amount),
          day: Math.min(31, Math.max(1, Math.round(num(params.day)) || 1)),
        },
      ]
      break
    }

    case SCENARIO_TYPES.EXPENSE_REDUCTION: {
      const reduction = num(params.reductionAmount)
      const expenseId = params.expenseId
      const manualDescription = String(params.description ?? '').trim()
      const useManual = Boolean(params.useManualDescription)

      if (!useManual && expenseId) {
        cloned.fixedExpenseEntries = (cloned.fixedExpenseEntries ?? []).map((entry) =>
          entry.id === expenseId
            ? { ...entry, amount: Math.max(0, num(entry.amount) - reduction) }
            : entry,
        )
      } else if (useManual && manualDescription) {
        const entries = cloned.fixedExpenseEntries ?? []
        const match = entries.find(
          (e) =>
            String(e.description ?? '')
              .toLowerCase()
              .includes(manualDescription.toLowerCase()),
        )
        if (match) {
          cloned.fixedExpenseEntries = entries.map((entry) =>
            entry.id === match.id
              ? { ...entry, amount: Math.max(0, num(entry.amount) - reduction) }
              : entry,
          )
        } else {
          cloned.fixedExpenseEntries = [
            ...entries,
            {
              id: generateSimId('exp-adj'),
              description: `Riduzione: ${manualDescription}`,
              amount: -reduction,
              day: 1,
            },
          ]
        }
      }
      break
    }

    default:
      break
  }

  return cloned
}

// Crea snapshot completo dello scenario simulato
export function createScenarioSnapshot(data, scenario) {
  const scenarioData = applyScenario(data, scenario)
  const snapshot = createAnalysisSnapshot(scenarioData)
  return {
    ...snapshot,
    scenarioType: scenario?.type,
    scenarioLabel: SCENARIO_LABELS[scenario?.type] ?? 'Scenario',
    scenarioParams: scenario?.params ?? {},
  }
}

function formatDiff(value, format) {
  if (format === 'percent') {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }
  if (format === 'number') {
    const sign = value > 0 ? '+' : ''
    return `${sign}${Math.round(value)}`
  }
  if (format === 'currency') {
    const sign = value > 0 ? '+' : ''
    return `${sign}${formatCurrency(value)}`
  }
  if (format === 'days') {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value} ${Math.abs(value) === 1 ? 'giorno' : 'giorni'}`
  }
  return String(value)
}

function diffSentiment(diff, higherIsBetter) {
  if (diff === 0) return 'neutral'
  const positive = higherIsBetter ? diff > 0 : diff < 0
  return positive ? 'positive' : 'negative'
}

function getFirstReliefLabel(snapshot) {
  const reading = snapshot?.forecastReading
  if (reading?.firstReliefMonth) {
    const desc = reading.firstReliefDescription
    return desc ? `${reading.firstReliefMonth} (${desc})` : reading.firstReliefMonth
  }
  return '—'
}

// Confronta snapshot attuale vs scenario
export function compareSnapshots(currentSnapshot, scenarioSnapshot) {
  const current = {
    financialHealthScore: currentSnapshot.financialHealthScore,
    financialHealthStatus: currentSnapshot.financialHealthStatus?.label ?? '—',
    debtLoadRatio: currentSnapshot.ratios?.debtLoadRatio ?? 0,
    creditStressScore: currentSnapshot.ratios?.creditStressScore ?? 0,
    netWorth: currentSnapshot.netWorth ?? 0,
    netDebt: currentSnapshot.netDebt ?? 0,
    monthlyMargin: currentSnapshot.totals?.monthlyMargin ?? 0,
    minimumBalance: currentSnapshot.minimumBalance ?? 0,
    negativeDaysCount: (currentSnapshot.negativeDays ?? []).length,
    firstRelief: getFirstReliefLabel(currentSnapshot),
  }

  const scenario = {
    financialHealthScore: scenarioSnapshot.financialHealthScore,
    financialHealthStatus: scenarioSnapshot.financialHealthStatus?.label ?? '—',
    debtLoadRatio: scenarioSnapshot.ratios?.debtLoadRatio ?? 0,
    creditStressScore: scenarioSnapshot.ratios?.creditStressScore ?? 0,
    netWorth: scenarioSnapshot.netWorth ?? 0,
    netDebt: scenarioSnapshot.netDebt ?? 0,
    monthlyMargin: scenarioSnapshot.totals?.monthlyMargin ?? 0,
    minimumBalance: scenarioSnapshot.minimumBalance ?? 0,
    negativeDaysCount: (scenarioSnapshot.negativeDays ?? []).length,
    firstRelief: getFirstReliefLabel(scenarioSnapshot),
  }

  const rows = [
    {
      key: 'financialHealthScore',
      label: 'Financial Health Score',
      format: 'number',
      higherIsBetter: true,
      current: current.financialHealthScore,
      scenario: scenario.financialHealthScore,
      diff: scenario.financialHealthScore - current.financialHealthScore,
    },
    {
      key: 'financialHealthStatus',
      label: 'Financial Health Status',
      format: 'status',
      higherIsBetter: null,
      current: current.financialHealthStatus,
      scenario: scenario.financialHealthStatus,
      diff: null,
    },
    {
      key: 'debtLoadRatio',
      label: 'Debt Load Ratio',
      format: 'percent',
      higherIsBetter: false,
      current: current.debtLoadRatio,
      scenario: scenario.debtLoadRatio,
      diff: scenario.debtLoadRatio - current.debtLoadRatio,
    },
    {
      key: 'creditStressScore',
      label: 'Credit Stress Score',
      format: 'percent',
      higherIsBetter: false,
      current: current.creditStressScore,
      scenario: scenario.creditStressScore,
      diff: scenario.creditStressScore - current.creditStressScore,
    },
    {
      key: 'netWorth',
      label: 'Patrimonio netto',
      format: 'currency',
      higherIsBetter: true,
      current: current.netWorth,
      scenario: scenario.netWorth,
      diff: scenario.netWorth - current.netWorth,
    },
    {
      key: 'netDebt',
      label: 'Debito netto',
      format: 'currency',
      higherIsBetter: false,
      current: current.netDebt,
      scenario: scenario.netDebt,
      diff: scenario.netDebt - current.netDebt,
    },
    {
      key: 'monthlyMargin',
      label: 'Margine mensile',
      format: 'currency',
      higherIsBetter: true,
      current: current.monthlyMargin,
      scenario: scenario.monthlyMargin,
      diff: scenario.monthlyMargin - current.monthlyMargin,
    },
    {
      key: 'minimumBalance',
      label: 'Saldo minimo mensile',
      format: 'currency',
      higherIsBetter: true,
      current: current.minimumBalance,
      scenario: scenario.minimumBalance,
      diff: scenario.minimumBalance - current.minimumBalance,
    },
    {
      key: 'negativeDaysCount',
      label: 'Giorni negativi',
      format: 'days',
      higherIsBetter: false,
      current: current.negativeDaysCount,
      scenario: scenario.negativeDaysCount,
      diff: scenario.negativeDaysCount - current.negativeDaysCount,
    },
    {
      key: 'firstRelief',
      label: 'Primo alleggerimento',
      format: 'text',
      higherIsBetter: null,
      current: current.firstRelief,
      scenario: scenario.firstRelief,
      diff: null,
    },
  ]

  return {
    current,
    scenario,
    rows: rows.map((row) => ({
      ...row,
      diffFormatted: row.diff !== null ? formatDiff(row.diff, row.format) : '—',
      sentiment:
        row.diff !== null && row.higherIsBetter !== null
          ? diffSentiment(row.diff, row.higherIsBetter)
          : 'neutral',
    })),
  }
}

function formatMetricValue(value, format) {
  if (format === 'currency') return formatCurrency(value)
  if (format === 'percent') return `${num(value).toFixed(1)}%`
  if (format === 'number') return String(Math.round(value))
  if (format === 'days') return `${value} ${value === 1 ? 'giorno' : 'giorni'}`
  return String(value)
}

// Insight sullo scenario: miglioramenti, peggioramenti, rischio, raccomandazione
export function getScenarioInsights(comparison, scenarioSnapshot) {
  const improves = []
  const worsens = []

  comparison.rows.forEach((row) => {
    if (row.diff === null || row.higherIsBetter === null || row.diff === 0) return
    const label = row.label
    const diffStr = row.diffFormatted
    if (row.sentiment === 'positive') {
      improves.push(`${label}: ${diffStr} (da ${formatMetricValue(row.current, row.format)} a ${formatMetricValue(row.scenario, row.format)})`)
    } else if (row.sentiment === 'negative') {
      worsens.push(`${label}: ${diffStr} (da ${formatMetricValue(row.current, row.format)} a ${formatMetricValue(row.scenario, row.format)})`)
    }
  })

  const scenarioInsights = scenarioSnapshot.insights ?? []
  const dangerInsights = scenarioInsights.filter((i) => i.type === 'danger')
  const warningInsights = scenarioInsights.filter((i) => i.type === 'warning')

  let mainRisk = 'Nessun rischio critico rilevato nello scenario simulato.'
  if (dangerInsights.length > 0) {
    mainRisk = dangerInsights[0].message
  } else if (warningInsights.length > 0) {
    mainRisk = warningInsights[0].message
  } else if (scenarioSnapshot.overdraftRisk?.level === 'HIGH' || scenarioSnapshot.overdraftRisk?.level === 'CRITICAL') {
    mainRisk = `Rischio sconfinamento ${scenarioSnapshot.overdraftRisk.label} nel cashflow mensile simulato.`
  }

  let recommendation = 'Valuta lo scenario con attenzione prima di prendere decisioni irreversibili.'
  if (worsens.length > 0 && improves.length === 0) {
    recommendation =
      'Lo scenario peggiora più indicatori di quanti ne migliori. Rimanda la decisione o cerca alternative meno impattanti.'
  } else if (improves.length > 0 && worsens.length === 0) {
    recommendation =
      'Lo scenario migliora gli indicatori monitorati. Procedi con cautela verificando liquidità e imprevisti.'
  } else if (improves.length > 0 && worsens.length > 0) {
    recommendation =
      'Lo scenario ha trade-off: alcuni indicatori migliorano e altri peggiorano. Confronta priorità (cashflow vs debito vs margine).'
  } else if (comparison.rows.every((r) => r.diff === 0 || r.diff === null)) {
    recommendation = 'Lo scenario non produce variazioni significative sui KPI monitorati.'
  }

  if (scenarioSnapshot.minimumBalance < 0) {
    recommendation +=
      ' Attenzione: il saldo minimo mensile scende sotto zero — pianifica un buffer prima di procedere.'
  }

  return {
    improves,
    worsens,
    mainRisk,
    recommendation,
  }
}

// Valori di default per il form in base al tipo scenario
export function getDefaultScenarioParams(type, data) {
  switch (type) {
    case SCENARIO_TYPES.NEW_INSTALLMENT:
      return {
        description: '',
        totalAmount: 0,
        installmentsCount: 12,
        billingDay: 5,
        startDate: '',
      }
    case SCENARIO_TYPES.NEW_LOAN:
      return {
        name: '',
        remainingAmount: 0,
        monthlyPayment: 0,
        billingDay: 10,
        startDate: '',
        endDate: '',
      }
    case SCENARIO_TYPES.CARD_USAGE:
      return {
        cardId: data?.cards?.[0]?.id ?? '',
        additionalUsage: 0,
      }
    case SCENARIO_TYPES.LOAN_PAYOFF:
      return {
        loanId: data?.loans?.[0]?.id ?? '',
      }
    case SCENARIO_TYPES.INSTALLMENT_PAYOFF:
      return {
        productId: data?.variableInstallmentProducts?.[0]?.id ?? '',
        installmentId:
          data?.variableInstallmentProducts?.[0]?.installments?.[0]?.id ?? '',
      }
    case SCENARIO_TYPES.INCOME_INCREASE:
      return {
        description: '',
        amount: 0,
        day: 15,
      }
    case SCENARIO_TYPES.EXPENSE_REDUCTION:
      return {
        expenseId: data?.fixedExpenseEntries?.[0]?.id ?? '',
        description: '',
        reductionAmount: 0,
        useManualDescription: false,
      }
    default:
      return {}
  }
}
