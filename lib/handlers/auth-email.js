// Handler auth/email DebtVision — logica condivisa Express (dev) e Vercel Functions (prod).
import {
  isResendConfigured,
  registerAndSendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../../src/server/email/resend.js'

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const rateLimitStore = new Map()

function safeLog(scope, message, meta = {}) {
  const safeMeta = { ...meta }
  delete safeMeta.password
  delete safeMeta.apiKey
  console.error(`[${scope}] ${message}`, Object.keys(safeMeta).length ? safeMeta : '')
}

function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip
  return ip || 'unknown'
}

function checkRateLimit(scope, key) {
  const bucketKey = `${scope}:${key}`
  const now = Date.now()
  const bucket = rateLimitStore.get(bucketKey) ?? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }

  if (now > bucket.resetAt) {
    bucket.count = 0
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS
  }

  bucket.count += 1
  rateLimitStore.set(bucketKey, bucket)

  if (bucket.count > RATE_LIMIT_MAX) {
    const err = new Error('Troppe richieste. Riprova tra qualche minuto.')
    err.code = 'RATE_LIMIT'
    err.retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000)
    throw err
  }
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function handleEmailError(res, err, scope = 'auth-email') {
  safeLog(scope, err.message, { code: err.code ?? 'UNKNOWN' })

  if (err.code === 'RATE_LIMIT') {
    return res.status(429).json({
      error: err.message,
      code: 'RATE_LIMIT',
      retryAfterSec: err.retryAfterSec,
    })
  }

  if (err.code === 'EMAIL_ALREADY_REGISTERED') {
    return res.status(409).json({
      error: err.message,
      code: 'EMAIL_ALREADY_REGISTERED',
    })
  }

  if (err.code === 'WEAK_PASSWORD' || err.code === 'INVALID_EMAIL' || err.code === 'INVALID_INPUT') {
    return res.status(400).json({ error: err.message, code: err.code })
  }

  if (err.code === 'MISSING_RESEND_KEY' || err.code === 'MISSING_SUPABASE_ADMIN') {
    return res.status(503).json({
      error: 'Servizio email non configurato sul server.',
      code: err.code,
    })
  }

  if (err.code === 'LINK_GENERATION_FAILED' || err.code === 'SUPABASE_ADMIN_ERROR') {
    return res.status(502).json({
      error: err.message || 'Errore durante la creazione dell\'account.',
      code: err.code,
    })
  }

  if (String(err.message).toLowerCase().includes('user not found')) {
    return res.status(200).json({
      ok: true,
      message: 'Se l\'email è registrata, riceverai un messaggio a breve.',
    })
  }

  return res.status(500).json({
    error: err.message || 'Errore durante l\'invio email.',
    code: err.code ?? 'EMAIL_ERROR',
  })
}

export async function registerHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' })
  }

  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Indirizzo email non valido.',
        code: 'INVALID_EMAIL',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password troppo debole. Usa almeno 6 caratteri.',
        code: 'WEAK_PASSWORD',
      })
    }

    checkRateLimit('register', `${getClientKey(req)}:${email}`)

    const result = await registerAndSendVerificationEmail({ email, password })

    console.info('[auth-register] Registrazione completata', {
      email,
      resendEmailId: result?.id ?? null,
    })

    return res.status(200).json({
      ok: true,
      message:
        'Registrazione completata. Controlla la tua email e conferma l\'account prima di accedere.',
    })
  } catch (err) {
    return handleEmailError(res, err, 'auth-register')
  }
}

export async function sendVerificationEmailHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' })
  }

  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (!isValidEmail(email) || password.length < 6) {
      return res.status(400).json({
        error: 'Email o password non validi.',
        code: 'INVALID_INPUT',
      })
    }

    checkRateLimit('verify', `${getClientKey(req)}:${email}`)

    await sendVerificationEmail({ email, password })

    return res.status(200).json({
      ok: true,
      message: 'Email di verifica inviata.',
    })
  } catch (err) {
    return handleEmailError(res, err)
  }
}

export async function sendPasswordResetEmailHandler(req, res) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' })
  }

  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Email non valida.',
        code: 'INVALID_INPUT',
      })
    }

    checkRateLimit('reset', `${getClientKey(req)}:${email}`)

    const result = await sendPasswordResetEmail({ email })

    return res.status(200).json({
      ok: true,
      message: 'Se l\'email è registrata, riceverai un messaggio a breve.',
      fallback: result?.fallback ?? null,
    })
  } catch (err) {
    if (String(err.message).toLowerCase().includes('user not found')) {
      return res.status(200).json({
        ok: true,
        message: 'Se l\'email è registrata, riceverai un messaggio a breve.',
      })
    }
    return handleEmailError(res, err)
  }
}

export function getEmailHealth() {
  return {
    resendConfigured: isResendConfigured(),
    emailFrom: process.env.EMAIL_FROM || 'noreply@debtvision.app',
  }
}
