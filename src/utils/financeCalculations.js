// Calcoli finanziari di base (Fase 2)
// Tutte le funzioni sono pure e accettano l'oggetto dati finanziari.

function num(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? n : 0
}

// Entrate totali = somma voci in incomeEntries[]
export function getTotalIncome(data) {
  const entries = data?.incomeEntries ?? []
  return entries.reduce((sum, entry) => sum + num(entry?.amount), 0)
}

// Spese fisse totali = somma voci in fixedExpenseEntries[]
export function getTotalFixedExpenses(data) {
  const entries = data?.fixedExpenseEntries ?? []
  return entries.reduce((sum, entry) => sum + num(entry?.amount), 0)
}

// Risparmi accantonati (liquidity.savings)
export function getSavingsAmount(data) {
  return num(data?.liquidity?.savings)
}

// Margine Mensile = entrate totali - spese totali
export function getMonthlyMargin(data) {
  return getTotalIncome(data) - getTotalFixedExpenses(data)
}

// Percentuale Spese = (spese / entrate) * 100
export function getExpensePercentage(data) {
  const income = getTotalIncome(data)
  if (income <= 0) return 0
  return (getTotalFixedExpenses(data) / income) * 100
}

// Copertura risparmi = risparmi accantonati / spese mensili (in mesi)
export function getSavingsCoverageMonths(data) {
  const expenses = getTotalFixedExpenses(data)
  const savings = getSavingsAmount(data)
  if (expenses <= 0) return 0
  return savings / expenses
}

// === Finanziamenti (Fase 3) ===

// Debito residuo totale dei finanziamenti = somma degli importi residui
export function getTotalLoansDebt(data) {
  const loans = Array.isArray(data?.loans) ? data.loans : []
  return loans.reduce((sum, loan) => sum + num(loan?.remainingAmount), 0)
}

// Rata mensile totale dei finanziamenti = somma delle rate mensili
export function getTotalLoansMonthlyPayment(data) {
  const loans = Array.isArray(data?.loans) ? data.loans : []
  return loans.reduce((sum, loan) => sum + num(loan?.monthlyPayment), 0)
}

// Debt Load Ratio = rate finanziamenti totali / entrate mensili totali * 100
export function getDebtLoadRatio(data) {
  const income = getTotalIncome(data)
  if (income <= 0) return 0
  return (getTotalLoansMonthlyPayment(data) / income) * 100
}

// Classificazione del Debt Load Ratio
export function getDebtLoadRatioClass(data) {
  const ratio = getDebtLoadRatio(data)
  if (ratio <= 20) {
    return { level: 'ottimo', label: 'OTTIMO' }
  }
  if (ratio <= 35) {
    return { level: 'buono', label: 'BUONO' }
  }
  if (ratio <= 50) {
    return { level: 'attenzione', label: 'ATTENZIONE' }
  }
  return { level: 'critico', label: 'CRITICO' }
}

// === Carte di Credito (Fase 4 / 4.1) ===

function sumBy(list, key) {
  const arr = Array.isArray(list) ? list : []
  return arr.reduce((sum, item) => sum + num(item?.[key]), 0)
}

// Plafond totale delle carte di credito
export function getTotalCardLimit(data) {
  return sumBy(data?.cards, 'totalLimit')
}

// Plafond utilizzato delle carte di credito
export function getTotalCardUsed(data) {
  return sumBy(data?.cards, 'usedLimit')
}

// Plafond ancora disponibile sulle carte = plafond totale - plafond utilizzato (min 0)
export function getAvailableCardLimit(data) {
  return Math.max(0, getTotalCardLimit(data) - getTotalCardUsed(data))
}

// Percentuale di utilizzo del plafond carte = (utilizzato / totale) * 100
// (Fase 4.1: l'esposizione al credito si basa solo sulle carte di credito)
export function getCreditUtilizationPercentage(data) {
  const limit = getTotalCardLimit(data)
  if (limit <= 0) return 0
  const used = Math.min(getTotalCardUsed(data), limit)
  return (used / limit) * 100
}

// Credit Stress Score (0-100): combina l'utilizzo del plafond carte (peso 70%)
// con il Debt Load Ratio dei finanziamenti (peso 30%), entrambi limitati a 100.
export function getCreditStressScore(data) {
  const utilization = Math.min(getCreditUtilizationPercentage(data), 100)
  const debtLoad = Math.min(getDebtLoadRatio(data), 100)
  const score = 0.7 * utilization + 0.3 * debtLoad
  return Math.round(Math.max(0, Math.min(100, score)))
}

