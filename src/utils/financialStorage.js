// Persistenza locale dei dati finanziari (Fase 2 / 10.2)
// Modello unificato: nessun campo legacy (netSalary, fixedExpenses flat, ecc.)

export const STORAGE_KEY = 'debtvision_financial_data'

function num(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? n : 0
}

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

// Struttura dati unificata (unica fonte di verità)
export const defaultFinancialData = {
  incomeEntries: [],
  fixedExpenseEntries: [],
  loans: [],
  cards: [],
  variableInstallmentProducts: [],
  liquidity: {
    primaryAccount: 0,
    secondaryAccount: 0,
    cash: 0,
    emergencyFund: 0,
    otherLiquidAssets: 0,
    savings: 0, // risparmi accantonati (ex income.savings)
  },
  assets: [],
  scenarioPreferences: null,
}

export const exampleFinancialData = {
  incomeEntries: [
    { id: 'example-income-1', description: 'Stipendio', amount: 1800, day: 15 },
  ],
  fixedExpenseEntries: [
    { id: 'example-expense-1', description: 'Affitto', amount: 650, day: 1 },
  ],
  loans: [
    {
      id: 'example-loan-1',
      name: 'Prestito auto',
      lender: 'Banca Esempio',
      initialAmount: 18000,
      remainingAmount: 9600,
      monthlyPayment: 245,
      billingDay: 10,
      startDate: '2023-03-01',
      endDate: '2028-03-01',
      notes: 'Acquisto auto usata',
    },
  ],
  cards: [
    {
      id: 'example-card-1',
      name: 'Carta Classic',
      issuer: 'Banca Esempio',
      cardType: 'revolving',
      totalLimit: 3000,
      usedLimit: 850,
      monthlyPayment: 120,
      billingDay: 5,
      interestRate: 16,
      notes: 'Carta revolving',
    },
  ],
  variableInstallmentProducts: [
    {
      id: 'example-vip-1',
      name: 'Cofidis',
      issuer: 'Cofidis',
      monthlyPayment: 126,
      billingDay: 5,
      remainingAmount: 1584,
      notes: 'Rateizzazioni multiple su acquisti',
      installments: [
        {
          id: 'example-inst-1',
          description: 'Smartphone',
          initialAmount: 348,
          remainingAmount: 174,
          monthlyPayment: 29,
          totalInstallments: 12,
          paidInstallments: 6,
          remainingInstallments: 6,
          startDate: '',
          endDate: '',
          notes: 'Fine tra 6 mesi',
        },
        {
          id: 'example-inst-2',
          description: 'Elettrodomestico',
          initialAmount: 756,
          remainingAmount: 420,
          monthlyPayment: 42,
          totalInstallments: 18,
          paidInstallments: 8,
          remainingInstallments: 10,
          startDate: '',
          endDate: '',
          notes: 'Fine tra 10 mesi',
        },
        {
          id: 'example-inst-3',
          description: 'PC',
          initialAmount: 1320,
          remainingAmount: 990,
          monthlyPayment: 55,
          totalInstallments: 24,
          paidInstallments: 6,
          remainingInstallments: 18,
          startDate: '',
          endDate: '',
          notes: 'Fine tra 18 mesi',
        },
      ],
    },
  ],
  liquidity: {
    primaryAccount: 1200,
    secondaryAccount: 300,
    cash: 150,
    emergencyFund: 1000,
    otherLiquidAssets: 0,
    savings: 6000,
  },
  assets: [
    { id: 'example-asset-1', category: 'auto', description: 'Auto', value: 4500 },
    { id: 'example-asset-2', category: 'investimenti', description: 'ETF', value: 1200 },
    { id: 'example-asset-3', category: 'crypto', description: 'Crypto', value: 350 },
  ],
}

const expenseLegacyLabels = {
  rentMortgage: 'Affitto / Mutuo',
  utilities: 'Bollette',
  groceries: 'Alimentari',
  transport: 'Trasporti',
  insurance: 'Assicurazioni',
  phoneInternet: 'Telefono / Internet',
  subscriptions: 'Abbonamenti',
  other: 'Altre spese',
}

const expenseLegacyDays = {
  rentMortgage: 1,
  utilities: 5,
  groceries: 10,
  transport: 10,
  insurance: 15,
  phoneInternet: 20,
  subscriptions: 25,
  other: 28,
}

function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return []
  return arr.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
}

// Migra entrate legacy → incomeEntries[]
function migrateIncomeEntries(parsed) {
  const existing = sanitizeArray(parsed?.incomeEntries)
  if (existing.length > 0) return existing

  const entries = []
  const income = parsed?.income ?? {}
  if (num(income.netSalary) > 0) {
    entries.push({
      id: 'migrated-salary',
      description: 'Stipendio netto',
      amount: num(income.netSalary),
      day: 15,
    })
  }
  if (num(income.otherIncome) > 0) {
    entries.push({
      id: 'migrated-other-income',
      description: 'Altre entrate',
      amount: num(income.otherIncome),
      day: 1,
    })
  }
  return entries
}

// Migra spese legacy → fixedExpenseEntries[]
function migrateFixedExpenseEntries(parsed) {
  const existing = sanitizeArray(parsed?.fixedExpenseEntries)
  if (existing.length > 0) return existing

  const expenses = parsed?.fixedExpenses ?? {}
  return Object.entries(expenses)
    .filter(([, value]) => num(value) > 0)
    .map(([key, value]) => ({
      id: `migrated-expense-${key}`,
      description: expenseLegacyLabels[key] ?? key,
      amount: num(value),
      day: expenseLegacyDays[key] ?? 15,
    }))
}

