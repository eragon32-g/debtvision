// Generatore PDF locale (Fase 11) — nessun server, nessuna API.
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  getInstallmentEndEvents,
  getDebtLoadRatioClass,
  getCreditStressClass,
} from './financeCalculations.js'
import { getInsightsByType } from './financialInsights.js'

const MARGIN = 14
const PAGE_W = 210
const CONTENT_W = PAGE_W - MARGIN * 2

const C = {
  primary: [30, 41, 59],
  accent: [99, 102, 241],
  text: [51, 65, 85],
  muted: [100, 116, 139],
  light: [248, 250, 252],
  white: [255, 255, 255],
  critico: [220, 38, 38],
  fragile: [245, 158, 11],
  stabile: [59, 130, 246],
  solido: [16, 185, 129],
  border: [226, 232, 240],
}

const HEALTH_COLORS = {
  critico: C.critico,
  fragile: C.fragile,
  stabile: C.stabile,
  solido: C.solido,
}

const NO_DATA = 'Nessun dato disponibile'

import { parseMoney } from './money.js'

const num = parseMoney

function fmtEuro(value) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num(value))
}

function fmtPct(value) {
  return `${num(value).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

function fmtMonths(value) {
  const n = num(value)
  const f = n.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${f} ${n === 1 ? 'mese' : 'mesi'}`
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function fileDate(iso) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function safeText(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

class PdfBuilder {
  constructor() {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    this.y = MARGIN
  }

  rgb(color) {
    this.doc.setTextColor(color[0], color[1], color[2])
  }

  ensureSpace(needed) {
    const pageH = this.doc.internal.pageSize.getHeight()
    if (this.y + needed > pageH - MARGIN) {
      this.doc.addPage()
      this.y = MARGIN
    }
  }

  sectionTitle(title) {
    this.ensureSpace(14)
    this.doc.setFillColor(...C.primary)
    this.doc.rect(MARGIN, this.y, CONTENT_W, 8, 'F')
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(11)
    this.rgb(C.white)
    this.doc.text(title, MARGIN + 3, this.y + 5.5)
    this.y += 12
    this.rgb(C.text)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
  }

  paragraph(text, fontSize = 9) {
    this.doc.setFontSize(fontSize)
    this.rgb(C.text)
    const lines = this.doc.splitTextToSize(text, CONTENT_W)
    this.ensureSpace(lines.length * 4.5 + 2)
    this.doc.text(lines, MARGIN, this.y)
    this.y += lines.length * 4.5 + 3
  }

  keyValueTable(rows) {
    if (!rows.length) {
      this.paragraph(NO_DATA)
      return
    }
    autoTable(this.doc, {
      startY: this.y,
      margin: { left: MARGIN, right: MARGIN },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, textColor: C.text },
      columnStyles: {
        0: { cellWidth: 75, textColor: C.muted },
        1: { cellWidth: 'auto', fontStyle: 'bold' },
      },
      body: rows.map(([label, value]) => [label, safeText(value)]),
    })
    this.y = this.doc.lastAutoTable.finalY + 6
  }

  dataTable(head, body, emptyMsg = NO_DATA) {
    const rows = body?.length ? body : [[emptyMsg]]
    autoTable(this.doc, {
      startY: this.y,
      margin: { left: MARGIN, right: MARGIN },
      head: head ? [head] : undefined,
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: C.primary,
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: C.text },
      alternateRowStyles: { fillColor: C.light },
    })
    this.y = this.doc.lastAutoTable.finalY + 6
  }

  bulletList(items, emptyMsg = NO_DATA) {
    if (!items?.length) {
      this.paragraph(emptyMsg)
      return
    }
    items.forEach((item) => {
      const lines = this.doc.splitTextToSize(`• ${item}`, CONTENT_W - 4)
      this.ensureSpace(lines.length * 4.5)
      this.doc.text(lines, MARGIN + 2, this.y)
      this.y += lines.length * 4.5 + 1
    })
    this.y += 2
  }

  actionList(actions, emptyMsg = NO_DATA) {
    if (!actions?.length) {
      this.paragraph(emptyMsg)
      return
    }
    actions.forEach((action, i) => {
      const title = `${i + 1}. ${action.title} [${action.priority?.toUpperCase() ?? '—'}]`
      const desc = action.description ?? ''
      const titleLines = this.doc.splitTextToSize(title, CONTENT_W)
      const descLines = this.doc.splitTextToSize(desc, CONTENT_W - 2)
      this.ensureSpace(titleLines.length * 4 + descLines.length * 3.5 + 4)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(9)
      this.rgb(C.text)
      this.doc.text(titleLines, MARGIN, this.y)
      this.y += titleLines.length * 4
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(8)
      this.rgb(C.muted)
      this.doc.text(descLines, MARGIN + 2, this.y)
      this.y += descLines.length * 3.5 + 3
    })
    this.y += 2
  }
}

