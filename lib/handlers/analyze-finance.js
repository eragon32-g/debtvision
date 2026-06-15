// Endpoint AI Financial Advisor (Fase 12) — chiave OpenAI solo lato server.
import OpenAI from 'openai'

const DEFAULT_MODEL = 'gpt-5.5-mini'
const REQUEST_TIMEOUT_MS = 90_000
const MAX_OUTPUT_TOKENS = 1500

const COMPACT_LIMITS = {
  FORECAST_MONTHS: 12,
  TIMELINE_EVENTS: 20,
  INSIGHTS: 6,
  RECOVERY_PER_TIMEFRAME: 4,
  CASHFLOW_RECOMMENDATIONS: 5,
  CRITICAL_FORECAST_MONTHS: 6,
  INCOME_ENTRIES: 5,
  EXPENSE_ENTRIES: 5,
  LOANS: 8,
  CARDS: 8,
  VARIABLE_PRODUCTS: 8,
}

const SYSTEM_PROMPT = `Sei l'AI Financial Advisor di DebtVision: assistente debiti e cashflow, supporto organizzativo prudente (NON consulente finanziario certificato).

Regole: non promettere risultati; no investimenti rischiosi; no prestiti/consolidamenti automatici; no ignorare pagamenti; no consulenza legale/fiscale. Se critico ÔåÆ prudenza e contatto con professionista o creditori.

Focus: liquidit├á, priorit├á debiti, carte, scadenze, buffer emergenza.

Usa insight, recovery plan e forecast nello snapshot come base ÔÇö arricchisci con priorit├á operative, senza ripetere tutto.

Risposta BREVE e pratica: max 2-3 frasi per voce, array concisi, niente analisi lunghe. Solo JSON conforme allo schema, in italiano.`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Sintesi in 2-3 frasi brevi' },
    situationStatus: {
      type: 'string',
      enum: ['critico', 'fragile', 'stabile', 'solido'],
    },
    keyRisks: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    positiveSignals: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    immediateActions: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    thirtyDayPlan: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    ninetyDayPlan: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    twelveMonthPlan: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    debtPriorities: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    cashflowAdvice: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    cardAdvice: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    variableInstallmentAdvice: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    finalWarning: { type: 'string', description: 'Avviso finale in 1-2 frasi' },
  },
  required: [
    'summary',
    'situationStatus',
    'keyRisks',
    'positiveSignals',
    'immediateActions',
    'thirtyDayPlan',
    'ninetyDayPlan',
    'twelveMonthPlan',
    'debtPriorities',
    'cashflowAdvice',
    'cardAdvice',
    'variableInstallmentAdvice',
    'finalWarning',
  ],
  additionalProperties: false,
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return 'Snapshot mancante o non valido.'
  }
  const hasIncome = (snapshot.incomeEntries ?? []).length > 0
  const hasExpenses = (snapshot.fixedExpenseEntries ?? []).length > 0
  const hasDebts =
    (snapshot.loans ?? []).length > 0 ||
    (snapshot.cards ?? []).length > 0 ||
    (snapshot.variableInstallmentProducts ?? []).length > 0
  const hasLiquidity = num(snapshot.totals?.totalLiquidity) > 0

  if (!hasIncome && !hasExpenses && !hasDebts && !hasLiquidity) {
    return 'Dati finanziari insufficienti. Inserisci almeno entrate, spese o debiti in Financial Data.'
  }
  return null
}

function num(v) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? n : 0
}

function trimEntry(entry) {
  return {
    label: entry.label ?? entry.name,
    amount: num(entry.amount),
    day: entry.day ?? entry.dateDay,
  }
}

function trimLoan(loan) {
  return {
    name: loan.name,
    remainingDebt: num(loan.remainingDebt),
    monthlyPayment: num(loan.monthlyPayment),
    billingDay: loan.billingDay,
  }
}

function trimCard(card) {
  return {
    name: card.name,
    used: num(card.used),
    limit: num(card.limit),
    monthlyPayment: num(card.monthlyPayment),
    billingDay: card.billingDay,
  }
}

