import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, ActivityIndicator, Dimensions, SafeAreaView, Alert } from 'react-native'
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import * as Speech from 'expo-speech'
import { useKeepAwake } from 'expo-keep-awake'
import { getDirectionsUrl, getPlacesUrl, haversine, decodePolyline, stripHtml, FILTERS } from '../lib/maps'
import { track, saveRoute } from '../lib/tracking'
import { registerForPushNotifications } from '../lib/notifications'
import RatingModal from '../components/RatingModal'
import ShareCard from '../components/ShareCard'

const C = { primary: '#1A1A1A', accent: '#7BA7BC', bg: '#FAFAFA', surface: '#FFFFFF', border: '#E8E8E8', hint: '#AEAEB2', secondary: '#6E6E73' }
const { width: W } = Dimensions.get('window')
const DAY_COLORS = ['#7BA7BC','#8BAF8B','#9B8BB4','#7BBCB0','#C4A882','#BC7B7B']

function closestPolylineIndex(coords: any[], lat: number, lng: number): number {
  let minDist = Infinity, minIdx = 0
  coords.forEach((c, i) => {
    const d = haversine(lat, lng, c.latitude, c.longitude)
    if (d < minDist) { minDist = d; minIdx = i }
  })
  return minIdx
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function formatAddress(vicinity: string): string {
  if (!vicinity) return ''
  // Fix Plus codes like 9VF+FW — return empty so we dont show them
  if (/^[0-9A-Z]{4}\+[0-9A-Z]{2,}/.test(vicinity)) return ''
  return vicinity
}

export default function RouteScreen({ route, navigation }: any) {
  const { origin, destination, planByDay, limitType, limitValue, avoid = '' } = route.params
  useKeepAwake()

  const mapRef = useRef<MapView>(null)
  const locationSubRef = useRef<any>(null)

  // ALL navigation state in refs — never stale in callbacks
  const navigatingRef = useRef(false)
  const voiceEnabledRef = useRef(true)
  const currentStepRef = useRef(0)
  const lastFetchRef = useRef<{latitude: number, longitude: number} | null>(null)
  const lastRerouteRef = useRef<number>(0)
  const lastSpokenStepRef = useRef(-1)
  const lastVoiceTimeRef = useRef<number>(0)
  const polylineRef = useRef<any[]>([])
  const stepsRef = useRef<any[]>([])
  const routeInfoRef = useRef<any>(null)
  const destinationRef = useRef(destination)
  const activeFilterRef = useRef('lodging')
  const drivenIdxRef = useRef(0)
  const totalSecondsRef = useRef(0)
  const userLatRef = useRef(0)
  const userLngRef = useRef(0)

  // React state for UI
  const [routeInfo, setRouteInfo] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [polyline, setPolyline] = useState<any[]>([])
  const [drivenPolyline, setDrivenPolyline] = useState<any[]>([])
  const [remainingPolyline, setRemainingPolyline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rerouting, setRerouting] = useState(false)
  const [places, setPlaces] = useState<any[]>([])
  const [placesLoading, setPlacesLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('lodging')
  const [activeDay, setActiveDay] = useState(0)
  const [navigating, setNavigating] = useState(false)
  const [userLocation, setUserLocation] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [remainingTime, setRemainingTime] = useState<string>('')
  const [detourDestination, setDetourDestination] = useState<any>(null)

  useEffect(() => { voiceEnabledRef.current = voiceEnabled }, [voiceEnabled])
  useEffect(() => { activeFilterRef.current = activeFilter }, [activeFilter])
  useEffect(() => { destinationRef.current = destination }, [destination])

  const currentSteps = planByDay && stages.length > 0 ? (stages[activeDay]?.steps || []) : steps
  const activeF = FILTERS.find(f => f.key === activeFilter)!

  useEffect(() => {
    fetchRoute(origin, destination, false)
    registerForPushNotifications()
  }, [])
  useEffect(() => { if (routeInfo) fetchPlaces(null) }, [activeFilter, activeDay, routeInfo])
  useEffect(() => { return () => { locationSubRef.current?.remove(); Speech.stop() } }, [])

  const getRadius = (info: any) => {
    if (!info) return 10000
    const km = info.totalM / 1000
    if (km < 20) return 2000
    if (km < 100) return 10000
    return 25000
  }

  const processRouteData = (data: any, isReroute: boolean) => {
    const leg = data.routes[0].legs[0]
    const coords = decodePolyline(data.routes[0].overview_polyline.points)

    // FIX 4: Clear old polyline completely on reroute
    polylineRef.current = coords
    setPolyline([...coords])
    setDrivenPolyline([])
    setRemainingPolyline([...coords])
    drivenIdxRef.current = 0

    const totalSec = leg.duration.value
    const totalM = leg.distance.value
    totalSecondsRef.current = totalSec

    const limitSec = limitType === 'days' ? totalSec / limitValue : limitType === 'hours' ? limitValue * 3600 : (limitValue / (totalM / 1000)) * totalSec
    const numDays = planByDay ? (limitType === 'days' ? limitValue : Math.ceil(totalSec / limitSec)) : 1

    const info = {
      distance: leg.distance.text,
      duration: leg.duration.text,
      totalSec,
      midLat: (leg.start_location.lat + leg.end_location.lat) / 2,
      midLng: (leg.start_location.lng + leg.end_location.lng) / 2,
      startLat: leg.start_location.lat, startLng: leg.start_location.lng,
      endLat: leg.end_location.lat, endLng: leg.end_location.lng,
      numDays, totalM
    }
    routeInfoRef.current = info
    if (!isReroute) {
      setRouteInfo(info)
      setRemainingTime(info.duration)
    } else {
      // FIX 3: Update remaining time on reroute
      setRemainingTime(formatDuration(totalSec))
    }

    const stepsWithCoords = leg.steps.map((s: any) => ({
      ...s,
      endLat: s.end_location.lat,
      endLng: s.end_location.lng,
      durationSec: s.duration.value,
    }))
    stepsRef.current = stepsWithCoords
    setSteps(stepsWithCoords)
    currentStepRef.current = 0
    setCurrentStep(0)
    lastSpokenStepRef.current = -1

    if (!isReroute && planByDay && numDays > 1) {
      const arr: any[] = []
      let acc = 0, start = { lat: leg.start_location.lat, lng: leg.start_location.lng }
      let daySteps: any[] = [], dist = 0, dur = 0
      for (let i = 0; i < stepsWithCoords.length; i++) {
        const st = stepsWithCoords[i]
        acc += st.duration.value; daySteps.push(st); dist += st.distance.value; dur += st.duration.value
        if (acc >= limitSec || i === stepsWithCoords.length - 1) {
          arr.push({ day: arr.length + 1, startLat: start.lat, startLng: start.lng, endLat: st.end_location.lat, endLng: st.end_location.lng, distance: (dist / 1000).toFixed(0) + ' km', duration: Math.floor(dur / 3600) + 'h ' + Math.floor((dur % 3600) / 60) + 'm', steps: daySteps })
          start = { lat: st.end_location.lat, lng: st.end_location.lng }
          daySteps = []; dist = 0; dur = 0; acc = 0
        }
      }
      setStages(arr)
    }
  }

  const fetchRoute = async (from: string, to: string, isReroute: boolean) => {
    if (!isReroute) setLoading(true)
    try {
      const res = await fetch(getDirectionsUrl(from, to, avoid))
      const data = await res.json()
      if (data.status === 'OK' && data.routes?.[0]) {
        processRouteData(data, isReroute)
      } else {
        if (!isReroute) setError('Could not get route.')
      }
    } catch (e) {
      if (!isReroute) setError('Something went wrong.')
    }
    if (!isReroute) setLoading(false)
  }

  const fetchPlaces = async (pos: { latitude: number, longitude: number } | null) => {
    const info = routeInfoRef.current || routeInfo
    if (!info) return
    setPlacesLoading(true)

    let center = { latitude: info.midLat, longitude: info.midLng }

    if (pos) {
      if (navigatingRef.current) {
        // During navigation — look 10km ahead on polyline
        const allCoords = polylineRef.current
        const currentIdx = drivenIdxRef.current
        let aheadDist = 0
        let aheadIdx = currentIdx
        for (let i = currentIdx; i < allCoords.length - 1; i++) {
          aheadDist += haversine(allCoords[i].latitude, allCoords[i].longitude, allCoords[i+1].latitude, allCoords[i+1].longitude)
          if (aheadDist > 10000) { aheadIdx = i; break }
        }
        center = {
          latitude: allCoords[aheadIdx]?.latitude || pos.latitude,
          longitude: allCoords[aheadIdx]?.longitude || pos.longitude
        }
      } else {
        // Before navigation — use actual user location
        center = { latitude: pos.latitude, longitude: pos.longitude }
      }
    }

    try {
      const res = await fetch(getPlacesUrl(center.latitude, center.longitude, activeFilterRef.current, getRadius(info)))
      const data = await res.json()
      const seen = new Set<string>()
      const ex: Record<string, string[]> = { restaurant: ['lodging', 'hotel', 'motel'], tourist_attraction: ['lodging', 'hotel', 'restaurant'], travel_agency: ['lodging', 'hotel', 'restaurant'], lodging: [] }
      const req: Record<string, string[]> = { restaurant: ['restaurant', 'food', 'cafe', 'bar'], tourist_attraction: ['tourist_attraction', 'museum', 'church', 'park', 'art_gallery'], travel_agency: ['travel_agency', 'tour_operator'], lodging: ['lodging'] }

      const filtered = (data.results || []).filter((p: any) => {
        if (seen.has(p.place_id)) return false; seen.add(p.place_id)
        const t: string[] = p.types || []
        if ((ex[activeFilterRef.current] || []).some((e: string) => t.includes(e))) return false
        if ((req[activeFilterRef.current] || []).length > 0 && !(req[activeFilterRef.current] || []).some((r: string) => t.includes(r))) return false
        return true
      })

      // FIX 5b: Add distance from current position + sort by distance ahead
      const userLat = userLatRef.current || info.midLat
      const userLng = userLngRef.current || info.midLng
      const withDist = filtered.map((p: any) => {
        const dist = p.geometry?.location ? haversine(userLat, userLng, p.geometry.location.lat, p.geometry.location.lng) : 999999
        return { ...p, distanceM: Math.round(dist) }
      }).sort((a: any, b: any) => a.distanceM - b.distanceM)

      setPlaces(withDist.slice(0, 18))
    } catch (e) { console.error(e) }
    setPlacesLoading(false)
  }

  const speak = (text: string) => {
    if (!voiceEnabledRef.current) return
    // FIX 2: Debounce voice — don't speak if spoken in last 3 seconds
    const now = Date.now()
    if (now - lastVoiceTimeRef.current < 3000) return
    lastVoiceTimeRef.current = now
    Speech.stop()
    Speech.speak(text, { rate: 0.88, pitch: 1.0 })
  }

  const onLocation = useCallback((loc: Location.LocationObject) => {
    if (!navigatingRef.current) return
    const { latitude, longitude, heading } = loc.coords

    userLatRef.current = latitude
    userLngRef.current = longitude
    setUserLocation({ latitude, longitude, heading: heading || 0 })

    // Camera follow
    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude, longitude },
        heading: heading || 0,
        pitch: 50,
        zoom: 17
      }, { duration: 300 })
    }

    // FIX 1: Update driven + remaining polyline
    const allCoords = polylineRef.current
    if (allCoords.length > 0) {
      const closestIdx = closestPolylineIndex(allCoords, latitude, longitude)
      if (closestIdx > drivenIdxRef.current) {
        drivenIdxRef.current = closestIdx
        const driven = allCoords.slice(0, closestIdx + 1)
        const remaining = allCoords.slice(closestIdx)
        setDrivenPolyline(driven)
        setRemainingPolyline(remaining)

        // FIX 3: Update remaining time based on remaining steps
        const stps = stepsRef.current
        const stepIdx = currentStepRef.current
        let remSec = 0
        for (let i = stepIdx; i < stps.length; i++) {
          remSec += stps[i].durationSec || stps[i].duration?.value || 0
        }
        if (remSec > 0) setRemainingTime(formatDuration(remSec))
      }
    }

    // FIX 2: Auto-advance steps with proper voice timing
    const stps = stepsRef.current
    const stepIdx = currentStepRef.current
    if (stps[stepIdx]?.endLat && stps[stepIdx]?.endLng) {
      const distToEnd = haversine(latitude, longitude, stps[stepIdx].endLat, stps[stepIdx].endLng)
      // Speak upcoming step at 200m before turn
      if (distToEnd < 200 && distToEnd > 50 && stepIdx < stps.length - 1) {
        const next = stepIdx + 1
        if (lastSpokenStepRef.current !== next) {
          lastSpokenStepRef.current = next
          speak('In ' + formatDuration(stps[stepIdx].durationSec || 60) + ', ' + stripHtml(stps[next]?.html_instructions || ''))
        }
      }
      // Advance step at 30m
      if (distToEnd < 30 && stepIdx < stps.length - 1) {
        const next = stepIdx + 1
        currentStepRef.current = next
        setCurrentStep(next)
      }
    }

    // FIX 1: Rerouting — only trigger if well off route, longer cooldown
    const now = Date.now()
    if (now - lastRerouteRef.current > 20000 && allCoords.length > 0) {
      const closestIdx = closestPolylineIndex(allCoords, latitude, longitude)
      const distToRoute = haversine(latitude, longitude, allCoords[closestIdx].latitude, allCoords[closestIdx].longitude)
      if (distToRoute > 200) {
        lastRerouteRef.current = now
        setRerouting(true)
        speak('Recalculating.')
        fetchRoute(`${latitude},${longitude}`, destinationRef.current, true)
          .finally(() => setRerouting(false))
      }
    }

    // Refresh places every 3km ahead
    const last = lastFetchRef.current
    if (!last || haversine(latitude, longitude, last.latitude, last.longitude) > 3000) {
      lastFetchRef.current = { latitude, longitude }
      fetchPlaces({ latitude, longitude })
    }
  }, [])

  // FIX 6: Navigate to a place then continue on route
  const navigateToPlace = (place: any) => {
    if (!place.geometry?.location) return
    const placeName = place.name
    const placeLat = place.geometry.location.lat
    const placeLng = place.geometry.location.lng

    Alert.alert(
      `Go to ${placeName}?`,
      'Navigation will route you here then continue to your destination.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Navigate Here',
          onPress: () => {
            setDetourDestination({ name: placeName, lat: placeLat, lng: placeLng })
            // Reroute to place first, then destination
            fetchRoute(`${userLatRef.current},${userLngRef.current}`, `${placeLat},${placeLng}`, true)
              .then(() => {
                // After arriving at place, route to original destination
                destinationRef.current = destination
              })
            track('detour_started', { place: placeName, origin, destination })
          }
        }
      ]
    )
  }

  const shareRoute = () => {
    setShowShareCard(true)
    track('share_card_opened', { origin, destination })
  }

  const startNavigation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { alert('Location permission needed for navigation'); return }
    navigatingRef.current = true
    drivenIdxRef.current = 0
    setNavigating(true)
    setCurrentStep(0)
    currentStepRef.current = 0
    lastSpokenStepRef.current = -1
    lastVoiceTimeRef.current = 0
    setDrivenPolyline([])
    setRemainingPolyline([...polylineRef.current])
    const info = routeInfoRef.current
    if (info) setRemainingTime(info.duration)
    const stps = stepsRef.current
    if (stps[0]) {
      setTimeout(() => {
        speak('Starting navigation. ' + stripHtml(stps[0].html_instructions) + '. ' + (stps[0].distance?.text || ''))
      }, 500)
    }
    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 8 },
      onLocation
    )
  }

  const stopNavigation = () => {
    navigatingRef.current = false
    setNavigating(false)
    setDetourDestination(null)
    Speech.stop()
    if (drivenIdxRef.current > 10) setShowRating(true)
    locationSubRef.current?.remove()
    locationSubRef.current = null
    setDrivenPolyline([])
    setRemainingPolyline([...polylineRef.current])
    drivenIdxRef.current = 0
    const info = routeInfoRef.current || routeInfo
    if (mapRef.current && info) {
      mapRef.current.animateCamera({
        center: { latitude: info.midLat, longitude: info.midLng },
        pitch: 0, heading: 0, zoom: 7
      }, { duration: 800 })
    }
    fetchPlaces(null)
  }

  if (loading) return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🧭</Text>
      <ActivityIndicator color={C.accent} size="large" />
      <Text style={s.hint}>Calculating your route...</Text>
    </View>
  )
  if (error) return (
    <View style={s.center}>
      <Text style={s.errorTxt}>{error}</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.btn}>
        <Text style={s.btnTxt}>GO BACK</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Sticky STOP button */}
      {navigating && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 999, padding: 16, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#E8E8E8' }}>
          <TouchableOpacity onPress={stopNavigation} style={{ backgroundColor: '#C97B7B', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 2 }}>⏹ STOP NAVIGATION</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation banner */}
      {navigating && (
        <SafeAreaView style={{ backgroundColor: rerouting ? '#C97B7B' : '#1A1A1A' }}>
          <View style={s.navBanner}>
            <TouchableOpacity onPress={() => { const n = Math.max(0, currentStepRef.current - 1); currentStepRef.current = n; setCurrentStep(n) }} style={s.navBtn}>
              <Text style={s.navBtnTxt}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
              {rerouting ? (
                <Text style={[s.navInstruction, { color: '#fff' }]}>🔄 Recalculating...</Text>
              ) : (
                <>
                  <Text style={s.navStepNum}>STEP {currentStep + 1} / {currentSteps.length} · {remainingTime} remaining</Text>
                  <Text style={s.navInstruction} numberOfLines={2}>
                    {currentSteps[currentStep] ? stripHtml(currentSteps[currentStep].html_instructions) : '🎉 You have arrived!'}
                  </Text>
                  {currentSteps[currentStep]?.distance?.text && <Text style={s.navDist}>{currentSteps[currentStep].distance.text}</Text>}
                  {detourDestination && <Text style={{ fontSize: 10, color: '#7BA7BC', marginTop: 2 }}>Detour: {detourDestination.name}</Text>}
                </>
              )}
            </View>
            <TouchableOpacity onPress={() => {
              const n = Math.min(currentSteps.length - 1, currentStepRef.current + 1)
              currentStepRef.current = n; setCurrentStep(n)
              if (stepsRef.current[n]) speak(stripHtml(stepsRef.current[n].html_instructions))
            }} style={s.navBtn}>
              <Text style={s.navBtnTxt}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              const newVal = !voiceEnabledRef.current
              voiceEnabledRef.current = newVal
              setVoiceEnabled(newVal)
              if (!newVal) Speech.stop()
            }} style={[s.navBtn, { marginLeft: 4, backgroundColor: voiceEnabled ? 'rgba(123,167,188,0.4)' : 'rgba(255,255,255,0.1)' }]}>
              <Text style={{ fontSize: 16 }}>{voiceEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ height: navigating ? W : 280 }}
        initialRegion={{ latitude: routeInfo.midLat, longitude: routeInfo.midLng, latitudeDelta: 10, longitudeDelta: 10 }}
        showsUserLocation={false}
        rotateEnabled
        pitchEnabled
        showsCompass
        showsTraffic={navigating}
        moveOnMarkerPress={false}
      >
        {drivenPolyline.length > 1 && (
          <Polyline coordinates={drivenPolyline} strokeColor="#333333" strokeWidth={5} zIndex={1} />
        )}
        {(remainingPolyline.length > 1 || polyline.length > 0) && (
          <Polyline
            coordinates={remainingPolyline.length > 1 ? remainingPolyline : polyline}
            strokeColor="#007AFF"
            strokeWidth={6}
            zIndex={2}
          />
        )}
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} flat rotation={userLocation.heading || 0}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#4A90C4', borderWidth: 3, borderColor: '#fff' }} />
          </Marker>
        )}
        {places.map((p, i) => p.geometry?.location && (
          <Marker key={i} coordinate={{ latitude: p.geometry.location.lat, longitude: p.geometry.location.lng }} title={p.name} pinColor={activeF.color} />
        ))}
        {stages.map((st, i) => (
          <Marker key={i} coordinate={{ latitude: st.endLat, longitude: st.endLng }}>
            <View style={[s.dayMarker, { backgroundColor: DAY_COLORS[i % DAY_COLORS.length] }]}>
              <Text style={s.dayMarkerTxt}>{i + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Route card */}
        <View style={s.card}>
          <View style={s.routeRow}><View style={s.dot8} /><Text style={s.city}>{origin}</Text></View>
          <View style={s.routeLine} />
          <View style={s.routeRow}><View style={[s.dot8, { backgroundColor: C.accent }]} /><Text style={s.city}>{destination}</Text></View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 8 }}>
            <TouchableOpacity
              onPress={navigating ? stopNavigation : startNavigation}
              style={[s.navMainBtn, { flex: 1, backgroundColor: navigating ? '#C97B7B' : C.primary }]}>
              <Text style={s.navMainBtnTxt}>{navigating ? 'STOP' : 'NAVIGATE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (navigating) stopNavigation(); navigation.goBack(); }}
              style={[s.navMainBtn, { backgroundColor: '#F5F5F7', paddingHorizontal: 16 }]}>
              <Text style={[s.navMainBtnTxt, { color: '#6E6E73' }]}>BACK</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TouchableOpacity
              disabled={saving}
              onPress={async () => {
                const info = routeInfoRef.current || routeInfo
                if (!info) return
                setSaving(true)
                const ok = await saveRoute({ origin, destination, distance_text: info.distance, duration_text: info.duration, total_m: info.totalM, plan_by_day: planByDay, limit_type: limitType, limit_value: limitValue })
                setSaving(false)
                track('route_saved', { origin, destination })
                alert(ok ? 'Route saved!' : 'Could not save.')
              }}
              style={[s.navMainBtn, { flex: 1, backgroundColor: '#7BA7BC', opacity: saving ? 0.6 : 1 }]}>
              <Text style={s.navMainBtnTxt}>{saving ? 'SAVING...' : 'SAVE ROUTE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={shareRoute} style={[s.navMainBtn, { flex: 1, backgroundColor: '#8BAF8B' }]}>
              <Text style={s.navMainBtnTxt}>SHARE</Text>
            </TouchableOpacity>
          </View>
          <View style={s.stats}>
            <View style={{ flex: 1 }}>
              <Text style={s.statLabel}>DISTANCE</Text>
              <Text style={s.statVal}>{routeInfo.distance}</Text>
            </View>
            <View style={s.statDiv} />
            <View style={{ flex: 1 }}>
              <Text style={s.statLabel}>{navigating ? 'REMAINING' : 'DURATION'}</Text>
              <Text style={s.statVal}>{navigating ? remainingTime : routeInfo.duration}</Text>
            </View>
          </View>
        </View>

        {/* Daily stages */}
        {planByDay && stages.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>DAILY STAGES</Text>
            {stages.map((st, i) => (
              <TouchableOpacity key={i} onPress={() => setActiveDay(i)}
                style={[s.stageBtn, { borderColor: activeDay === i ? DAY_COLORS[i % DAY_COLORS.length] : C.border, backgroundColor: activeDay === i ? DAY_COLORS[i % DAY_COLORS.length] + '15' : C.surface }]}>
                <View style={[s.stageDot, { backgroundColor: DAY_COLORS[i % DAY_COLORS.length] }]}><Text style={s.stageDotTxt}>{i + 1}</Text></View>
                <View><Text style={s.stageName}>Day {i + 1}</Text><Text style={s.stageInfo}>{st.distance} · {st.duration}</Text></View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Next steps during navigation */}
        {navigating && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>NEXT STEPS</Text>
            {currentSteps.slice(currentStep, currentStep + 3).map((step: any, i: number) => (
              <View key={i} style={[s.stepRow, { backgroundColor: i === 0 ? '#F0F7FF' : 'transparent', borderRadius: 8, padding: i === 0 ? 10 : 0, marginBottom: i === 0 ? 4 : 10 }]}>
                <View style={[s.stepNum, { backgroundColor: i === 0 ? C.accent : '#F5F5F7' }]}>
                  <Text style={[s.stepNumTxt, { color: i === 0 ? '#fff' : C.hint }]}>{currentStep + i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.stepTxt, { fontWeight: i === 0 ? '700' : '400' }]}>{stripHtml(step.html_instructions)}</Text>
                  <Text style={s.stepDist}>{step.distance?.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Filters */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{navigating ? '📍 PLACES AHEAD' : 'DISCOVER ALONG ROUTE'}</Text>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f.key} onPress={() => setActiveFilter(f.key)}
                style={[s.filterBtn, { backgroundColor: activeFilter === f.key ? f.color + '20' : C.surface, borderColor: activeFilter === f.key ? f.color + '80' : C.border }]}>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</Text>
                <Text style={[s.filterLabel, { color: activeFilter === f.key ? f.color : C.secondary }]}>{f.label.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Places */}
        <View style={[s.section, { paddingBottom: navigating ? 100 : 40 }]}>
          {placesLoading ? <ActivityIndicator color={C.accent} style={{ marginVertical: 20 }} /> :
            places.map((p, i) => {
              const address = formatAddress(p.vicinity || '')
              const distKm = p.distanceM > 1000 ? (p.distanceM / 1000).toFixed(1) + ' km' : p.distanceM + ' m'
              return (
                <View key={i} style={s.placeCard}>
                  <View style={s.placeHeader}>
                    <View style={[s.placeIcon, { backgroundColor: activeF.color + '20' }]}><Text style={{ fontSize: 16 }}>{activeF.icon}</Text></View>
                    <Text style={[s.placeType, { color: activeF.color }]}>{activeFilter.replace('_', ' ').toUpperCase()}</Text>
                    {p.distanceM > 0 && (
                      <Text style={{ fontSize: 10, color: C.hint, marginLeft: 'auto' }}>📍 {distKm} ahead</Text>
                    )}
                  </View>
                  <Text style={s.placeName}>{p.name}</Text>
                  {address ? <Text style={s.placeVic}>{address}</Text> : null}
                  {p.rating && (
                    <View style={s.ratingRow}>
                      {[1, 2, 3, 4, 5].map(st => <View key={st} style={[s.ratingDot, { backgroundColor: st <= Math.round(p.rating) ? activeF.color : C.border }]} />)}
                      <Text style={s.ratingTxt}>{p.rating}</Text>
                    </View>
                  )}
                  {/* FIX 6: Navigate to place + book buttons */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {navigating && (
                      <TouchableOpacity
                        onPress={() => navigateToPlace(p)}
                        style={[s.bookBtn, { flex: 1, backgroundColor: '#F5F5F7', borderWidth: 1, borderColor: C.border }]}>
                        <Text style={[s.bookBtnTxt, { color: C.primary }]}>🧭 GO HERE</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => Linking.openURL(activeF.bookUrl(p.name, p.vicinity || ''))}
                      style={[s.bookBtn, { flex: 1, backgroundColor: activeF.color }]}>
                      <Text style={s.bookBtnTxt}>{activeFilter === 'lodging' ? 'BOOK HOTEL' : activeFilter === 'restaurant' ? 'RESERVE TABLE' : activeFilter === 'tourist_attraction' ? 'BOOK TICKETS' : 'BOOK TOUR'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
        </View>

      </ScrollView>

      <RatingModal
        visible={showRating}
        onClose={() => setShowRating(false)}
        origin={origin}
        destination={destination}
        distanceKm={Math.round((routeInfoRef.current?.totalM || 0) / 1000)}
        durationMin={currentStepRef.current}
      />
      <ShareCard
        visible={showShareCard}
        onClose={() => setShowShareCard(false)}
        origin={origin}
        destination={destination}
        distance={routeInfo?.distance || ''}
        duration={routeInfo?.duration || ''}
        days={planByDay ? limitValue : undefined}
        hotelCount={places.filter((p: any) => p.types?.includes('lodging')).length || undefined}
        diningCount={places.filter((p: any) => p.types?.includes('restaurant') || p.types?.includes('food')).length || undefined}
        sightsCount={places.filter((p: any) => p.types?.includes('tourist_attraction') || p.types?.includes('museum')).length || undefined}
      />
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hint: { fontSize: 13, color: '#6E6E73', marginTop: 12 },
  errorTxt: { color: '#C97B7B', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  btn: { backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  btnTxt: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  navBanner: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  navBtn: { backgroundColor: 'rgba(255,255,255,0.1)', width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  navBtnTxt: { color: '#fff', fontSize: 20 },
  navStepNum: { fontSize: 9, color: '#AEAEB2', letterSpacing: 1, marginBottom: 4 },
  navInstruction: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 20 },
  navDist: { fontSize: 12, color: '#7BA7BC', marginTop: 4 },
  dayMarker: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  dayMarkerTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E8E8E8' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  city: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  routeLine: { width: 1, height: 10, backgroundColor: '#E8E8E8', marginLeft: 3, marginVertical: 4 },
  dot8: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A1A1A' },
  navMainBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  navMainBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  stats: { flexDirection: 'row', backgroundColor: '#F5F5F7', borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 9, color: '#AEAEB2', fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  statDiv: { width: 1, backgroundColor: '#E8E8E8', marginHorizontal: 16 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 10, color: '#AEAEB2', fontWeight: '600', letterSpacing: 2, marginBottom: 10 },
  stageBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  stageDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stageDotTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  stageName: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  stageInfo: { fontSize: 11, color: '#AEAEB2' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  stepNum: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { fontSize: 9, fontWeight: '700' },
  stepTxt: { fontSize: 12, color: '#1A1A1A', lineHeight: 18, marginBottom: 2 },
  stepDist: { fontSize: 10, color: '#AEAEB2' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1 },
  filterLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  placeCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 12 },
  placeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  placeIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  placeType: { fontSize: 9, fontWeight: '600', letterSpacing: 2 },
  placeName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  placeVic: { fontSize: 11, color: '#AEAEB2', marginBottom: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  ratingDot: { width: 5, height: 5, borderRadius: 3 },
  ratingTxt: { fontSize: 11, color: '#6E6E73', fontWeight: '600', marginLeft: 4 },
  bookBtn: { borderRadius: 8, padding: 11, alignItems: 'center' },
  bookBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
})
