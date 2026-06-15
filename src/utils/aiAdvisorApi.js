// Client API AI Advisor (Fase 12) — nessuna chiave OpenAI nel frontend.

const API_URL = '/api/analyze-finance'
const REQUEST_TIMEOUT_MS = 100_000

export async function requestAiFinancialAnalysis(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new AiAdvisorError('Snapshot non valido.', 'INVALID_SNAPSHOT')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot }),
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
        (response.status === 503
          ? 'Servizio AI non configurato sul server.'
          : response.status === 504
            ? 'Timeout della richiesta AI.'
            : 'Errore durante l\'analisi AI.')
      throw new AiAdvisorError(message, payload?.code ?? `HTTP_${response.status}`)
    }

    if (!payload || typeof payload.summary !== 'string') {
      throw new AiAdvisorError('Risposta AI non valida.', 'INVALID_RESPONSE')
    }

    return payload
  } catch (err) {
    if (err instanceof AiAdvisorError) throw err
    if (err.name === 'AbortError') {
      throw new AiAdvisorError('Timeout della richiesta. Riprova.', 'TIMEOUT')
    }
    throw new AiAdvisorError(
      'Impossibile contattare il server API. Avvia il server con npm run dev.',
      'NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

export class AiAdvisorError extends Error {
  constructor(message, code = 'UNKNOWN') {
    super(message)
    this.name = 'AiAdvisorError'
    this.code = code
  }
}
