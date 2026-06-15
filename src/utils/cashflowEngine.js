// Motore cashflow mensile (Fase 9) — simulazione locale, nessuna API.

function num(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? n : 0
}

function clampDay(day) {
  const d = Math.round(num(day))
  if (d < 1) return 1
  if (d > 31) return 31
  return d
}

let eventCounter = 0

function makeEvent(dateDay, type, description, amount, direction) {
  eventCounter += 1
  return {
    id: `cf-event-${eventCounter}`,
    dateDay: clampDay(dateDay),
    type,
    description,
    amount: num(amount),
    direction,
  }
}

// Estrae le entrate dallo snapshot (incomeEntries[])
function getIncomeSources(snapshot) {
  const entries = snapshot.incomeEntries ?? []
  return entries.map((e) => ({
    description: e.description || 'Entrata',
    amount: num(e.amount),
    day: clampDay(e.day),
  }))
}

// Estrae le spese fisse dallo snapshot (fixedExpenseEntries[])
function getExpenseSources(snapshot) {
  const entries = snapshot.fixedExpenseEntries ?? []
  return entries.map((e) => ({
    description: e.description || 'Spesa fissa',
    amount: num(e.amount),
    day: clampDay(e.day),
  }))
}

// Genera timeline mensile ordinata per giorno
export function generateMonthlyTimeline(snapshot) {
  eventCounter = 0
  const events = []

  getIncomeSources(snapshot).forEach((src) => {
    if (num(src.amount) > 0) {
      events.push(makeEvent(src.day, 'income', src.description, src.amount, 'income'))
    }
  })

  getExpenseSources(snapshot).forEach((src) => {
    if (num(src.amount) !== 0) {
      events.push(makeEvent(src.day, 'fixed_expense', src.description, src.amount, 'expense'))
    }
  })

  ;(snapshot.loans ?? []).forEach((loan) => {
    if (num(loan.monthlyPayment) > 0) {
      events.push(
        makeEvent(
          loan.billingDay || 10,
          'loan',
          loan.name || 'Finanziamento',
          loan.monthlyPayment,
          'expense',
        ),
      )
    }
  })

  ;(snapshot.cards ?? []).forEach((card) => {
    if (num(card.monthlyPayment) > 0) {
      events.push(
        makeEvent(
          card.billingDay || 5,
          'card',
          card.name || 'Carta di credito',
          card.monthlyPayment,
          'expense',
        ),
      )
    }
  })

  ;(snapshot.variableInstallmentProducts ?? []).forEach((product) => {
    if (num(product.monthlyPayment) > 0) {
      events.push(
        makeEvent(
          product.billingDay || 5,
          'variable',
          product.name || 'Rateizzazione',
          product.monthlyPayment,
          'expense',
        ),
      )
    }
  })

  return events.sort((a, b) => a.dateDay - b.dateDay || a.description.localeCompare(b.description))
}

// Classifica rischio sconfinamento
export function classifyOverdraftRisk(minimumBalance, negativeDays, totalLiquidity, totalExpenses) {
  if (negativeDays.length > 0 || minimumBalance < -100) {
    return { level: 'CRITICAL', label: 'CRITICO' }
  }
  if (minimumBalance < 200 || minimumBalance < totalLiquidity * 0.1) {
    return { level: 'HIGH', label: 'ALTO' }
  }
  if (minimumBalance < totalExpenses * 0.5 || minimumBalance < 500) {
    return { level: 'MEDIUM', label: 'MEDIO' }
  }
  return { level: 'LOW', label: 'BASSO' }
}

// Simula saldo giornaliero partendo dalla liquidità totale
export function simulateMonthlyBalance(snapshot) {
  const startingBalance = num(snapshot.totals?.totalLiquidity)
  const timeline = generateMonthlyTimeline(snapshot)
  const totalExpenses =
    num(snapshot.totals?.totalFixedExpenses) +
    num(snapshot.totals?.loansMonthlyPayment) +
    num(snapshot.totals?.cardMonthlyPayment) +
    num(snapshot.totals?.variableMonthlyPayment)

  let currentBalance = startingBalance
  const dailyBalances = []
  const negativeDays = []
  let minimumBalance = startingBalance
  let minimumBalanceDay = 0

  // Giorno 0: saldo iniziale
  dailyBalances.push({
    day: 0,
    balance: startingBalance,
    events: [],
    label: 'Inizio mese',
  })

  for (let day = 1; day <= 31; day += 1) {
    const dayEvents = timeline.filter((e) => e.dateDay === day)
    dayEvents.forEach((e) => {
      currentBalance += e.direction === 'income' ? e.amount : -e.amount
    })
    dailyBalances.push({ day, balance: currentBalance, events: dayEvents })

    if (currentBalance < minimumBalance) {
      minimumBalance = currentBalance
      minimumBalanceDay = day
    }
    if (currentBalance < 0 && !negativeDays.includes(day)) {
      negativeDays.push(day)
    }
  }

  const overdraftRisk = classifyOverdraftRisk(
    minimumBalance,
    negativeDays,
    startingBalance,
    totalExpenses || 1,
  )

  return {
    startingBalance,
    dailyBalances,
    minimumBalance,
    minimumBalanceDay,
    negativeDays,
    overdraftRisk,
    timeline,
  }
}

// Timeline con saldo cumulativo per ogni evento (per tabella Forecast/Report)
export function generateTimelineWithBalances(snapshot) {
  const simulation = simulateMonthlyBalance(snapshot)
  const rows = []
  let balance = simulation.startingBalance

  simulation.timeline.forEach((event) => {
    balance += event.direction === 'income' ? event.amount : -event.amount
    rows.push({
      ...event,
      resultingBalance: balance,
    })
  })

  return rows
}

// Raccomandazioni operative basate sul cashflow
export function getCashflowRecommendations(simulation) {
  const recs = []
  const { minimumBalance, minimumBalanceDay, negativeDays, overdraftRisk } = simulation

  if (overdraftRisk.level === 'CRITICAL') {
    recs.push(
      'Evita nuovi addebiti fino a ripristino del saldo. Valuta anticipo entrate o posticipo spese non obbligatorie.',
    )
  }
  if (negativeDays.length > 0) {
    recs.push(
      `Saldo negativo previsto nei giorni ${negativeDays.join(', ')}: tieni un buffer aggiuntivo sul conto principale.`,
    )
  }
  if (minimumBalanceDay > 0 && minimumBalance < simulation.startingBalance * 0.3) {
    recs.push(
      `Il giorno più critico è il ${minimumBalanceDay} (saldo minimo ${minimumBalance.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}).`,
    )
  }
  if (overdraftRisk.level === 'LOW') {
    recs.push('Il cashflow mensile appare ben distribuito. Mantieni il monitoraggio settimanale.')
  }
  if (recs.length === 0) {
    recs.push('Monitora il saldo nei giorni con più uscite concentrate.')
  }
  return recs
}

export const overdraftRiskStyles = {
  CRITICAL: { badge: 'bg-rose-500/10 text-rose-300 ring-rose-500/30', text: 'text-rose-400' },
  HIGH: { badge: 'bg-amber-500/10 text-amber-300 ring-amber-500/30', text: 'text-amber-400' },
  MEDIUM: { badge: 'bg-brand-500/10 text-brand-300 ring-brand-500/30', text: 'text-brand-300' },
  LOW: { badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30', text: 'text-emerald-400' },
}