function trimVariableProduct(product) {
  return {
    name: product.name,
    remainingDebt: num(product.remainingDebt),
    monthlyPayment: num(product.monthlyPayment),
  }
}

function trimForecastRow(row) {
  return {
    month: row.month,
    estimatedMargin: num(row.estimatedMargin),
    totalPayment: num(row.totalPayment),
    reduction: num(row.reduction),
  }
}

function trimTimelineEvent(event) {
  return {
    day: event.dateDay ?? event.day,
    label: event.label,
    amount: num(event.amount),
    direction: event.direction,
    balance: num(event.resultingBalance),
  }
}

function trimInsight(insight) {
  return {
    type: insight.type,
    priority: insight.priority,
    title: insight.title,
    message: String(insight.message ?? '').slice(0, 140),
  }
}

function trimRecoveryActions(actions, limit) {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...(actions ?? [])]
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))
    .slice(0, limit)
    .map((action) => ({
      priority: action.priority,
      type: action.type,
      title: action.title,
    }))
}

function trimForecastReading(reading) {
  if (!reading) return null
  return {
    trend: reading.trend,
    trendLabel: reading.trendLabel,
    firstReliefMonth: reading.firstReliefMonth,
    recoveredAmount: num(reading.recoveredAmount),
    criticalMonths: (reading.criticalMonths ?? [])
      .slice(0, COMPACT_LIMITS.CRITICAL_FORECAST_MONTHS)
      .map((row) => ({ month: row.month, margin: num(row.margin) })),
  }
}

function buildCompactSnapshot(snapshot) {
  const overdraft = snapshot.overdraftRisk
  return {
    generatedAt: snapshot.generatedAt,
    financialHealthScore: snapshot.financialHealthScore,
    financialHealthStatus: snapshot.financialHealthStatus,
    totals: snapshot.totals,
    ratios: snapshot.ratios,
    netWorth: num(snapshot.netWorth),
    netDebt: num(snapshot.netDebt),
    survivalMonths: num(snapshot.survivalMonths),
    minimumBalance: num(snapshot.minimumBalance),
    negativeDays: (snapshot.negativeDays ?? []).slice(0, 10),
    overdraftRisk: overdraft ? { level: overdraft.level, label: overdraft.label } : null,
    liquidity: {
      emergencyFund: num(snapshot.liquidity?.emergencyFund),
      savings: num(snapshot.liquidity?.savings ?? snapshot.totals?.savings),
    },
    incomeEntries: (snapshot.incomeEntries ?? [])
      .slice(0, COMPACT_LIMITS.INCOME_ENTRIES)
      .map(trimEntry),
    fixedExpenseEntries: (snapshot.fixedExpenseEntries ?? [])
      .slice(0, COMPACT_LIMITS.EXPENSE_ENTRIES)
      .map(trimEntry),
    loans: (snapshot.loans ?? []).slice(0, COMPACT_LIMITS.LOANS).map(trimLoan),
    cards: (snapshot.cards ?? []).slice(0, COMPACT_LIMITS.CARDS).map(trimCard),
    variableInstallmentProducts: (snapshot.variableInstallmentProducts ?? [])
      .slice(0, COMPACT_LIMITS.VARIABLE_PRODUCTS)
      .map(trimVariableProduct),
    forecastReading: trimForecastReading(snapshot.forecastReading),
    forecast: (snapshot.forecast ?? [])
      .slice(0, COMPACT_LIMITS.FORECAST_MONTHS)
      .map(trimForecastRow),
    monthlyTimeline: (snapshot.monthlyTimeline ?? [])
      .slice(0, COMPACT_LIMITS.TIMELINE_EVENTS)
      .map(trimTimelineEvent),
    insights: (snapshot.insights ?? [])
      .slice(0, COMPACT_LIMITS.INSIGHTS)
      .map(trimInsight),
    recoveryPlan: snapshot.recoveryPlan
      ? {
          thirtyDays: trimRecoveryActions(
            snapshot.recoveryPlan.thirtyDays,
            COMPACT_LIMITS.RECOVERY_PER_TIMEFRAME,
          ),
          ninetyDays: trimRecoveryActions(
            snapshot.recoveryPlan.ninetyDays,
            COMPACT_LIMITS.RECOVERY_PER_TIMEFRAME,
          ),
          twelveMonths: trimRecoveryActions(
            snapshot.recoveryPlan.twelveMonths,
            COMPACT_LIMITS.RECOVERY_PER_TIMEFRAME,
          ),
        }
      : null,
    cashflowRecommendations: (snapshot.cashflowRecommendations ?? []).slice(
      0,
      COMPACT_LIMITS.CASHFLOW_RECOMMENDATIONS,
    ),
  }
}

