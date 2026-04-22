import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// Get or create anonymous session ID — persists across app opens, GDPR safe
export async function getSessionId(): Promise<string> {
  try {
    let sid = await AsyncStorage.getItem('orion_session_id')
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now()
      await AsyncStorage.setItem('orion_session_id', sid)
    }
    return sid
  } catch {
    return 'sess_' + Math.random().toString(36).substr(2, 16)
  }
}

// Track any event — fire and forget, never blocks UI
export async function track(event: string, props: Record<string, any> = {}) {
  try {
    const session_id = await getSessionId()
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

// Save a route
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
      session_id,
      ...params,
      saved_at: new Date().toISOString(),
    })
    return !error
  } catch {
    return false
  }
}
