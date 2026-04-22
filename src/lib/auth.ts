import { supabase } from './supabase'
import { track, getSessionId } from './tracking'

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'com.carlet.orionapp://auth/callback',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function signInWithApple() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: 'com.carlet.orionapp://auth/callback' },
    })
    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function saveUserProfile(user: any, consentMarketing: boolean) {
  try {
    const session_id = await getSessionId()
    await supabase.from('orion_users').upsert({
      session_id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      provider: user.app_metadata?.provider || 'google',
      consent_marketing: consentMarketing,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'email' })
    track('user_signed_in', { provider: user.app_metadata?.provider })
  } catch (e) {
    console.error(e)
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
}
