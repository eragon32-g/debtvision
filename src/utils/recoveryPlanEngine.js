// Motore locale del piano di recupero finanziario (Fase 8)
// Nessuna AI, nessuna API: genera azioni prudenti da snapshot esistente.

import { getInstallmentRemainingMonths } from './financeCalculations.js'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

let actionCounter = 0

function resetActionCounter() {
  actionCounter = 0
}

function makeAction(timeframe, priority, title, description, impact, type) {
  actionCounter += 1
  return {
    id: `recovery-${timeframe}-${actionCounter}`,
    timeframe,
    priority,
    title,
    description,
    impact,
    type,
  }
}

function sortActions(actions) {
  return [...actions].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

function hasVariableEndingWithinMonths(snapshot, months) {
  const products = snapshot.variableInstallmentProducts ?? []
  return products.some((product) =>
    (product.installments ?? []).some((inst) => {
      const remaining = getInstallmentRemainingMonths(inst)
      return remaining > 0 && remaining <= months
    }),
  )
}

function getVariableEndingSoon(snapshot, months) {
  const results = []
  const products = snapshot.variableInstallmentProducts ?? []
  products.forEach((product) => {
    ;(product.installments ?? []).forEach((inst) => {
      const remaining = getInstallmentRemainingMonths(inst)
      if (remaining > 0 && remaining <= months) {
        results.push({
          product: product.name,
          description: inst.description,
          months: remaining,
          monthlyPayment: Number(inst.monthlyPayment) || 0,
        })
      }
    })
  })
  return results
}

function formatEuro(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

// Spese abbonamenti da fixedExpenseEntries[]
function getSubscriptionsExpense(snapshot) {
  const entries = snapshot.fixedExpenseEntries ?? []
  const match = entries.find((e) =>
    /abbonament/i.test(String(e.description ?? '')),
  )
  return match ? Number(match.amount) || 0 : 0
}

// --- Piano 30 giorni ---
export function generate30DayPlan(snapshot) {
  const actions = []
  const margin = snapshot.totals?.monthlyMargin ?? 0
  const fixedExpenses = snapshot.totals?.totalFixedExpenses ?? 0
  const survival = snapshot.survivalMonths ?? 0
  const savingsCoverage = snapshot.ratios?.savingsCoverageMonths ?? 0
  const cardUtil = snapshot.ratios?.creditUtilization ?? 0
  const debtLoad = snapshot.ratios?.debtLoadRatio ?? 0
  const healthScore = snapshot.financialHealthScore ?? 50
  const healthLevel = snapshot.financialHealthStatus?.level ?? 'stabile'
  const emergencyFund = Number(snapshot.liquidity?.emergencyFund) || 0
  const endingSoon = getVariableEndingSoon(snapshot, 3)

  if (margin < 0) {
    actions.push(
      makeAction(
        '30_days',
        'high',
        'Interrompi nuove spese non essenziali',
        'Il margine mensile è negativo: sospendi acquisti rateizzati, abbonamenti non necessari e spese discrezionali fino a ripristinare equilibrio.',
        'Libera cassa immediata per evitare ulteriore indebitamento.',
        'cashflow',
      ),
    )
    actions.push(
      makeAction(
        '30_days',
        'high',
        'Contatta le finanziarie se il margine resta negativo',
        'Se non riesci a coprire le rate del mese, contatta in anticipo banche e finanziarie per valutare opzioni di ristrutturazione o dilazione.',
        'Previene insoluti e penali; mantiene il dialogo con i creditori.',
        'debt',
      ),
    )
  } else if (margin < 300) {
    actions.push(
      makeAction(
        '30_days',
        'medium',
        'Riduci spese non essenziali',
        `Con un margine di ${formatEuro(margin)} (sotto 300 €), identifica 2-3 voci tagliabili subito (delivery, abbonamenti, extra).`,
        'Aumenta il margine operativo mensile senza toccare le rate obbligatorie.',
        'cashflow',
      ),
    )
  }

  if (survival < 1 || savingsCoverage < 1) {
    actions.push(
      makeAction(
        '30_days',
        'high',
        'Crea un buffer minimo di emergenza',
        'La liquidità copre meno di un mese di spese. Obiettivo immediato: accantonare almeno 200-300 € in un conto separato.',
        'Riduce il rischio di ricorrere al credito al primo imprevisto.',
        'savings',
      ),
    )
  }

  if (cardUtil > 70) {
    actions.push(
      makeAction(
        '30_days',
        'high',
        'Evita ulteriore utilizzo delle carte',
        `Il plafond è utilizzato al ${cardUtil.toFixed(0)}%. Per 30 giorni usa solo contanti o conto corrente per le spese correnti.`,
        'Ferma la crescita del debito revolving e degli interessi.',
        'credit',
      ),
    )
  }

  if (debtLoad > 35) {
    actions.push(
      makeAction(
        '30_days',
        'high',
        'Blocca nuove rateizzazioni',
        `Le rate finanziamenti assorbono oltre il 35% delle entrate (${debtLoad.toFixed(0)}%). Non aprire nuovi finanziamenti o rateizzazioni in questo periodo.`,
        'Evita di peggiorare il Debt Load Ratio già elevato.',
        'prevention',
      ),
    )
  }

  if (healthLevel === 'critico' || healthLevel === 'fragile' || healthScore <= 50) {
    actions.push(
      makeAction(
        '30_days',
        'high',
        'Attiva monitoraggio settimanale del cashflow',
        `Financial Health Score ${healthScore}/100 (${snapshot.financialHealthStatus?.label}). Controlla entrate, uscite e saldi ogni settimana.`,
        'Consente correzioni rapide prima che la situazione peggiori.',
        'stability',
      ),
    )
  }

  if (endingSoon.length > 0) {
    const first = endingSoon[0]
    actions.push(
      makeAction(
        '30_days',
        'medium',
        'Prepara il calo delle rate variabili',
        `Entro 3 mesi termina "${first.description}" (${first.product}): pianifica come reinvestire i ${formatEuro(first.monthlyPayment)} liberati, non in nuove spese.`,
        'Anticipa la gestione dell\'alleggerimento per non dissipare il beneficio.',
        'forecast',
      ),
    )
  }

  if (fixedExpenses > 0 && emergencyFund <= 0) {
    actions.push(
      makeAction(
        '30_days',
        'medium',
        'Apri un fondo emergenza dedicato',
        'Non risulta un fondo emergenza. Imposta un trasferimento automatico verso un conto separato, anche di importo modesto.',
        'Separa la liquidità di emergenza dalle spese quotidiane.',
        'savings',
      ),
    )
  }

  // Azione preventiva sempre utile se ci sono rateizzazioni variabili
  if ((snapshot.variableInstallmentProducts ?? []).length > 0 && !actions.some((a) => a.title.includes('rateizzazioni'))) {
    actions.push(
      makeAction(
        '30_days',
        'low',
        'Nessuna nuova rateizzazione variabile',
        'Hai prodotti di rateizzazione attivi. Per i prossimi 30 giorni evita nuovi acquisti frazionati (Cofidis, Findomestic, ecc.).',
        'Mantiene stabile la pressione delle rate variabili.',
        'prevention',
      ),
    )
  }

  if (actions.length === 0) {
    actions.push(
      makeAction(
        '30_days',
        'low',
        'Mantieni la disciplina attuale',
        'Nessuna criticità urgente rilevata. Continua a monitorare margine e liquidità settimanalmente.',
        'Preserva la stabilità finanziaria raggiunta.',
        'stability',
      ),
    )
  }

  return sortActions(actions)
}

// --- Piano 90 giorni ---
export function generate90DayPlan(snapshot) {
  const actions = []
  const cardUtil = snapshot.ratios?.creditUtilization ?? 0
  const debtLoad = snapshot.ratios?.debtLoadRatio ?? 0
  const fixedExpenses = snapshot.totals?.totalFixedExpenses ?? 0
  const emergencyFund = Number(snapshot.liquidity?.emergencyFund) || 0
  const subscriptions = getSubscriptionsExpense(snapshot)
  const firstRelief = snapshot.forecastReading?.firstReliefMonth
  const reliefDesc = snapshot.forecastReading?.firstReliefDescription
  const recovered = snapshot.forecastReading?.recoveredAmount ?? 0

  if (cardUtil > 50) {
    actions.push(
      makeAction(
        '90_days',
        'high',
        'Riduci progressivamente l\'utilizzo carte',
        `Obiettivo 90 giorni: scendere sotto il 50% di utilizzo plafond (attuale ${cardUtil.toFixed(0)}%). Rimborsa un importo fisso mensile sulle carte.`,
        'Migliora il Credit Stress Score e libera plafond per emergenze.',
        'credit',
      ),
    )
  } else if (cardUtil > 30) {
    actions.push(
      makeAction(
        '90_days',
        'medium',
        'Continua il rientro sulle carte',
        `Utilizzo plafond al ${cardUtil.toFixed(0)}%. Mantieni rate superiori al minimo per ridurre il capitale residuo.`,
        'Riduce gli interessi passivi sul revolving.',
        'credit',
      ),
    )
  }

  if (debtLoad > 35) {
    actions.push(
      makeAction(
        '90_days',
        'high',
        'Rientra sotto soglia Debt Load Ratio 35%',
        `Le rate finanziamenti sono al ${debtLoad.toFixed(0)}% delle entrate. Valuta estinzione anticipata parziale o rinegoziazione delle rate più pesanti.`,
        'Ripristina margine operativo e capacità di risparmio.',
        'debt',
      ),
    )
    actions.push(
      makeAction(
        '90_days',
        'low',
        'Valuta consolidamento solo dopo analisi',
        'Se il Debt Load resta elevato, puoi valutare con un consulente indipendente se un consolidamento debiti ha senso nel tuo caso. Non è una raccomandazione automatica.',
        'Esplora opzioni strutturali solo con analisi personalizzata.',
        'debt',
      ),
    )
  }

  if (fixedExpenses > 0 && emergencyFund < fixedExpenses) {
    actions.push(
      makeAction(
        '90_days',
        'high',
        'Costruisci fondo emergenza di 1 mese',
        `Obiettivo: ${formatEuro(fixedExpenses)} accantonati come fondo emergenza (attuale: ${formatEuro(emergencyFund)}).`,
        'Copre un mese di spese fisse in caso di imprevisto.',
        'savings',
      ),
    )
  }

  if (firstRelief && recovered > 0) {
    actions.push(
      makeAction(
        '90_days',
        'medium',
        'Sfrutta il primo alleggerimento previsto',
        `A ${firstRelief} termina "${reliefDesc ?? 'una rateizzazione'}": reinvesti i ${formatEuro(recovered)} liberati in riduzione debiti o risparmio, non in nuove spese.`,
        'Trasforma il calo delle rate in miglioramento patrimoniale.',
        'forecast',
      ),
    )
  }

  if (subscriptions > 0) {
    actions.push(
      makeAction(
        '90_days',
        'medium',
        'Revisiona abbonamenti e spese ricorrenti',
        `Spese abbonamenti: ${formatEuro(subscriptions)}/mese. Elenca tutti gli abbonamenti e cancella quelli non usati negli ultimi 30 giorni.`,
        'Riduce le spese fisse senza impattare le rate obbligatorie.',
        'cashflow',
      ),
    )
  }

  actions.push(
    makeAction(
      '90_days',
      'medium',
      'Ricalcola margine e forecast a 90 giorni',
      'A metà percorso, aggiorna i dati in DebtVision e verifica se margine, liquidità e forecast sono migliorati.',
      'Permette di correggere il piano in base ai progressi reali.',
      'stability',
    ),
  )

  return sortActions(actions)
}

// --- Piano 12 mesi ---
export function generate12MonthPlan(snapshot) {
  const actions = []
  const cardUtil = snapshot.ratios?.creditUtilization ?? 0
  const survival = snapshot.survivalMonths ?? 0
  const fixedExpenses = snapshot.totals?.totalFixedExpenses ?? 0
  const netDebt = snapshot.netDebt ?? 0
  const healthScore = snapshot.financialHealthScore ?? 50
  const forecast = snapshot.forecast ?? []
  const trend = snapshot.forecastReading?.trend

  const targetLiquidity = fixedExpenses * 3

  if (survival < 3 && fixedExpenses > 0) {
    actions.push(
      makeAction(
        '12_months',
        'high',
        'Arriva a 3 mesi di liquidità',
        `Obiettivo annuale: ${formatEuro(targetLiquidity)} di liquidità totale (3 mesi di spese). Attuale copertura: ${survival.toFixed(1)} mesi.`,
        'Crea un cuscinetto solido contro imprevisti e perdita di reddito.',
        'savings',
      ),
    )
  }

  if (cardUtil > 50) {
    actions.push(
      makeAction(
        '12_months',
        'high',
        'Porta esposizione carte sotto 50%',
        `Utilizzo attuale ${cardUtil.toFixed(0)}%. Piano annuale: rimborsi costanti fino a utilizzo inferiore al 50% del plafond.`,
        'Riduce stress creditizio e costi di interesse.',
        'credit',
      ),
    )
  }

  if ((snapshot.variableInstallmentProducts ?? []).length > 0) {
    actions.push(
      makeAction(
        '12_months',
        'high',
        'Zero nuove rateizzazioni per 12 mesi',
        'Mantieni la regola: nessun nuovo acquisto rateizzato per tutto l\'anno. Usa solo risparmio o acquisti contanti pianificati.',
        'Evita che nuove rate annullino gli alleggerimenti futuri.',
        'prevention',
      ),
    )
  }

  const futureReliefs = forecast.filter((row) => row.reduction > 0)
  if (futureReliefs.length > 0 || netDebt > 0) {
    actions.push(
      makeAction(
        '12_months',
        'medium',
        'Usa alleggerimenti futuri per ridurre debito netto',
        netDebt > 0
          ? `Debito netto ${formatEuro(netDebt)}. Ogni rata che termina va reinvestita in estinzione anticipata o fondo emergenza.`
          : 'Quando le rateizzazioni terminano, destina l\'importo liberato al risparmio o alla riduzione debiti.',
        'Accelera il miglioramento del patrimonio netto nel tempo.',
        'debt',
      ),
    )
  }

  if (healthScore < 75) {
    actions.push(
      makeAction(
        '12_months',
        'medium',
        'Migliora il Financial Health Score',
        `Score attuale ${healthScore}/100. Obiettivo annuale: superare 75 (STABILE) migliorando margine, liquidità e gestione debiti.`,
        'Misura oggettiva dei progressi nel recupero finanziario.',
        'stability',
      ),
    )
  }

  if (forecast.length > 0) {
    const lastMargin = forecast[forecast.length - 1]?.estimatedMargin ?? 0
    const firstMargin = forecast[0]?.estimatedMargin ?? 0
    actions.push(
      makeAction(
        '12_months',
        'medium',
        'Crea previsione annuale di recupero',
        trend === 'migliora'
          ? `Il forecast indica un miglioramento del margine (da ${formatEuro(firstMargin)} a ${formatEuro(lastMargin)}). Mantieni il percorso.`
          : `Monitora mensilmente il forecast: margine stimato tra ${formatEuro(firstMargin)} e ${formatEuro(lastMargin)} nei prossimi 12 mesi.`,
        'Tiene traccia del percorso di recupero e degli obiettivi intermedi.',
        'forecast',
      ),
    )
  }

  actions.push(
    makeAction(
      '12_months',
      'low',
      'Revisione annuale completa',
      'A fine anno, aggiorna tutti i dati (entrate, spese, debiti, patrimonio) e rigenera il piano per il periodo successivo.',
      'Mantiene il piano allineato alla situazione reale.',
      'stability',
    ),
  )

  return sortActions(actions)
}

// --- Piano completo ---
export function generateRecoveryPlan(snapshot) {
  resetActionCounter()
  return {
    thirtyDays: generate30DayPlan(snapshot),
    ninetyDays: generate90DayPlan(snapshot),
    twelveMonths: generate12MonthPlan(snapshot),
  }
}

// Stili priorità (riutilizzabili nelle pagine)
export const recoveryPriorityStyles = {
  high: 'bg-rose-500/10 text-rose-300',
  medium: 'bg-amber-500/10 text-amber-300',
  low: 'bg-slate-500/10 text-slate-400',
}

export const recoveryTypeLabels = {
  debt: 'Debiti',
  cashflow: 'Cashflow',
  savings: 'Risparmio',
  credit: 'Credito',
  prevention: 'Prevenzione',
  forecast: 'Forecast',
  stability: 'Stabilità',
}

export const recoveryTimeframeLabels = {
  '30_days': '30 giorni',
  '90_days': '90 giorni',
  '12_months': '12 mesi',
}
