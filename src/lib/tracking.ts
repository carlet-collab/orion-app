import { supabase } from './supabase'
import { Platform } from 'react-native'

// Simple in-memory session ID — no AsyncStorage, no native modules
let sessionId: string | null = null

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now()
  }
  return sessionId
}

export async function track(event: string, props: Record<string, any> = {}) {
  try {
    const session_id = getSessionId()
    await supabase.from('orion_events').insert({
      session_id,
      event,
      platform: Platform.OS,
      app_version: '1.0.0',
      ...props,
    })
  } catch (e) {
    // Silent fail — never crash the app for analytics
  }
}

export async function saveRoute(params: {
  origin: string
  destination: string
  distance_text: string
  duration_text: string
  total_m: number
  plan_by_day: boolean
  limit_type: string
  limit_value: number
}) {
  try {
    const session_id = getSessionId()
    const { error } = await supabase.from('user_routes').insert({
      session_id,
      ...params,
      saved_at: new Date().toISOString(),
    })
    return !error
  } catch {
    return false
  }
}
