// Email brandizzate DebtVision via Resend (server only).
import { Resend } from 'resend'
import {
  fallbackSupabasePasswordReset,
  generatePasswordResetLink,
  generateVerificationLink,
  createUnconfirmedUser,
} from '../lib/supabaseAdmin.js'

const DEFAULT_FROM = 'DebtVision <noreply@debtvision.app>'
const MAX_RETRIES = 3
const RETRY_BASE_MS = 800

const BRAND = {
  bg: '#020617',
  card: '#0f172a',
  border: '#1e293b',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  button: '#0d9488',
  buttonHover: '#14b8a6',
}

let resendClient = null

function log(level, message, meta = {}) {
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  console[level](`[resend-email] ${message}${payload}`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    const err = new Error('RESEND_API_KEY non configurata sul server.')
    err.code = 'MISSING_RESEND_KEY'
    throw err
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

function getFromAddress() {
  const from = process.env.EMAIL_FROM || 'noreply@debtvision.app'
  return from.includes('<') ? from : `DebtVision <${from}>`
}

function isRateLimitError(error) {
  const status = error?.statusCode ?? error?.status
  return status === 429 || String(error?.message ?? '').toLowerCase().includes('rate limit')
}

function isRetryableError(error) {
  if (isRateLimitError(error)) return true
  const status = error?.statusCode ?? error?.status
  return !status || status >= 500
}

async function sendWithRetry(sendFn) {
  let lastError = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await sendFn()
    } catch (error) {
      lastError = error
      log('warn', `Tentativo ${attempt}/${MAX_RETRIES} fallito`, {
        message: error.message,
        code: error.code,
      })

      if (!isRetryableError(error) || attempt === MAX_RETRIES) {
        break
      }

      const delay = RETRY_BASE_MS * 2 ** (attempt - 1)
      await sleep(isRateLimitError(error) ? delay * 2 : delay)
    }
  }

  throw lastError
}

function buildDebtVisionEmailHtml({
  preheader,
  title,
  intro,
  ctaLabel,
  ctaUrl,
  footerNote,
}) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 20px;text-align:center;border-bottom:1px solid ${BRAND.border};">
              <div style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:12px;background:rgba(20,184,166,0.12);color:${BRAND.accent};font-weight:700;font-size:15px;border:1px solid rgba(20,184,166,0.25);">DV</div>
              <p style="margin:14px 0 0;color:${BRAND.text};font-size:18px;font-weight:600;">DebtVision</p>
              <p style="margin:4px 0 0;color:${BRAND.muted};font-size:12px;">Gestione debiti e cashflow personale</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;color:${BRAND.text};font-size:22px;font-weight:600;line-height:1.35;">${title}</h1>
              <p style="margin:0 0 24px;color:${BRAND.muted};font-size:15px;line-height:1.6;">${intro}</p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:10px;background-color:${BRAND.button};">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:13px 24px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:${BRAND.muted};font-size:12px;line-height:1.6;">
                Se il pulsante non funziona, copia e incolla questo link nel browser:<br />
                <a href="${ctaUrl}" style="color:${BRAND.accent};word-break:break-all;">${ctaUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;">${footerNote}</p>
              <p style="margin:12px 0 0;color:${BRAND.muted};font-size:11px;line-height:1.5;">
                Supporto: <a href="mailto:support@debtvision.app" style="color:${BRAND.accent};text-decoration:none;">support@debtvision.app</a><br />
                © ${new Date().getFullYear()} DebtVision — debtvision.app
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function dispatchEmail({ to, subject, html, tags }) {
  const resend = getResendClient()
  const from = getFromAddress()

  const result = await sendWithRetry(async () => {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      tags,
    })

    if (error) {
      const err = new Error(error.message || 'Invio email Resend fallito.')
      err.statusCode = error.statusCode
      throw err
    }

    return data
  })

  log('info', 'Email inviata', { to, subject, id: result?.id })
  return result
}

export async function sendVerificationEmail({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email e password richieste per la verifica.')
    err.code = 'INVALID_INPUT'
    throw err
  }

  const actionLink = await generateVerificationLink(email, password)

  const html = buildDebtVisionEmailHtml({
    preheader: 'Conferma il tuo account DebtVision',
    title: 'Conferma il tuo account',
    intro:
      'Grazie per esserti registrato su DebtVision. Conferma la tua email per attivare l\'account e iniziare a sincronizzare i tuoi dati finanziari in cloud in modo sicuro.',
    ctaLabel: 'Conferma email',
    ctaUrl: actionLink,
    footerNote:
      'Se non hai creato un account DebtVision, puoi ignorare questa email. Il link di conferma scade automaticamente per motivi di sicurezza.',
  })

  return dispatchEmail({
    to: email,
    subject: 'Conferma il tuo account DebtVision',
    html,
    tags: [{ name: 'category', value: 'verification' }],
  })
}

export async function registerAndSendVerificationEmail({ email, password }) {
  await createUnconfirmedUser(email, password)
  return sendVerificationEmail({ email, password })
}

export async function sendPasswordResetEmail({ email }) {
  if (!email) {
    const err = new Error('Email richiesta per il reset password.')
    err.code = 'INVALID_INPUT'
    throw err
  }

  try {
    const actionLink = await generatePasswordResetLink(email)

    const html = buildDebtVisionEmailHtml({
      preheader: 'Reimposta la password del tuo account DebtVision',
      title: 'Reimposta password',
      intro:
        'Hai richiesto il reset della password del tuo account DebtVision. Clicca il pulsante qui sotto per impostare una nuova password. Se non hai richiesto questa operazione, ignora questa email.',
      ctaLabel: 'Reimposta password',
      ctaUrl: actionLink,
      footerNote:
        'Per sicurezza il link di reset ha validità limitata e può essere utilizzato una sola volta.',
    })

    return dispatchEmail({
      to: email,
      subject: 'Reimposta la password DebtVision',
      html,
      tags: [{ name: 'category', value: 'password_reset' }],
    })
  } catch (error) {
    log('error', 'Invio reset via Resend fallito, tentativo fallback Supabase', {
      email,
      message: error.message,
    })

    if (error.code === 'MISSING_RESEND_KEY') {
      await fallbackSupabasePasswordReset(email)
      log('warn', 'Fallback Supabase password reset inviato', { email })
      return { fallback: 'supabase' }
    }

    if (isRetryableError(error)) {
      try {
        await fallbackSupabasePasswordReset(email)
        log('warn', 'Fallback Supabase password reset inviato dopo errore Resend', { email })
        return { fallback: 'supabase' }
      } catch (fallbackError) {
        log('error', 'Fallback Supabase fallito', { message: fallbackError.message })
      }
    }

    throw error
  }
}

export function isResendConfigured() {
  const apiKey = process.env.RESEND_API_KEY
  return Boolean(apiKey && apiKey !== 'your_resend_api_key_here')
}
