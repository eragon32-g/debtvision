// Tassi di riferimento da fonti pubbliche ufficiali — non garantiscono il contratto personale dell'utente.

export const OFFICIAL_REFERENCE_WARNING =
  'Tasso di riferimento. Verifica sempre il contratto personale.'

export const CARD_RATE_DISCLAIMER = OFFICIAL_REFERENCE_WARNING

/** @typedef {Object} CardRateProduct
 * @property {string} id
 * @property {string} issuer
 * @property {string} productName
 * @property {number} tan
 * @property {number} taeg
 * @property {string} sourceLabel
 * @property {string} sourceUrl
 * @property {string} lastChecked
 * @property {'official_reference'} reliability
 * @property {string} warning
 * @property {string[]} issuerAliases
 * @property {string[]} typeAliases
 */

/** @type {CardRateProduct[]} */
export const CARD_RATE_PRODUCTS = [
  {
    id: 'agos-agospay',
    issuer: 'Agos',
    productName: 'AgosPay',
    tan: 15.5,
    taeg: 18.64,
    sourceLabel: 'AgosPay - pagina ufficiale Agos',
    sourceUrl: 'https://www.agos.it/carte-di-credito/istituzionali/agospay.aspx',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['agos', 'agos ducato', 'agospay'],
    typeAliases: ['agospay', 'standard', 'revolving', 'classic', 'classica'],
  },
  {
    id: 'agos-agospay-zero',
    issuer: 'Agos',
    productName: 'AgosPay Zero',
    tan: 15.95,
    taeg: 19.17,
    sourceLabel: 'AgosPay Zero - pagina ufficiale Agos',
    sourceUrl: 'https://www.agos.it/carte-di-credito/istituzionali/agospay-zero.aspx',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['agos', 'agos ducato', 'agospay'],
    typeAliases: ['agospay zero', 'agospay-zero', 'zero', 'payback'],
  },
  {
    id: 'findomestic-carta',
    issuer: 'Findomestic',
    productName: 'Carta di Credito',
    tan: 15.96,
    taeg: 17.17,
    sourceLabel: 'Carta di Credito Findomestic - pagina ufficiale',
    sourceUrl: 'https://www.findomestic.it/conti-e-carte/carta-di-credito',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['findomestic', 'findomestic banca'],
    typeAliases: ['standard', 'classic', 'classica', 'revolving', 'findomestic'],
  },
  {
    id: 'findomestic-mediaworld',
    issuer: 'Findomestic',
    productName: 'MediaWorld',
    tan: 16.92,
    taeg: 18.3,
    sourceLabel: 'Carta di Credito MediaWorld Findomestic - pagina ufficiale',
    sourceUrl: 'https://www.findomestic.it/conti-e-carte/carta-di-credito-mediaworld',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['findomestic', 'findomestic banca', 'mediaworld'],
    typeAliases: ['mediaworld', 'media world', 'media-world'],
  },
  {
    id: 'cofidis-creditline',
    issuer: 'Cofidis',
    productName: 'CreditLine',
    tan: 17.25,
    taeg: 19.26,
    sourceLabel: 'Cofidis CreditLine - pagina ufficiale',
    sourceUrl: 'https://www.cofidis.it/it/soluzioni/creditline.html',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['cofidis'],
    typeAliases: ['creditline', 'credit line', 'standard', 'classic', 'classica'],
  },
  {
    id: 'cofidis-pagocredit',
    issuer: 'Cofidis',
    productName: 'PagoCREDIT',
    tan: 17.25,
    taeg: 19.26,
    sourceLabel: 'Cofidis PagoCREDIT - pagina ufficiale',
    sourceUrl: 'https://www.cofidis.it/it/soluzioni/pagocredit.html',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['cofidis'],
    typeAliases: ['pagocredit', 'pago credit', 'pago-credit'],
  },
  {
    id: 'cofidis-revolving',
    issuer: 'Cofidis',
    productName: 'Revolving Standard',
    tan: 19.8,
    taeg: 21.7,
    sourceLabel: 'Cofidis soluzioni credito revolving - pagina ufficiale',
    sourceUrl: 'https://www.cofidis.it/it/soluzioni.html',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['cofidis'],
    typeAliases: ['revolving', 'revolving standard'],
  },
  {
    id: 'amex-ita-airways',
    issuer: 'American Express',
    productName: 'ITA Airways',
    tan: 14.0,
    taeg: 18.67,
    sourceLabel: 'American Express ITA Airways - pagina ufficiale',
    sourceUrl: 'https://www.americanexpress.com/it-it/benefici/carta-di-credito-ita-airways/',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['american express', 'amex', 'americanexpress'],
    typeAliases: ['ita airways', 'ita-airways', 'verde', 'blu', 'standard', 'explora'],
  },
  {
    id: 'amex-ita-airways-oro',
    issuer: 'American Express',
    productName: 'ITA Airways Oro',
    tan: 14.0,
    taeg: 21.84,
    sourceLabel: 'American Express ITA Airways Oro - pagina ufficiale',
    sourceUrl: 'https://www.americanexpress.com/it-it/benefici/carta-di-credito-ita-airways-oro/',
    lastChecked: '2026-06-16',
    reliability: 'official_reference',
    warning: OFFICIAL_REFERENCE_WARNING,
    issuerAliases: ['american express', 'amex', 'americanexpress'],
    typeAliases: ['ita airways oro', 'ita-airways-oro', 'oro', 'gold'],
  },
]

