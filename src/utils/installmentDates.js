// Utility date e calcoli per rateizzazioni interne (modello Cofidis).
import { roundMoney } from './money.js'

function parseDateParts(dateStr) {
  const raw = String(dateStr ?? '').trim()
  if (!raw) return null

  const monthOnly = /^\d{4}-\d{2}$/.test(raw)
  const fullDate = /^\d{4}-\d{2}-\d{2}$/.test(raw)
  if (!monthOnly && !fullDate) return null

  const [year, month, day = '01'] = raw.split('-').map((part) => parseInt(part, 10))
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null

  return {
    year,
    month,
    day: monthOnly ? null : day,
    monthOnly,
    raw,
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatDateParts(year, month, day, monthOnly) {
  if (monthOnly || day == null) return `${year}-${pad2(month)}`
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/**
 * Aggiunge mesi a una data YYYY-MM o YYYY-MM-DD gestendo overflow mese/anno.
 */
export function addMonthsSafe(dateStr, months) {
  const parts = parseDateParts(dateStr)
  if (!parts || !Number.isFinite(months)) return ''

  const totalMonths = parts.month - 1 + months
  const year = parts.year + Math.floor(totalMonths / 12)
  const month = (totalMonths % 12) + 1

  if (parts.monthOnly || parts.day == null) {
    return formatDateParts(year, month, null, true)
  }

  const lastDay = new Date(year, month, 0).getDate()
  const day = Math.min(parts.day, lastDay)
  return formatDateParts(year, month, day, false)
}

export function calculateFirstPaymentDate(startDate) {
  if (!String(startDate ?? '').trim()) return ''
  return addMonthsSafe(startDate, 1)
}

/**
 * Ultima rata = data inizio + rate totali (prima rata al mese successivo).
 * Es. 2026-01-10 + 10 rate → fine 2026-11-10; 2026-01-31 + 3 → fine 2026-04-30.
 */
export function calculateInstallmentEndDate(startDate, totalInstallments) {
  const total = Math.max(0, Math.round(Number(totalInstallments) || 0))
  if (!String(startDate ?? '').trim() || total <= 0) return ''
  return addMonthsSafe(startDate, total)
}

function dateToComparable(dateStr) {
  const parts = parseDateParts(dateStr)
  if (!parts) return null
  const day = parts.day ?? 1
  return parts.year * 10000 + parts.month * 100 + day
}

function currentDateComparable(currentDate) {
  const date = currentDate instanceof Date ? currentDate : new Date(currentDate)
  if (Number.isNaN(date.getTime())) return null
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

export function calculatePaidInstallments(
  startDate,
  totalInstallments,
  currentDate = new Date(),
) {
  const total = Math.max(0, Math.round(Number(totalInstallments) || 0))
  if (!String(startDate ?? '').trim() || total <= 0) return 0

  const firstPaymentDate = calculateFirstPaymentDate(startDate)
  if (!firstPaymentDate) return 0

  const nowCmp = currentDateComparable(currentDate)
  const firstCmp = dateToComparable(firstPaymentDate)
  if (nowCmp == null || firstCmp == null || nowCmp < firstCmp) return 0

  let paid = 0
  for (let i = 0; i < total; i += 1) {
    const paymentDate = addMonthsSafe(firstPaymentDate, i)
    const paymentCmp = dateToComparable(paymentDate)
    if (paymentCmp != null && nowCmp >= paymentCmp) paid += 1
    else break
  }

  return Math.min(paid, total)
}

export function calculateRemainingInstallments(
  startDate,
  totalInstallments,
  currentDate = new Date(),
) {
  const total = Math.max(0, Math.round(Number(totalInstallments) || 0))
  const paid = calculatePaidInstallments(startDate, totalInstallments, currentDate)
  return Math.max(0, total - paid)
}

export function calculateRemainingAmount(monthlyPayment, remainingInstallments) {
  const monthly = roundMoney(monthlyPayment)
  const remaining = Math.max(0, Math.round(Number(remainingInstallments) || 0))
  if (monthly <= 0 || remaining <= 0) return 0
  return roundMoney(monthly * remaining)
}

export function computeInstallmentFields(installment, currentDate = new Date()) {
  const startDate = installment?.startDate ?? ''
  const totalInstallments = Math.max(0, Math.round(Number(installment?.totalInstallments) || 0))
  const monthlyPayment = roundMoney(installment?.monthlyPayment)

  const firstPaymentDate = calculateFirstPaymentDate(startDate)
  const endDate = calculateInstallmentEndDate(startDate, totalInstallments)
  const paidInstallments = calculatePaidInstallments(
    startDate,
    totalInstallments,
    currentDate,
  )
  const remainingInstallments = calculateRemainingInstallments(
    startDate,
    totalInstallments,
    currentDate,
  )
  const remainingAmount = calculateRemainingAmount(monthlyPayment, remainingInstallments)

  return {
    firstPaymentDate,
    endDate,
    paidInstallments,
    remainingInstallments,
    remainingAmount,
  }
}

export function normalizeInstallmentComputedFields(installment, currentDate = new Date()) {
  const computed = computeInstallmentFields(installment, currentDate)
  return {
    ...installment,
    totalInstallments: Math.max(0, Math.round(Number(installment?.totalInstallments) || 0)),
    monthlyPayment: roundMoney(installment?.monthlyPayment),
    initialAmount: roundMoney(installment?.initialAmount),
    ...computed,
  }
}

export const INSTALLMENT_AUTO_HINT =
  'Calcolato automaticamente considerando la prima rata dal mese successivo.'
