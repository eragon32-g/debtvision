// Client Supabase Admin (server only) — genera link auth senza inviare email Supabase.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient = null

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    const err = new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY richiesti sul server.')
    err.code = 'MISSING_SUPABASE_ADMIN'
    throw err
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}

export function getAppOrigin() {
  return (
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    'https://debtvision.app'
  ).replace(/\/$/, '')
}

export function getAuthCallbackUrl() {
  return `${getAppOrigin()}/auth/callback`
}

function normalizeAdminAuthError(error) {
  const message = String(error?.message ?? '')
  const code = String(error?.code ?? error?.status ?? '')
  const lower = message.toLowerCase()

  if (
    code === 'email_exists' ||
    lower.includes('already been registered') ||
    lower.includes('already registered')
  ) {
    const err = new Error('Questa email è già registrata. Accedi o recupera la password.')
    err.code = 'EMAIL_ALREADY_REGISTERED'
    return err
  }

  if (
    lower.includes('password') &&
    (lower.includes('weak') || lower.includes('least') || lower.includes('short'))
  ) {
    const err = new Error('Password troppo debole. Usa almeno 6 caratteri.')
    err.code = 'WEAK_PASSWORD'
    return err
  }

  if (lower.includes('invalid email')) {
    const err = new Error('Indirizzo email non valido.')
    err.code = 'INVALID_EMAIL'
    return err
  }

  const err = new Error(message || 'Errore Supabase Admin.')
  err.code = code || 'SUPABASE_ADMIN_ERROR'
  return err
}

export async function createUnconfirmedUser(email, password) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  })

  if (error) {
    throw normalizeAdminAuthError(error)
  }

  return data.user
}

export async function generateVerificationLink(email, password) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      redirectTo: getAuthCallbackUrl(),
    },
  })

  if (error) {
    throw normalizeAdminAuthError(error)
  }

  const actionLink = data?.properties?.action_link
  if (!actionLink) {
    const err = new Error('Link di verifica non generato da Supabase.')
    err.code = 'LINK_GENERATION_FAILED'
    throw err
  }

  return actionLink
}

export async function generatePasswordResetLink(email) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: getAuthCallbackUrl(),
    },
  })

  if (error) throw error

  const actionLink = data?.properties?.action_link
  if (!actionLink) {
    throw new Error('Link di reset password non generato da Supabase.')
  }

  return actionLink
}

// Fallback: invio email standard Supabase se Resend non disponibile.
export async function fallbackSupabasePasswordReset(email) {
  const admin = getSupabaseAdmin()
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl(),
  })
  if (error) throw error
  return true
}