// Classificazione del Credit Stress Score
export function getCreditStressClass(data) {
  const score = getCreditStressScore(data)
  if (score <= 25) {
    return { level: 'ottimo', label: 'OTTIMO' }
  }
  if (score <= 50) {
    return { level: 'buono', label: 'BUONO' }
  }
  if (score <= 75) {
    return { level: 'attenzione', label: 'ATTENZIONE' }
  }
  return { level: 'critico', label: 'CRITICO' }
}

// === Rateizzazioni Variabili (Fase 5) ===

function getVariableProducts(data) {
  return Array.isArray(data?.variableInstallmentProducts)
    ? data.variableInstallmentProducts
    : []
}

function getProductInstallments(product) {
  return Array.isArray(product?.installments) ? product.installments : []
}

// Mesi residui di una singola rateizzazione interna
export function getInstallmentRemainingMonths(installment) {
  const remainingCount = num(installment?.remainingInstallments)
  if (remainingCount > 0) return Math.round(remainingCount)
  // fallback: importo residuo / rata mensile
  const monthly = num(installment?.monthlyPayment)
  const remainingAmount = num(installment?.remainingAmount)
  if (monthly > 0 && remainingAmount > 0) return Math.ceil(remainingAmount / monthly)
  return 0
}

// Somma rate mensili delle rateizzazioni interne di un prodotto
export function getInternalInstallmentsMonthlyPayment(product) {
  return getProductInstallments(product).reduce(
    (sum, inst) => sum + num(inst?.monthlyPayment),
    0,
  )
}

// Somma importi residui delle rateizzazioni interne di un prodotto
function getInternalInstallmentsRemaining(product) {
  return getProductInstallments(product).reduce(
    (sum, inst) => sum + num(inst?.remainingAmount),
    0,
  )
}

// Debito variabile stimato totale.
// Per ogni prodotto usa la somma dei residui delle rateizzazioni interne se presenti,
// altrimenti l'importo residuo stimato del prodotto.
export function getTotalVariableDebt(data) {
  return getVariableProducts(data).reduce((sum, product) => {
    const internal = getInternalInstallmentsRemaining(product)
    return sum + (internal > 0 ? internal : num(product?.remainingAmount))
  }, 0)
}

// Rata mensile variabile totale = somma rata mensile attuale dei prodotti
export function getTotalVariableMonthlyPayment(data) {
  return getVariableProducts(data).reduce(
    (sum, product) => sum + num(product?.monthlyPayment),
    0,
  )
}

// Rata mensile totale delle carte di credito (utile per la previsione)
export function getTotalCardMonthlyPayment(data) {
  return sumBy(data?.cards, 'monthlyPayment')
}

// Aggiunge n mesi a una data (primo giorno del mese)
function addMonths(date, n) {
  const d = new Date(date)
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  return d
}