export function normalizeIssuerName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCardType(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function issuerMatches(product, issuer) {
  const normalized = normalizeIssuerName(issuer)
  if (!normalized) return false
  return product.issuerAliases.some(
    (alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized),
  )
}

function typeMatches(product, cardType) {
  const normalized = normalizeCardType(cardType)
  if (!normalized) return false
  return product.typeAliases.some(
    (alias) => normalized === alias || normalized.includes(alias) || alias.includes(normalized),
  )
}

function scoreProductMatch(product, issuer, cardType) {
  if (!issuerMatches(product, issuer) || !typeMatches(product, cardType)) return -1

  const normalizedType = normalizeCardType(cardType)
  let score = 0
  for (const alias of product.typeAliases) {
    if (normalizedType === alias) score += 100
    else if (normalizedType.includes(alias) || alias.includes(normalizedType)) score += 50
  }
  if (product.productName.toLowerCase().includes(normalizedType)) score += 25
  return score
}

function toSuggestion(product) {
  return {
    ...product,
    rate: product.tan,
    matchedProductId: product.id,
  }
}

/**
 * @returns {ReturnType<typeof toSuggestion> | null}
 */
export function getSuggestedCardInterestRate(issuer, cardType) {
  const normalizedType = normalizeCardType(cardType)
  if (!normalizeIssuerName(issuer) || !normalizedType) return null

  let best = null
  let bestScore = -1

  for (const product of CARD_RATE_PRODUCTS) {
    const score = scoreProductMatch(product, issuer, cardType)
    if (score > bestScore) {
      bestScore = score
      best = product
    }
  }

  return bestScore >= 0 ? toSuggestion(best) : null
}

export function getKnownIssuers() {
  return [...new Set(CARD_RATE_PRODUCTS.map((product) => product.issuer))].sort((a, b) =>
    a.localeCompare(b, 'it'),
  )
}

export function getKnownCardTypesForIssuer(issuer) {
  const normalized = normalizeIssuerName(issuer)
  if (!normalized) return []

  const products = CARD_RATE_PRODUCTS.filter((product) => issuerMatches(product, issuer))
  const types = new Set()
  for (const product of products) {
    types.add(product.productName)
    for (const alias of product.typeAliases) {
      types.add(alias.charAt(0).toUpperCase() + alias.slice(1))
    }
  }
  return [...types].sort((a, b) => a.localeCompare(b, 'it'))
}

export function getCardRateProductById(id) {
  return CARD_RATE_PRODUCTS.find((product) => product.id === id) ?? null
}

export function hasIssuerMatch(issuer) {
  return CARD_RATE_PRODUCTS.some((product) => issuerMatches(product, issuer))
}

export function formatReferenceDate(isoDate) {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}