function parseResponseJson(response) {
  if (response.output_parsed && typeof response.output_parsed === 'object') {
    return response.output_parsed
  }
  const raw = response.output_text
  if (raw) {
    return JSON.parse(raw)
  }
  const output = response.output ?? []
  for (const item of output) {
    if (item.type === 'message' && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part.type === 'output_text' && part.text) {
          return JSON.parse(part.text)
        }
      }
    }
  }
  throw new Error('Risposta AI senza contenuto JSON.')
}

function normalizeAnalysis(data) {
  const status = ['critico', 'fragile', 'stabile', 'solido'].includes(data.situationStatus)
    ? data.situationStatus
    : 'stabile'

  const arr = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : [])

  return {
    summary: String(data.summary ?? ''),
    situationStatus: status,
    keyRisks: arr(data.keyRisks),
    positiveSignals: arr(data.positiveSignals),
    immediateActions: arr(data.immediateActions),
    thirtyDayPlan: arr(data.thirtyDayPlan),
    ninetyDayPlan: arr(data.ninetyDayPlan),
    twelveMonthPlan: arr(data.twelveMonthPlan),
    debtPriorities: arr(data.debtPriorities),
    cashflowAdvice: arr(data.cashflowAdvice),
    cardAdvice: arr(data.cardAdvice),
    variableInstallmentAdvice: arr(data.variableInstallmentAdvice),
    finalWarning: String(data.finalWarning ?? ''),
  }
}

export async function runFinanceAnalysis(snapshot) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    const err = new Error('OPENAI_API_KEY non configurata sul server.')
    err.code = 'MISSING_API_KEY'
    throw err
  }

  const validationError = validateSnapshot(snapshot)
  if (validationError) {
    const err = new Error(validationError)
    err.code = 'INSUFFICIENT_DATA'
    throw err
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL
  const client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS })
  const compact = buildCompactSnapshot(snapshot)

  const userPrompt = `Analizza questo snapshot DebtVision. Piano operativo prudente e sintetico.

${JSON.stringify(compact)}`

  const response = await client.responses.create({
    model,
    instructions: SYSTEM_PROMPT,
    input: userPrompt,
    max_output_tokens: MAX_OUTPUT_TOKENS,
    text: {
      format: {
        type: 'json_schema',
        name: 'debtvision_financial_analysis',
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
  })

  const parsed = parseResponseJson(response)
  return normalizeAnalysis(parsed)
}

// Handler Express: POST /api/analyze-finance
export async function analyzeFinanceHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' })
  }

  try {
    const snapshot = req.body?.snapshot
    const result = await runFinanceAnalysis(snapshot)
    return res.status(200).json(result)
  } catch (err) {
    console.error('[analyze-finance]', err.message)

    if (err.code === 'MISSING_API_KEY') {
      return res.status(503).json({
        error: 'Servizio AI non configurato. Imposta OPENAI_API_KEY nel file .env del server.',
        code: 'MISSING_API_KEY',
      })
    }
    if (err.code === 'INSUFFICIENT_DATA') {
      return res.status(400).json({ error: err.message, code: 'INSUFFICIENT_DATA' })
    }
    if (err.name === 'AbortError' || err.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'Timeout della richiesta AI. Riprova tra qualche secondo.',
        code: 'TIMEOUT',
      })
    }
    if (err instanceof SyntaxError) {
      return res.status(502).json({
        error: 'Risposta AI non valida. Riprova.',
        code: 'INVALID_RESPONSE',
      })
    }

    return res.status(500).json({
      error: err.message || 'Errore durante l\'analisi AI.',
      code: 'AI_ERROR',
    })
  }
}
