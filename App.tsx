import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import HomeScreen from './src/screens/HomeScreen'
import PlanScreen from './src/screens/PlanScreen'
import RouteScreen from './src/screens/RouteScreen'
import MyRoutesScreen from './src/screens/MyRoutesScreen'
import DiscoverScreen from './src/screens/DiscoverScreen'

const Stack = createNativeStackNavigator()

function GDPRConsent({ onAccept }: { onAccept: () => void }) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Logo */}
          <View style={s.logoRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#1A1A1A' }} />
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: '#1A1A1A' }} />
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#1A1A1A' }} />
            </View>
            <Text style={s.logoTxt}>ORION</Text>
          </View>

          <Text style={s.title}>Welcome to Orion</Text>
          <Text style={s.subtitle}>Your road trip discovery app</Text>

          <View style={s.divider} />

          <Text style={s.bodyTitle}>Before you start</Text>
          <Text style={s.body}>
            Orion collects anonymous usage data to improve your experience — which routes you plan, which filters you use, which places you tap.
          </Text>
          <Text style={s.body}>
            No personal data is collected unless you choose to sign in. You can delete your data at any time from My Routes.
          </Text>

          <View style={s.items}>
            {[
              { icon: '🔒', text: 'Anonymous by default — no account needed' },
              { icon: '📍', text: 'Location used only during active navigation' },
              { icon: '🗑', text: 'Delete your data anytime from My Routes' },
              { icon: '🚫', text: 'We never sell your data to third parties' },
            ].map((item, i) => (
              <View key={i} style={s.itemRow}>
                <Text style={s.itemIcon}>{item.icon}</Text>
                <Text style={s.itemTxt}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={onAccept} style={s.acceptBtn}>
            <Text style={s.acceptTxt}>GOT IT — LET'S GO</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL('https://oriontravel.app/privacy')}>
            <Text style={s.privacyLink}>Read our Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default function App() {
  const [showConsent, setShowConsent] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    checkConsent()
  }, [])

  const checkConsent = async () => {
    try {
      const accepted = await AsyncStorage.getItem('orion_gdpr_accepted')
      if (!accepted) setShowConsent(true)
    } catch (e) {
      // If AsyncStorage fails, just show the app
    }
    setReady(true)
  }

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem('orion_gdpr_accepted', '1')
    } catch (e) {}
    setShowConsent(false)
  }

  if (!ready) return null

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {showConsent && <GDPRConsent onAccept={handleAccept} />}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Plan" component={PlanScreen} />
        <Stack.Screen name="Route" component={RouteScreen} />
        <Stack.Screen name="MyRoutes" component={MyRoutesScreen} />
        <Stack.Screen name="Discover" component={DiscoverScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  logoTxt: { fontSize: 14, fontWeight: '900', color: '#1A1A1A', letterSpacing: 6 },
  title: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6E6E73', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginBottom: 20 },
  bodyTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  body: { fontSize: 12, color: '#6E6E73', lineHeight: 18, marginBottom: 10 },
  items: { backgroundColor: '#F5F5F7', borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 20, gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemIcon: { fontSize: 16, flexShrink: 0 },
  itemTxt: { fontSize: 12, color: '#1A1A1A', flex: 1, lineHeight: 17 },
  acceptBtn: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  acceptTxt: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  privacyLink: { fontSize: 12, color: '#7BA7BC', textAlign: 'center', textDecorationLine: 'underline' },
})
