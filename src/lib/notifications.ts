import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from './supabase'
import { getSessionId } from './tracking'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return null

    const token = (await Notifications.getExpoPushTokenAsync()).data

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      })
    }

    // Save token to Supabase
    const session_id = getSessionId()
    await supabase.from('orion_events').insert({
      session_id,
      event: 'push_token_registered',
      platform: Platform.OS,
      app_version: '1.0.0',
      place_name: token, // reusing field to store token
    })

    return token
  } catch (e) {
    console.error('Push notification error:', e)
    return null
  }
}

export async function scheduleLocalNotification(title: string, body: string, seconds: number = 1) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds },
  })
}
