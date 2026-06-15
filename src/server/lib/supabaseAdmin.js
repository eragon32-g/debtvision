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

  if (error) throw error

  const actionLink = data?.properties?.action_link
  if (!actionLink) {
    throw new Error('Link di verifica non generato da Supabase.')
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
