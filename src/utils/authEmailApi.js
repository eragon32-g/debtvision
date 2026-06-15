// Client API email auth (server Resend) — nessuna chiave Resend nel frontend.

const VERIFY_URL = '/api/auth/send-verification-email'
const RESET_URL = '/api/auth/send-password-reset-email'
const REQUEST_TIMEOUT_MS = 20_000

export class AuthEmailError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message)
    this.name = 'AuthEmailError'
    this.code = code
  }
}

async function postAuthEmail(url, body) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      const message =
        payload?.error ||
        (response.status === 429
          ? 'Troppe richieste email. Riprova tra qualche minuto.'
          : response.status === 503
            ? 'Servizio email temporaneamente non disponibile.'
            : 'Errore durante l\'invio email.')
      throw new AuthEmailError(message, payload?.code ?? `HTTP_${response.status}`)
    }

    return payload
  } catch (err) {
    if (err instanceof AuthEmailError) throw err
    if (err.name === 'AbortError') {
      throw new AuthEmailError('Timeout invio email. Riprova.', 'TIMEOUT')
    }
    throw new AuthEmailError(
      'Impossibile contattare il server email. Avvia il server con npm run dev.',
      'NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

export function requestVerificationEmail(email, password) {
  return postAuthEmail(VERIFY_URL, { email, password })
}

export function requestPasswordResetEmail(email) {
  return postAuthEmail(RESET_URL, { email })
}