// Formatta una data come "Mese Anno" (es. "Lug 2026")
export function formatMonthYear(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  const label = d.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Elenco eventi di fine rateizzazione interna, ordinati cronologicamente
export function getInstallmentEndEvents(data) {
  const now = new Date()
  const events = []

  getVariableProducts(data).forEach((product) => {
    const installments = getProductInstallments(product)
    installments.forEach((inst) => {
      const remaining = getInstallmentRemainingMonths(inst)
      if (remaining <= 0) return

      // Nuova rata stimata del prodotto dopo la fine di questa rateizzazione:
      // somma delle rate interne ancora attive oltre questo mese.
      const newProductPayment = installments
        .filter((other) => getInstallmentRemainingMonths(other) > remaining)
        .reduce((sum, other) => sum + num(other.monthlyPayment), 0)

      events.push({
        monthIndex: remaining,
        monthLabel: formatMonthYear(addMonths(now, remaining)),
        productId: product.id,
        productName: product.name,
        description: inst.description,
        endingPayment: num(inst.monthlyPayment),
        newProductPayment,
      })
    })
  })

  events.sort((a, b) => a.monthIndex - b.monthIndex)
  return events
}

// Previsione della pressione mensile per i prossimi N mesi.
// Regola: quando una rateizzazione interna termina, dal mese successivo la rata
// variabile stimata scende della sua rata mensile.
export function getMonthlyPressureForecast(data, months = 24) {
  const now = new Date()
  const income = getTotalIncome(data)
  const fixed = getTotalFixedExpenses(data)
  const loanPayment = getTotalLoansMonthlyPayment(data)
  const cardPayment = getTotalCardMonthlyPayment(data)

  // Modello delle rate variabili: rateizzazioni interne con i loro mesi residui,
  // più eventuali prodotti senza rateizzazioni interne (rata costante).
  const installmentList = []
  let constantVariable = 0
  getVariableProducts(data).forEach((product) => {
    const internal = getProductInstallments(product)
    if (internal.length === 0) {
      constantVariable += num(product.monthlyPayment)
    } else {
      internal.forEach((inst) => {
        installmentList.push({
          remaining: getInstallmentRemainingMonths(inst),
          monthlyPayment: num(inst.monthlyPayment),
        })
      })
    }
  })

  const variableAtMonth = (i) =>
    constantVariable +
    installmentList.reduce(
      (sum, inst) => sum + (inst.remaining >= i ? inst.monthlyPayment : 0),
      0,
    )

  const forecast = []
  for (let i = 1; i <= months; i += 1) {
    const variablePayment = variableAtMonth(i)
    const prevVariable = variableAtMonth(i === 1 ? 1 : i - 1)
    const reduction = Math.max(0, prevVariable - variablePayment)
    const totalPayment = loanPayment + cardPayment + variablePayment
    const estimatedMargin = income - fixed - totalPayment
    forecast.push({
      monthIndex: i,
      month: formatMonthYear(addMonths(now, i)),
      loanPayment,
      cardPayment,
      variablePayment,
      totalPayment,
      reduction,
      estimatedMargin,
    })
  }
  return forecast
}

// === Patrimonio e Liquidità (Fase 7) ===

function getLiquidity(data) {
  return data?.liquidity ?? {}
}

// Liquidità totale = somma di tutti i conti e disponibilità immediate
export function getTotalLiquidity(data) {
  const liq = getLiquidity(data)
  return (
    num(liq.primaryAccount) +
    num(liq.secondaryAccount) +
    num(liq.cash) +
    num(liq.emergencyFund) +
    num(liq.otherLiquidAssets)
  )
}

// Attività totali = somma valore di tutti gli asset
export function getTotalAssets(data) {
  const assets = Array.isArray(data?.assets) ? data.assets : []
  return assets.reduce((sum, asset) => sum + num(asset?.value), 0)
}

// Debiti totali = finanziamenti + rateizzazioni variabili + utilizzo carte
export function getTotalDebt(data) {
  return (
    getTotalLoansDebt(data) +
    getTotalVariableDebt(data) +
    getTotalCardUsed(data)
  )
}

// Patrimonio Netto = Liquidità + Attività - Debiti
export function getNetWorth(data) {
  return getTotalLiquidity(data) + getTotalAssets(data) - getTotalDebt(data)
}

// Debito Netto = Debiti - Liquidità
export function getNetDebt(data) {
  return getTotalDebt(data) - getTotalLiquidity(data)
}

// Mesi di sopravvivenza = liquidità totale / spese mensili totali
export function getSurvivalMonths(data) {
  const expenses = getTotalFixedExpenses(data)
  const liquidity = getTotalLiquidity(data)
  if (expenses <= 0) return 0
  return liquidity / expenses
}

// Valutazione automatica patrimonio e liquidità
export function getWealthEvaluation(data) {
  const netWorth = getNetWorth(data)
  const survival = getSurvivalMonths(data)
  const netDebt = getNetDebt(data)

  if (netWorth < 0) {
    return {
      level: 'critico',
      label: 'PATRIMONIO NEGATIVO',
      description: 'Le passività superano liquidità e attività. Priorità: ridurre debiti e ricostruire liquidità.',
    }
  }
  if (survival < 1 || netDebt > getTotalAssets(data)) {
    return {
      level: 'fragile',
      label: 'LIQUIDITÀ INSUFFICIENTE',
      description: 'La liquidità copre meno di un mese di spese o il debito netto è elevato rispetto al patrimonio.',
    }
  }
  if (survival < 3) {
    return {
      level: 'stabile',
      label: 'PATRIMONIO IN COSTRUZIONE',
      description: 'Patrimonio netto positivo con margine di liquidità da consolidare (1-3 mesi di spese).',
    }
  }
  return {
    level: 'solido',
    label: 'PATRIMONIO SOLIDO',
    description: 'Liquidità adeguata e patrimonio netto positivo. Situazione patrimoniale sostenibile.',
  }
}

// Valutazione dello stato finanziario in base al margine mensile
export function getFinancialStatus(data) {
  const margin = getMonthlyMargin(data)
  if (margin < 0) {
    return { level: 'critico', label: 'CRITICO' }
  }
  if (margin <= 300) {
    return { level: 'attenzione', label: 'ATTENZIONE' }
  }
  return { level: 'stabile', label: 'STABILE' }
}

// Formattazione in euro (locale italiano)
export function formatCurrency(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num(value))
}

export function formatPercentage(value) {
  return `${num(value).toLocaleString('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export function formatMonths(value) {
  const n = num(value)
  const formatted = n.toLocaleString('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${formatted} ${n === 1 ? 'mese' : 'mesi'}`
}

// Formatta una data ISO (YYYY-MM-DD) in formato italiano; '—' se assente
export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
