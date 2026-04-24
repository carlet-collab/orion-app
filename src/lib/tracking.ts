import { supabase } from './supabase'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

let cachedSessionId: string | null = null

export async function getSessionId(): Promise<string> {
  if (cachedSessionId) return cachedSessionId
  try {
    let sid = await SecureStore.getItemAsync('orion_session_id')
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now()
      await SecureStore.setItemAsync('orion_session_id', sid)
    }
    cachedSessionId = sid
    return sid
  } catch {
    cachedSessionId = 'sess_' + Math.random().toString(36).substr(2, 16)
    return cachedSessionId
  }
}

export async function track(event: string, props: Record<string, any> = {}) {
  try {
    const session_id = await getSessionId()
    await supabase.from('orion_events').insert({
      session_id, event, platform: Platform.OS, app_version: '1.0.0', ...props,
    })
  } catch (e) {}
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
    const session_id = await getSessionId()
    const { error } = await supabase.from('user_routes').insert({
      session_id, ...params, saved_at: new Date().toISOString(),
    })
    return !error
  } catch { return false }
}
