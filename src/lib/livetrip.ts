import { supabase } from './supabase'
import { getSessionId } from './tracking'

// Generate short trip code like ABC123
export function generateTripCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Create or update live trip position
export async function updateLivePosition(
  tripCode: string,
  origin: string,
  destination: string,
  lat: number,
  lng: number,
  heading: number
) {
  try {
    const session_id = getSessionId()
    await supabase.from('live_trips').upsert({
      trip_code: tripCode,
      session_id,
      origin,
      destination,
      lat,
      lng,
      heading,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'trip_code' })
  } catch (e) {
    // Silent fail
  }
}

// Delete live trip when navigation stops
export async function deleteLiveTrip(tripCode: string) {
  try {
    await supabase.from('live_trips').delete().eq('trip_code', tripCode)
  } catch (e) {}
}
