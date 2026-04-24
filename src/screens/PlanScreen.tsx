import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native'
import { GOOGLE_MAPS_KEY } from '../lib/maps'
import AutocompleteInput from '../components/AutocompleteInput'
import * as Location from 'expo-location'

const C = { primary: '#1A1A1A', accent: '#7BA7BC', bg: '#FAFAFA', surface: '#FFFFFF', border: '#E8E8E8', hint: '#AEAEB2', secondary: '#6E6E73' }

const ROUTE_TYPES = [
  { key: 'fastest', label: '⚡ Fastest', avoid: '' },
  { key: 'notolls', label: '💰 No Tolls', avoid: 'tolls' },
  { key: 'scenic', label: '🌿 Scenic', avoid: 'highways' },
]

export default function PlanScreen({ navigation }: any) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [planByDay, setPlanByDay] = useState(false)
  const [limitType, setLimitType] = useState<'days'|'hours'|'km'>('days')
  const [limitValue, setLimitValue] = useState(2)
  const [routeType, setRouteType] = useState('fastest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { setError('Location permission needed'); return }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.coords.latitude},${loc.coords.longitude}&key=${GOOGLE_MAPS_KEY}`)
    const data = await res.json()
    if (data.results?.[0]) setOrigin(data.results[0].formatted_address)
  }

  const handleSearch = async () => {
    if (!origin || !destination) { setError('Please enter both locations'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(origin)}&key=${GOOGLE_MAPS_KEY}`)
      const data = await res.json()
      if (data.status !== 'OK') { setError('Could not find origin. Try being more specific.'); setLoading(false); return }
      const avoid = ROUTE_TYPES.find(r => r.key === routeType)?.avoid || ''
      navigation.navigate('Route', { origin, destination, planByDay, limitType, limitValue, avoid })
    } catch (e) { setError('Something went wrong.') }
    setLoading(false)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" style={{ overflow: 'visible' }}>

          <View style={s.header}>
            <View style={s.logoRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[s.dot, { width: 8, height: 8 }]} />
                <View style={[s.dot, { width: 13, height: 13 }]} />
                <View style={[s.dot, { width: 8, height: 8 }]} />
              </View>
              <Text style={s.logoTxt}>ORION</Text>
            </View>
            <Text style={s.tagline}>Your journey. Discovered.</Text>
          </View>

          <Text style={s.title}>Discover what lies{'\n'}<Text style={{ fontWeight: '900' }}>along your journey</Text></Text>
          <Text style={s.subtitle}>Hotels, restaurants, attractions and tours — curated along your exact route.</Text>

          <View style={s.card}>
            {/* FROM */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[s.label, { marginBottom: 0 }]}>FROM</Text>
              <TouchableOpacity onPress={getMyLocation} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F7FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#7BA7BC30' }}>
                <Text style={{ fontSize: 11 }}>📍</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#7BA7BC' }}>Use my location</Text>
              </TouchableOpacity>
            </View>
            <AutocompleteInput value={origin} onChangeText={setOrigin} onSelect={setOrigin} placeholder="Prague, Czech Republic" mode="local" />

            {/* TO */}
            <Text style={[s.label, { marginTop: 16 }]}>TO</Text>
            <AutocompleteInput value={destination} onChangeText={setDestination} onSelect={setDestination} placeholder="Madrid, Spain" mode="city" />

            {/* Route type */}
            <Text style={[s.label, { marginTop: 16 }]}>ROUTE TYPE</Text>
            <View style={s.routeTypeRow}>
              {ROUTE_TYPES.map(rt => (
                <TouchableOpacity
                  key={rt.key}
                  onPress={() => setRouteType(rt.key)}
                  style={[s.routeTypeBtn, {
                    backgroundColor: routeType === rt.key ? C.primary : C.surface,
                    borderColor: routeType === rt.key ? C.primary : C.border,
                  }]}
                >
                  <Text style={[s.routeTypeTxt, { color: routeType === rt.key ? '#fff' : C.secondary }]}>
                    {rt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Plan by day */}
            <View style={s.toggle}>
              <View>
                <Text style={s.toggleTitle}>Plan by day</Text>
                <Text style={s.toggleSub}>Split into daily stages</Text>
              </View>
              <TouchableOpacity onPress={() => setPlanByDay(v => !v)} style={[s.toggleBtn, { backgroundColor: planByDay ? C.accent : C.border }]}>
                <View style={[s.toggleThumb, { left: planByDay ? 22 : 2 }]} />
              </TouchableOpacity>
            </View>

            {planByDay && (
              <View style={s.limitRow}>
                <View style={s.limitTypes}>
                  {(['days', 'hours', 'km'] as const).map(t => (
                    <TouchableOpacity key={t} onPress={() => { setLimitType(t); setLimitValue(t === 'days' ? 2 : t === 'hours' ? 8 : 500) }}
                      style={[s.limitTypeBtn, { backgroundColor: limitType === t ? C.accent : 'transparent' }]}>
                      <Text style={[s.limitTypeTxt2, { color: limitType === t ? '#fff' : C.secondary }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.limitVal}>
                  <TouchableOpacity onPress={() => setLimitValue(v => Math.max(1, v - 1))} style={s.limitBtn}><Text style={s.limitBtnTxt}>−</Text></TouchableOpacity>
                  <Text style={s.limitValTxt}>{limitValue} {limitType}</Text>
                  <TouchableOpacity onPress={() => setLimitValue(v => v + 1)} style={s.limitBtn}><Text style={s.limitBtnTxt}>+</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {!!error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity onPress={handleSearch} disabled={loading} style={[s.searchBtn, { opacity: loading ? 0.5 : 1 }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.searchBtnTxt}>DISCOVER THE ROUTE</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('MyRoutes')} style={s.myRoutesBtn}>
              <Text style={s.myRoutesBtnTxt}>🗺 My saved routes</Text>
            </TouchableOpacity>
          </View>

          <View style={s.icons}>
            {[['🏨', 'Hotels', '#7BA7BC'], ['🍽️', 'Dining', '#8BAF8B'], ['🎭', 'Sights', '#9B8BB4'], ['🎯', 'Tours', '#7BBCB0']].map(([icon, label, color]) => (
              <View key={label} style={s.iconItem}>
                <View style={[s.iconBox, { backgroundColor: color + '20', borderColor: color + '50' }]}><Text style={{ fontSize: 22 }}>{icon}</Text></View>
                <Text style={s.iconLabel}>{label}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  content: { padding: 24, paddingTop: 20, paddingBottom: 40 },
  header: { marginBottom: 28 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  dot: { borderRadius: 50, backgroundColor: '#1A1A1A' },
  logoTxt: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', letterSpacing: 6 },
  tagline: { fontSize: 11, color: '#AEAEB2', fontStyle: 'italic', marginLeft: 36 },
  title: { fontSize: 30, fontWeight: '300', color: '#1A1A1A', lineHeight: 38, marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#6E6E73', lineHeight: 22, marginBottom: 28 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 28, zIndex: 100, overflow: 'visible' },
  label: { fontSize: 10, fontWeight: '600', color: '#AEAEB2', letterSpacing: 2, marginBottom: 8 },
  routeTypeRow: { flexDirection: 'row', gap: 8 },
  routeTypeBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  routeTypeTxt: { fontSize: 11, fontWeight: '600' },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F7', borderRadius: 12, padding: 14, marginTop: 16 },
  toggleTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  toggleSub: { fontSize: 11, color: '#AEAEB2', marginTop: 2 },
  toggleBtn: { width: 44, height: 24, borderRadius: 12, position: 'relative' },
  toggleThumb: { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  limitTypes: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: '#E8E8E8', overflow: 'hidden' },
  limitTypeBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  limitTypeTxt2: { fontSize: 11, fontWeight: '600' },
  limitVal: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F7', borderRadius: 8, paddingHorizontal: 4 },
  limitBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  limitBtnTxt: { fontSize: 22, color: '#1A1A1A' },
  limitValTxt: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  error: { color: '#C97B7B', fontSize: 12, marginTop: 12 },
  searchBtn: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  searchBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  myRoutesBtn: { borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  myRoutesBtnTxt: { color: '#6E6E73', fontSize: 12, fontWeight: '600' },
  icons: { flexDirection: 'row', justifyContent: 'space-around' },
  iconItem: { alignItems: 'center', gap: 8 },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconLabel: { fontSize: 11, color: '#AEAEB2', fontWeight: '500' },
})