// Migra risparmi legacy → liquidity.savings
function migrateLiquidity(parsed) {
  const legacySavings = num(parsed?.income?.savings)
  const liq = parsed?.liquidity ?? {}
  return {
    ...defaultFinancialData.liquidity,
    ...liq,
    savings: num(liq.savings) > 0 ? num(liq.savings) : legacySavings,
  }
}

// Normalizza qualsiasi input al modello unificato (senza campi legacy)
export function normalizeFinancialData(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return clone(defaultFinancialData)
  }

  return {
    incomeEntries: migrateIncomeEntries(parsed),
    fixedExpenseEntries: migrateFixedExpenseEntries(parsed),
    loans: sanitizeArray(parsed.loans),
    cards: sanitizeArray(parsed.cards),
    variableInstallmentProducts: sanitizeArray(parsed.variableInstallmentProducts),
    liquidity: migrateLiquidity(parsed),
    assets: sanitizeArray(parsed.assets),
    scenarioPreferences: migrateScenarioPreferences(parsed),
  }
}

function migrateScenarioPreferences(parsed) {
  const prefs = parsed?.scenarioPreferences
  if (!prefs || typeof prefs !== 'object') return null
  return {
    type: prefs.type ?? null,
    params: prefs.params && typeof prefs.params === 'object' ? prefs.params : {},
  }
}

export function hasMeaningfulFinancialData(data) {
  if (!data || typeof data !== 'object') return false

  const hasIncome = (data.incomeEntries ?? []).some((e) => num(e.amount) > 0)
  const hasExpenses = (data.fixedExpenseEntries ?? []).some((e) => num(e.amount) > 0)
  const hasLoans = (data.loans ?? []).length > 0
  const hasCards = (data.cards ?? []).length > 0
  const hasVip = (data.variableInstallmentProducts ?? []).length > 0
  const hasAssets = (data.assets ?? []).some((a) => num(a.value) > 0)
  const liq = data.liquidity ?? {}
  const hasLiquidity =
    num(liq.primaryAccount) > 0 ||
    num(liq.secondaryAccount) > 0 ||
    num(liq.cash) > 0 ||
    num(liq.emergencyFund) > 0 ||
    num(liq.otherLiquidAssets) > 0 ||
    num(liq.savings) > 0

  return hasIncome || hasExpenses || hasLoans || hasCards || hasVip || hasAssets || hasLiquidity
}

// True se il payload salvato contiene ancora struttura legacy da riscrivere
export function needsPersistenceUpgrade(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return true
  if ('income' in parsed || 'fixedExpenses' in parsed) return true
  if (!Array.isArray(parsed.incomeEntries) || !Array.isArray(parsed.fixedExpenseEntries)) return true
  if (parsed.income?.savings && !parsed.liquidity?.savings) return true
  return false
}

function generateId(prefix = 'item') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyIncomeEntry() {
  return {
    id: generateId('income'),
    description: '',
    amount: 0,
    day: 1,
  }
}

export function createEmptyFixedExpenseEntry() {
  return {
    id: generateId('expense'),
    description: '',
    amount: 0,
    day: 1,
  }
}

export function createEmptyLoan() {
  return {
    id: generateId('loan'),
    name: '',
    lender: '',
    initialAmount: 0,
    remainingAmount: 0,
    monthlyPayment: 0,
    billingDay: 0,
    startDate: '',
    endDate: '',
    notes: '',
  }
}

export function createEmptyCard() {
  return {
    id: generateId('card'),
    name: '',
    issuer: '',
    cardType: 'standard',
    totalLimit: 0,
    usedLimit: 0,
    monthlyPayment: 0,
    billingDay: 0,
    interestRate: 0,
    notes: '',
  }
}

export function createEmptyVariableProduct() {
  return {
    id: generateId('vip'),
    name: '',
    issuer: '',
    monthlyPayment: 0,
    billingDay: 0,
    remainingAmount: 0,
    notes: '',
    installments: [],
  }
}

export function createEmptyInstallment() {
  return {
    id: generateId('inst'),
    description: '',
    initialAmount: 0,
    remainingAmount: 0,
    monthlyPayment: 0,
    totalInstallments: 0,
    paidInstallments: 0,
    remainingInstallments: 0,
    startDate: '',
    endDate: '',
    notes: '',
  }
}

export function createEmptyAsset() {
  return {
    id: generateId('asset'),
    category: 'auto',
    description: '',
    value: 0,
  }
}

export function loadFinancialData() {
  if (typeof window === 'undefined') return clone(defaultFinancialData)
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return clone(defaultFinancialData)
    const parsed = JSON.parse(raw)
    const normalized = normalizeFinancialData(parsed)
    if (needsPersistenceUpgrade(parsed)) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      } catch {
        // storage non disponibile
      }
    }
    return clone(normalized)
  } catch {
    return clone(defaultFinancialData)
  }
}

export function saveFinancialData(data) {
  if (typeof window === 'undefined') return
  const normalized = normalizeFinancialData(data)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  } catch {
    // storage non disponibile
  }
}

export function clearFinancialData() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignora
  }
}

export function getDefaultFinancialData() {
  return clone(defaultFinancialData)
}

export function getExampleFinancialData() {
  return clone(exampleFinancialData)
}
