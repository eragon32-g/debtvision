import { supabase } from '../lib/supabase.js'
import { normalizeFinancialData } from './financialStorage.js'

const IMPORT_STATUS_PREFIX = 'debtvision_cloud_import_'

export function getImportStatusKey(userId) {
  return `${IMPORT_STATUS_PREFIX}${userId}`
}

export function getImportStatus(userId) {
  if (typeof window === 'undefined' || !userId) return null
  try {
    return window.localStorage.getItem(getImportStatusKey(userId))
  } catch {
    return null
  }
}

export function setImportStatus(userId, status) {
  if (typeof window === 'undefined' || !userId) return
  try {
    window.localStorage.setItem(getImportStatusKey(userId), status)
  } catch {
    // ignora
  }
}

export async function fetchFinancialProfile(userId) {
  const { data, error } = await supabase
    .from('financial_profiles')
    .select('id, user_id, financial_data, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertFinancialProfile(userId, profileId, financialData) {
  const normalized = normalizeFinancialData(financialData)
  const payload = {
    user_id: userId,
    financial_data: normalized,
    updated_at: new Date().toISOString(),
  }

  if (profileId) {
    payload.id = profileId
  }

  const { data, error } = await supabase
    .from('financial_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('id, financial_data, updated_at')
    .single()

  if (error) throw error
  return data
}

export async function createFinancialProfile(userId, financialData) {
  return upsertFinancialProfile(userId, null, financialData)
}
