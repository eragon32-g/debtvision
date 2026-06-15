// Utility per il flusso Auth callback (Fase 13.1) — solo conferma email.

export function getAuthCallbackRedirectUrl() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/auth/callback`
}

export function hasAuthCallbackParams() {
  if (typeof window === 'undefined') return false

  const hash = window.location.hash
  const search = window.location.search

  return (
    hash.includes('access_token') ||
    hash.includes('error') ||
    hash.includes('type=') ||
    search.includes('code=') ||
    search.includes('error=') ||
    search.includes('error_description=')
  )
}

function decodeParam(value) {
  if (!value) return ''
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

export function parseAuthUrlError() {
  if (typeof window === 'undefined') return null

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(window.location.search)

  const error =
    hashParams.get('error') ||
    queryParams.get('error') ||
    hashParams.get('error_code') ||
    queryParams.get('error_code')

  const description =
    hashParams.get('error_description') ||
    queryParams.get('error_description') ||
    hashParams.get('message') ||
    queryParams.get('message')

  if (!error && !description) return null

  return mapAuthErrorMessage(error, description)
}

export function mapAuthErrorMessage(errorCode, description = '') {
  const code = String(errorCode ?? '').toLowerCase()
  const desc = decodeParam(description).toLowerCase()

  if (code.includes('otp_expired') || desc.includes('expired') || desc.includes('scadut')) {
    return 'Il link di conferma è scaduto. Registrati di nuovo o richiedi una nuova email di conferma.'
  }

  if (
    code.includes('already') ||
    desc.includes('already been used') ||
    desc.includes('already confirmed') ||
    desc.includes('già utilizzat')
  ) {
    return 'Questo link di conferma è già stato utilizzato. Puoi accedere con le tue credenziali.'
  }

  if (
    code.includes('invalid') ||
    desc.includes('invalid') ||
    desc.includes('not valid') ||
    desc.includes('non valido')
  ) {
    return 'Token di conferma non valido. Richiedi un nuovo link dalla pagina di registrazione.'
  }

  if (code === 'access_denied') {
    return 'Conferma email non riuscita. Il link potrebbe essere scaduto o già utilizzato.'
  }

  if (description) {
    return decodeParam(description)
  }

  return 'Si è verificato un errore durante la conferma email. Riprova o torna al login.'
}

export function mapSupabaseAuthError(error) {
  if (!error) {
    return 'Impossibile completare la conferma. Nessuna sessione disponibile.'
  }

  const message = error.message ?? ''
  const code = error.code ?? ''

  if (message.toLowerCase().includes('expired') || code.includes('otp_expired')) {
    return 'Il link di conferma è scaduto. Registrati di nuovo o richiedi una nuova email.'
  }

  if (message.toLowerCase().includes('already') || code.includes('flow_state')) {
    return 'Conferma già utilizzata o link non più valido. Prova ad accedere.'
  }

  if (message.toLowerCase().includes('invalid') || code.includes('validation')) {
    return 'Token non valido. Richiedi un nuovo link di conferma.'
  }

  return mapAuthErrorMessage(code, message)
}