function buildCover(builder, snapshot) {
  const { doc } = builder
  const pageH = doc.internal.pageSize.getHeight()
  const health = snapshot.financialHealthStatus ?? {}
  const level = health.level ?? 'stabile'
  const healthColor = HEALTH_COLORS[level] ?? C.stabile

  doc.setFillColor(...C.light)
  doc.rect(0, 0, PAGE_W, pageH, 'F')

  doc.setFillColor(...C.primary)
  doc.rect(0, 0, PAGE_W, 42, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text('DebtVision', PAGE_W / 2, 22, { align: 'center' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('Financial Recovery Report', PAGE_W / 2, 32, { align: 'center' })

  builder.y = 58
  doc.setFontSize(10)
  builder.rgb(C.muted)
  doc.text(`Generato il ${fmtDate(snapshot.generatedAt)}`, PAGE_W / 2, builder.y, {
    align: 'center',
  })
  builder.y += 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  builder.rgb(C.text)
  doc.text('Stato finanziario', PAGE_W / 2, builder.y, { align: 'center' })
  builder.y += 8

  doc.setFillColor(...healthColor)
  doc.roundedRect(PAGE_W / 2 - 35, builder.y, 70, 12, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(safeText(health.label, '—'), PAGE_W / 2, builder.y + 8, { align: 'center' })
  builder.y += 22

  const score = snapshot.financialHealthScore ?? 0
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(36)
  builder.rgb(healthColor)
  doc.text(String(score), PAGE_W / 2, builder.y, { align: 'center' })
  builder.y += 8
  doc.setFontSize(10)
  builder.rgb(C.muted)
  doc.text('Financial Health Score / 100', PAGE_W / 2, builder.y, { align: 'center' })

  builder.y = pageH - 30
  doc.setFontSize(8)
  doc.text('Report generato localmente — i dati non lasciano il dispositivo.', PAGE_W / 2, builder.y, {
    align: 'center',
  })

  doc.addPage()
  builder.y = MARGIN
}

function buildSummary(builder, snapshot) {
  const t = snapshot.totals ?? {}
  builder.sectionTitle('2. Sintesi generale')
  builder.keyValueTable([
    ['Entrate mensili', fmtEuro(t.totalIncome)],
    ['Spese fisse', fmtEuro(t.totalFixedExpenses)],
    ['Margine mensile', fmtEuro(t.monthlyMargin)],
    ['Patrimonio netto', fmtEuro(snapshot.netWorth)],
    ['Debito netto', fmtEuro(snapshot.netDebt)],
    ['Liquidità totale', fmtEuro(t.totalLiquidity)],
    ['Mesi di sopravvivenza', fmtMonths(snapshot.survivalMonths)],
  ])
}

function buildLoans(builder, snapshot) {
  const t = snapshot.totals ?? {}
  const r = snapshot.ratios ?? {}
  const debtLoadClass = getDebtLoadRatioClass(snapshot)
  const loans = snapshot.loans ?? []

  builder.sectionTitle('3. Debiti e finanziamenti')
  builder.keyValueTable([
    ['Debito finanziamenti', fmtEuro(t.loansDebt)],
    ['Rate finanziamenti', fmtEuro(t.loansMonthlyPayment)],
    ['Debt Load Ratio', `${fmtPct(r.debtLoadRatio)} (${debtLoadClass.label})`],
  ])

  if (loans.length === 0) {
    builder.paragraph(NO_DATA)
    return
  }

  builder.dataTable(
    ['Nome', 'Rata mensile', 'Residuo', 'Giorno addebito'],
    loans.map((loan) => [
      safeText(loan.name, '—'),
      fmtEuro(loan.monthlyPayment),
      fmtEuro(loan.remainingAmount),
      loan.billingDay > 0 ? `Giorno ${loan.billingDay}` : '—',
    ]),
  )
}

function buildCards(builder, snapshot) {
  const t = snapshot.totals ?? {}
  const r = snapshot.ratios ?? {}
  const creditClass = getCreditStressClass(snapshot)
  const cards = snapshot.cards ?? []

  builder.sectionTitle('4. Carte di credito')
  builder.keyValueTable([
    ['Numero carte', cards.length > 0 ? String(cards.length) : NO_DATA],
    ['Plafond totale', fmtEuro(t.cardLimit)],
    ['Plafond utilizzato', fmtEuro(t.cardUsed)],
    ['Plafond disponibile', fmtEuro(t.cardAvailable)],
    ['Credit Stress Score', `${r.creditStressScore ?? 0}/100 (${creditClass.label})`],
  ])

  if (cards.length > 0) {
    builder.dataTable(
      ['Carta', 'Utilizzato', 'Plafond', 'Rata'],
      cards.map((card) => [
        safeText(card.name, '—'),
        fmtEuro(card.usedLimit),
        fmtEuro(card.totalLimit),
        fmtEuro(card.monthlyPayment),
      ]),
    )
  }
}

function buildVariable(builder, snapshot) {
  const t = snapshot.totals ?? {}
  const products = snapshot.variableInstallmentProducts ?? []
  const endEvents = getInstallmentEndEvents(snapshot)
  const nextRelief = endEvents[0] ?? null
  const firstFive = endEvents.slice(0, 5)

  builder.sectionTitle('5. Rateizzazioni variabili')
  builder.keyValueTable([
    ['Prodotti attivi', products.length > 0 ? String(products.length) : NO_DATA],
    ['Rata variabile totale', fmtEuro(t.variableMonthlyPayment)],
    ['Debito variabile stimato', fmtEuro(t.variableDebt)],
    [
      'Prossimo alleggerimento',
      nextRelief
        ? `${nextRelief.monthLabel} — ${nextRelief.description} (−${fmtEuro(nextRelief.endingPayment)})`
        : NO_DATA,
    ],
  ])

  builder.paragraph('Prime 5 scadenze:', 9)
  if (firstFive.length === 0) {
    builder.paragraph(NO_DATA)
    return
  }
  builder.dataTable(
    ['Mese', 'Prodotto', 'Descrizione', 'Riduzione'],
    firstFive.map((e) => [
      e.monthLabel,
      safeText(e.productName),
      safeText(e.description),
      `−${fmtEuro(e.endingPayment)}`,
    ]),
  )
}

function buildCashflow(builder, snapshot) {
  const cf = snapshot.cashflow ?? {}
  const risk = snapshot.overdraftRisk ?? {}
  const timeline = snapshot.monthlyTimeline ?? []
  const negativeDays = snapshot.negativeDays ?? []

  builder.sectionTitle('6. Cashflow mensile')
  builder.keyValueTable([
    ['Saldo minimo previsto', fmtEuro(snapshot.minimumBalance)],
    [
      'Giorno critico',
      cf.minimumBalanceDay > 0 ? `Giorno ${cf.minimumBalanceDay}` : NO_DATA,
    ],
    [
      'Giorni negativi',
      negativeDays.length > 0 ? negativeDays.join(', ') : 'Nessuno',
    ],
    ['Rischio sconfinamento', safeText(risk.label, NO_DATA)],
  ])

  builder.paragraph('Prime scadenze del mese:', 9)
  if (timeline.length === 0) {
    builder.paragraph(NO_DATA)
    return
  }
  builder.dataTable(
    ['Giorno', 'Evento', 'Importo', 'Saldo'],
    timeline.slice(0, 10).map((row) => [
      String(row.dateDay),
      safeText(row.description),
      `${row.direction === 'income' ? '+' : '−'}${fmtEuro(row.amount)}`,
      fmtEuro(row.resultingBalance),
    ]),
  )
}

function buildForecast(builder, snapshot) {
  const forecast = (snapshot.forecast ?? []).slice(0, 12)

  builder.sectionTitle('7. Forecast 24 mesi (primi 12)')
  if (forecast.length === 0) {
    builder.paragraph(NO_DATA)
    return
  }
  builder.dataTable(
    ['Mese', 'Rate totali', 'Margine stimato', 'Riduzione'],
    forecast.map((row) => [
      row.month,
      fmtEuro(row.totalPayment),
      fmtEuro(row.estimatedMargin),
      row.reduction > 0 ? `−${fmtEuro(row.reduction)}` : '—',
    ]),
  )
}

function buildInsights(builder, snapshot) {
  const insights = snapshot.insights ?? []
  const risks = getInsightsByType(insights, 'danger').concat(
    getInsightsByType(insights, 'warning'),
  )
  const positives = getInsightsByType(insights, 'positive')
  const alerts = insights.filter((i) => i.type === 'danger' || i.priority === 'high')

  builder.sectionTitle('8. Insight principali')

  builder.doc.setFont('helvetica', 'bold')
  builder.doc.setFontSize(9)
  builder.rgb(C.critico)
  builder.ensureSpace(6)
  builder.doc.text('Rischi principali', MARGIN, builder.y)
  builder.y += 5
  builder.doc.setFont('helvetica', 'normal')
  builder.bulletList(
    risks.map((i) => `${i.title}: ${i.message}`),
    NO_DATA,
  )

  builder.doc.setFont('helvetica', 'bold')
  builder.rgb(C.solido)
  builder.ensureSpace(6)
  builder.doc.text('Segnali positivi', MARGIN, builder.y)
  builder.y += 5
  builder.doc.setFont('helvetica', 'normal')
  builder.bulletList(
    positives.map((i) => `${i.title}: ${i.message}`),
    NO_DATA,
  )

  builder.doc.setFont('helvetica', 'bold')
  builder.rgb(C.fragile)
  builder.ensureSpace(6)
  builder.doc.text('Avvisi importanti', MARGIN, builder.y)
  builder.y += 5
  builder.doc.setFont('helvetica', 'normal')
  builder.bulletList(
    alerts.map((i) => `${i.title}: ${i.message}`),
    NO_DATA,
  )
}

function buildRecoveryPlan(builder, snapshot) {
  const plan = snapshot.recoveryPlan ?? {}

  builder.sectionTitle('9. Piano operativo')

  builder.doc.setFont('helvetica', 'bold')
  builder.doc.setFontSize(9)
  builder.rgb(C.text)
  builder.ensureSpace(6)
  builder.doc.text('Piano 30 giorni', MARGIN, builder.y)
  builder.y += 5
  builder.actionList(plan.thirtyDays)

  builder.doc.setFont('helvetica', 'bold')
  builder.ensureSpace(6)
  builder.doc.text('Piano 90 giorni', MARGIN, builder.y)
  builder.y += 5
  builder.actionList(plan.ninetyDays)

  builder.doc.setFont('helvetica', 'bold')
  builder.ensureSpace(6)
  builder.doc.text('Piano 12 mesi', MARGIN, builder.y)
  builder.y += 5
  builder.actionList(plan.twelveMonths)
}

function buildDisclaimer(builder) {
  builder.ensureSpace(40)
  builder.sectionTitle('10. Disclaimer')
  builder.paragraph(
    'Questo report è uno strumento di supporto organizzativo e non costituisce consulenza finanziaria, legale o fiscale. Le decisioni finanziarie devono essere valutate con attenzione e, se necessario, con un professionista qualificato.',
    8,
  )
}

// Genera e scarica il PDF del report DebtVision
export function generateDebtVisionPdf(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Snapshot non valido per la generazione PDF.')
  }

  const builder = new PdfBuilder()

  buildCover(builder, snapshot)
  buildSummary(builder, snapshot)
  buildLoans(builder, snapshot)
  buildCards(builder, snapshot)
  buildVariable(builder, snapshot)
  buildCashflow(builder, snapshot)
  buildForecast(builder, snapshot)
  buildInsights(builder, snapshot)
  buildRecoveryPlan(builder, snapshot)
  buildDisclaimer(builder)

  const filename = `debtvision-report-${fileDate(snapshot.generatedAt)}.pdf`
  builder.doc.save(filename)
  return filename
}
