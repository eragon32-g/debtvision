// Parsing e normalizzazione importi monetari (virgola/punto, formato italiano).

export function roundMoney(value) {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100) / 100
}

/**
 * Converte un valore in number con punto decimale.
 * Supporta: 123.45, 123,45, 1.234,56, numeri nativi.
 * Non tronca a interi; arrotonda a 2 decimali per evitare rumore floating-point.
 */
export function parseMoney(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') {
    return Number.isFinite(value) ? roundMoney(value) : 0
  }

  let s = String(value).trim().replace(/\s/g, '').replace(/€/gi, '')
  if (!s || s === '-') return 0

  const hasComma = s.includes(',')
  const hasDot = s.includes('.')

  if (hasComma && hasDot) {
    // Formato italiano: 1.234,56
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    s = s.replace(',', '.')
  } else if (hasDot) {
    const parts = s.split('.')
    if (parts.length > 2) {
      const dec = parts.pop()
      s = `${parts.join('')}.${dec}`
    }
  }

  const n = parseFloat(s)
  return Number.isFinite(n) ? roundMoney(n) : 0
}
