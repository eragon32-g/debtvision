// Client API auth (server) — registrazione e email senza chiavi nel frontend.

const REGISTER_URL = '/api/auth/register'
const RESET_URL = '/api/auth/send-password-reset-email'
const REQUEST_TIMEOUT_MS = 25_000

export class AuthEmailError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message)
    this.name = 'AuthEmailError'
    this.code = code
  }
}

async function postAuthApi(url, body) {
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
        (response.status === 409
          ? 'Questa email è già registrata.'
          : response.status === 429
            ? 'Troppe richieste. Riprova tra qualche minuto.'
            : response.status === 503
              ? 'Servizio di registrazione temporaneamente non disponibile.'
              : 'Errore durante la registrazione.')
      throw new AuthEmailError(message, payload?.code ?? `HTTP_${response.status}`)
    }

    return payload
  } catch (err) {
    if (err instanceof AuthEmailError) throw err
    if (err.name === 'AbortError') {
      throw new AuthEmailError('Timeout della richiesta. Riprova.', 'TIMEOUT')
    }
    throw new AuthEmailError(
      'Impossibile contattare il server. Avvia il server con npm run dev.',
      'NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

export function requestRegister(email, password) {
  return postAuthApi(REGISTER_URL, { email, password })
}

export function requestPasswordResetEmail(email) {
  return postAuthApi(RESET_URL, { email })
}
