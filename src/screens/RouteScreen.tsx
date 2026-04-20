import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, ActivityIndicator, Dimensions, Platform, SafeAreaView } from 'react-native'
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { useKeepAwake } from 'expo-keep-awake'
import { getDirectionsUrl, getPlacesUrl, haversine, decodePolyline, stripHtml, FILTERS } from '../lib/maps'

const C = { primary: '#1A1A1A', accent: '#7BA7BC', bg: '#FAFAFA', surface: '#FFFFFF', border: '#E8E8E8', hint: '#AEAEB2', secondary: '#6E6E73' }
const { width: W } = Dimensions.get('window')
const DAY_COLORS = ['#7BA7BC','#8BAF8B','#9B8BB4','#7BBCB0','#C4A882','#BC7B7B']

export default function RouteScreen({ route, navigation }: any) {
  const { origin, destination, planByDay, limitType, limitValue } = route.params
  useKeepAwake()

  const mapRef = useRef<MapView>(null)
  const locationSubRef = useRef<any>(null)
  const currentStepRef = useRef(0)
  const lastFetchRef = useRef<{latitude: number, longitude: number} | null>(null)

  const [routeInfo, setRouteInfo] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [polyline, setPolyline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [places, setPlaces] = useState<any[]>([])
  const [placesLoading, setPlacesLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('lodging')
  const [activeDay, setActiveDay] = useState(0)

  const [navigating, setNavigating] = useState(false)
  const [userLocation, setUserLocation] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const currentSteps = planByDay && stages.length > 0 ? (stages[activeDay]?.steps || []) : steps
  const activeF = FILTERS.find(f => f.key === activeFilter)!

  useEffect(() => { fetchRoute() }, [])
  useEffect(() => { if (routeInfo) fetchPlaces(null) }, [activeFilter, activeDay, routeInfo])
  useEffect(() => { return () => { locationSubRef.current?.remove() } }, [])

  const getRadius = (info: any) => {
    if (!info) return 10000
    const km = info.totalM / 1000
    if (km < 20) return 2000
    if (km < 100) return 10000
    return 25000
  }

  const fetchRoute = async () => {
    setLoading(true)
    try {
      const res = await fetch(getDirectionsUrl(origin, destination))
      const data = await res.json()
      if (data.status === 'OK' && data.routes?.[0]) {
        const leg = data.routes[0].legs[0]
        setPolyline(decodePolyline(data.routes[0].overview_polyline.points))
        const totalSec = leg.duration.value
        const totalM = leg.distance.value
        const limitSec = limitType==='days' ? totalSec/limitValue : limitType==='hours' ? limitValue*3600 : (limitValue/(totalM/1000))*totalSec
        const numDays = planByDay ? (limitType==='days' ? limitValue : Math.ceil(totalSec/limitSec)) : 1
        const info = { distance: leg.distance.text, duration: leg.duration.text, midLat: (leg.start_location.lat+leg.end_location.lat)/2, midLng: (leg.start_location.lng+leg.end_location.lng)/2, startLat: leg.start_location.lat, startLng: leg.start_location.lng, endLat: leg.end_location.lat, endLng: leg.end_location.lng, numDays, totalM }
        setRouteInfo(info)
        const stepsWithCoords = leg.steps.map((s: any) => ({ ...s, endLat: s.end_location.lat, endLng: s.end_location.lng }))
        setSteps(stepsWithCoords)
        if (planByDay && numDays > 1) {
          const arr: any[] = []
          let acc=0, start={lat:leg.start_location.lat,lng:leg.start_location.lng}, daySteps:any[]=[], dist=0, dur=0
          for (let i=0; i<stepsWithCoords.length; i++) {
            const st=stepsWithCoords[i]; acc+=st.duration.value; daySteps.push(st); dist+=st.distance.value; dur+=st.duration.value
            if (acc>=limitSec||i===stepsWithCoords.length-1) {
              arr.push({ day:arr.length+1, startLat:start.lat, startLng:start.lng, endLat:st.end_location.lat, endLng:st.end_location.lng, distance:(dist/1000).toFixed(0)+' km', duration:Math.floor(dur/3600)+'h '+Math.floor((dur%3600)/60)+'m', steps:daySteps })
              start={lat:st.end_location.lat,lng:st.end_location.lng}; daySteps=[]; dist=0; dur=0; acc=0
            }
          }
          setStages(arr)
        }
      } else { setError('Could not get route.') }
    } catch (e) { setError('Something went wrong.') }
    setLoading(false)
  }

  const fetchPlaces = async (pos: {latitude:number,longitude:number}|null) => {
    if (!routeInfo) return
    setPlacesLoading(true)
    const center = pos || { latitude: routeInfo.midLat, longitude: routeInfo.midLng }
    try {
      const res = await fetch(getPlacesUrl(center.latitude, center.longitude, activeFilter, getRadius(routeInfo)))
      const data = await res.json()
      const seen = new Set<string>()
      const ex: Record<string,string[]> = { restaurant:['lodging','hotel','motel'], tourist_attraction:['lodging','hotel','restaurant'], travel_agency:['lodging','hotel','restaurant'], lodging:[] }
      const req: Record<string,string[]> = { restaurant:['restaurant','food','cafe','bar'], tourist_attraction:['tourist_attraction','museum','church','park','art_gallery'], travel_agency:['travel_agency','tour_operator'], lodging:['lodging'] }
      setPlaces((data.results||[]).filter((p:any) => {
        if (seen.has(p.place_id)) return false; seen.add(p.place_id)
        const t:string[]=p.types||[]
        if ((ex[activeFilter]||[]).some((e:string)=>t.includes(e))) return false
        if ((req[activeFilter]||[]).length>0 && !(req[activeFilter]||[]).some((r:string)=>t.includes(r))) return false
        return true
      }).slice(0,18))
    } catch(e){console.error(e)}
    setPlacesLoading(false)
  }

  const onLocation = useCallback((loc: Location.LocationObject) => {
    const { latitude, longitude, heading } = loc.coords
    setUserLocation({ latitude, longitude, heading: heading || 0 })
    if (mapRef.current) {
      mapRef.current.animateCamera({ center:{latitude,longitude}, heading:heading||0, pitch:50, zoom:17 }, { duration:600 })
    }
    const step = currentSteps[currentStepRef.current]
    if (step?.endLat && step?.endLng) {
      if (haversine(latitude,longitude,step.endLat,step.endLng)<50 && currentStepRef.current<currentSteps.length-1) {
        const next=currentStepRef.current+1; currentStepRef.current=next; setCurrentStep(next)
      }
    }
    const last=lastFetchRef.current
    if (!last||haversine(latitude,longitude,last.latitude,last.longitude)>2000) {
      lastFetchRef.current={latitude,longitude}; fetchPlaces({latitude,longitude})
    }
  }, [currentSteps, activeFilter, routeInfo])

  const startNavigation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status!=='granted') { alert('Location permission needed'); return }
    setNavigating(true); setCurrentStep(0); currentStepRef.current=0
    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy:Location.Accuracy.BestForNavigation, timeInterval:1000, distanceInterval:5 },
      onLocation
    )
  }

  const stopNavigation = () => {
    setNavigating(false); locationSubRef.current?.remove(); locationSubRef.current=null
    if (mapRef.current && routeInfo) mapRef.current.animateCamera({ center:{latitude:routeInfo.midLat,longitude:routeInfo.midLng}, pitch:0, heading:0, zoom:7 }, {duration:800})
    fetchPlaces(null)
  }

  if (loading) return <View style={s.center}><Text style={{fontSize:48,marginBottom:16}}>🧭</Text><ActivityIndicator color={C.accent} size="large" /><Text style={s.hint}>Calculating your route...</Text></View>
  if (error) return <View style={s.center}><Text style={s.errorTxt}>{error}</Text><TouchableOpacity onPress={()=>navigation.goBack()} style={s.btn}><Text style={s.btnTxt}>GO BACK</Text></TouchableOpacity></View>

  return (
    <View style={{flex:1,backgroundColor:C.bg}}>

      {/* Navigation banner */}
      {navigating && (
        <SafeAreaView style={{backgroundColor:'#1A1A1A'}}>
          <View style={s.navBanner}>
            <TouchableOpacity onPress={()=>{const n=Math.max(0,currentStepRef.current-1);currentStepRef.current=n;setCurrentStep(n)}} style={s.navBtn}><Text style={s.navBtnTxt}>←</Text></TouchableOpacity>
            <View style={{flex:1,alignItems:'center',paddingHorizontal:8}}>
              <Text style={s.navStepNum}>STEP {currentStep+1} / {currentSteps.length}</Text>
              <Text style={s.navInstruction} numberOfLines={2}>{currentSteps[currentStep]?stripHtml(currentSteps[currentStep].html_instructions):'🎉 You have arrived!'}</Text>
              {currentSteps[currentStep]?.distance?.text&&<Text style={s.navDist}>{currentSteps[currentStep].distance.text}</Text>}
            </View>
            <TouchableOpacity onPress={()=>{const n=Math.min(currentSteps.length-1,currentStepRef.current+1);currentStepRef.current=n;setCurrentStep(n)}} style={s.navBtn}><Text style={s.navBtnTxt}>→</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Map */}
      <MapView ref={mapRef} provider={PROVIDER_GOOGLE}
        style={{height: navigating ? W : 280}}
        initialRegion={{latitude:routeInfo.midLat,longitude:routeInfo.midLng,latitudeDelta:10,longitudeDelta:10}}
        showsUserLocation={false} rotateEnabled pitchEnabled showsCompass showsTraffic={navigating} moveOnMarkerPress={false}>
        {polyline.length>0&&<Polyline coordinates={polyline} strokeColor="#4A90C4" strokeWidth={5} zIndex={1}/>}
        {userLocation&&<Marker coordinate={userLocation} anchor={{x:0.5,y:0.5}} flat={true} rotation={userLocation.heading||0}><View style={{width:20,height:20,borderRadius:10,backgroundColor:'#4A90C4',borderWidth:3,borderColor:'#fff'}}/></Marker>}
        {places.map((p,i)=>p.geometry?.location&&(
          <Marker key={i} coordinate={{latitude:p.geometry.location.lat,longitude:p.geometry.location.lng}} title={p.name} pinColor={activeF.color}/>
        ))}
        {stages.map((st,i)=>(
          <Marker key={i} coordinate={{latitude:st.endLat,longitude:st.endLng}}>
            <View style={[s.dayMarker,{backgroundColor:DAY_COLORS[i%DAY_COLORS.length]}]}><Text style={s.dayMarkerTxt}>{i+1}</Text></View>
          </Marker>
        ))}
      </MapView>

      <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false}>

        {/* Route card */}
        <View style={s.card}>
          <View style={s.routeRow}><View style={s.dot8}/><Text style={s.city}>{origin}</Text></View>
          <View style={s.routeLine}/>
          <View style={s.routeRow}><View style={[s.dot8,{backgroundColor:C.accent}]}/><Text style={s.city}>{destination}</Text></View>
          <View style={{flexDirection:'row',gap:8,marginTop:16,marginBottom:12}}>
            <TouchableOpacity onPress={navigating?stopNavigation:startNavigation} style={[s.navMainBtn,{flex:1,backgroundColor:navigating?'#C97B7B':C.primary,marginTop:0,marginBottom:0}]}>
              <Text style={s.navMainBtnTxt}>{navigating?'⏹ STOP':'🧭 NAVIGATE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>navigation.goBack()} style={[s.navMainBtn,{backgroundColor:'#F5F5F7',marginTop:0,marginBottom:0,paddingHorizontal:16}]}>
              <Text style={[s.navMainBtnTxt,{color:'#6E6E73'}]}>+ NEW</Text>
            </TouchableOpacity>
          </View>
          <View style={s.stats}>
            <View style={{flex:1}}><Text style={s.statLabel}>DISTANCE</Text><Text style={s.statVal}>{routeInfo.distance}</Text></View>
            <View style={s.statDiv}/>
            <View style={{flex:1}}><Text style={s.statLabel}>DURATION</Text><Text style={s.statVal}>{routeInfo.duration}</Text></View>
          </View>
        </View>

        {/* Daily stages */}
        {planByDay&&stages.length>0&&(
          <View style={s.section}>
            <Text style={s.sectionTitle}>DAILY STAGES</Text>
            {stages.map((st,i)=>(
              <TouchableOpacity key={i} onPress={()=>setActiveDay(i)} style={[s.stageBtn,{borderColor:activeDay===i?DAY_COLORS[i%DAY_COLORS.length]:C.border,backgroundColor:activeDay===i?DAY_COLORS[i%DAY_COLORS.length]+'15':C.surface}]}>
                <View style={[s.stageDot,{backgroundColor:DAY_COLORS[i%DAY_COLORS.length]}]}><Text style={s.stageDotTxt}>{i+1}</Text></View>
                <View><Text style={s.stageName}>Day {i+1}</Text><Text style={s.stageInfo}>{st.distance} · {st.duration}</Text></View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step by step - only when navigating */}
        {navigating&&(
          <View style={s.section}>
            <Text style={s.sectionTitle}>NEXT STEPS</Text>
            {currentSteps.slice(currentStep,currentStep+3).map((step:any,i:number)=>(
              <View key={i} style={[s.stepRow,{backgroundColor:i===0?'#F0F7FF':'transparent',borderRadius:8,padding:i===0?10:0,marginBottom:i===0?4:10}]}>
                <View style={[s.stepNum,{backgroundColor:i===0?C.accent:'#F5F5F7'}]}><Text style={[s.stepNumTxt,{color:i===0?'#fff':C.hint}]}>{currentStep+i+1}</Text></View>
                <View style={{flex:1}}><Text style={[s.stepTxt,{fontWeight:i===0?'700':'400'}]}>{stripHtml(step.html_instructions)}</Text><Text style={s.stepDist}>{step.distance?.text}</Text></View>
              </View>
            ))}
          </View>
        )}

        {/* Filters */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{navigating?'📍 PLACES AHEAD':'DISCOVER ALONG ROUTE'}</Text>
          <View style={s.filterRow}>
            {FILTERS.map(f=>(
              <TouchableOpacity key={f.key} onPress={()=>setActiveFilter(f.key)} style={[s.filterBtn,{backgroundColor:activeFilter===f.key?f.color+'20':C.surface,borderColor:activeFilter===f.key?f.color+'80':C.border}]}>
                <Text style={{fontSize:20,marginBottom:4}}>{f.icon}</Text>
                <Text style={[s.filterLabel,{color:activeFilter===f.key?f.color:C.secondary}]}>{f.label.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Places */}
        <View style={[s.section,{paddingBottom:40}]}>
          {placesLoading?<ActivityIndicator color={C.accent} style={{marginVertical:20}}/>:
          places.map((p,i)=>(
            <View key={i} style={s.placeCard}>
              <View style={s.placeHeader}>
                <View style={[s.placeIcon,{backgroundColor:activeF.color+'20'}]}><Text style={{fontSize:16}}>{activeF.icon}</Text></View>
                <Text style={[s.placeType,{color:activeF.color}]}>{activeFilter.replace('_',' ').toUpperCase()}</Text>
              </View>
              <Text style={s.placeName}>{p.name}</Text>
              <Text style={s.placeVic}>{p.vicinity}</Text>
              {p.rating&&(
                <View style={s.ratingRow}>
                  {[1,2,3,4,5].map(st=><View key={st} style={[s.ratingDot,{backgroundColor:st<=Math.round(p.rating)?activeF.color:C.border}]}/>)}
                  <Text style={s.ratingTxt}>{p.rating}</Text>
                </View>
              )}
              <TouchableOpacity onPress={()=>Linking.openURL(activeF.bookUrl(p.name,p.vicinity||''))} style={[s.bookBtn,{backgroundColor:activeF.color}]}>
                <Text style={s.bookBtnTxt}>{activeFilter==='lodging'?'BOOK HOTEL':activeFilter==='restaurant'?'RESERVE TABLE':activeFilter==='tourist_attraction'?'BOOK TICKETS':'BOOK TOUR'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},
  hint:{fontSize:13,color:'#6E6E73',marginTop:12},
  errorTxt:{color:'#C97B7B',fontSize:14,marginBottom:20,textAlign:'center'},
  btn:{backgroundColor:'#1A1A1A',borderRadius:10,paddingHorizontal:32,paddingVertical:12},
  btnTxt:{color:'#fff',fontSize:12,fontWeight:'700',letterSpacing:2},
  navBanner:{flexDirection:'row',alignItems:'center',padding:12},
  navBtn:{backgroundColor:'rgba(255,255,255,0.1)',width:40,height:40,borderRadius:8,alignItems:'center',justifyContent:'center'},
  navBtnTxt:{color:'#fff',fontSize:20},
  navStepNum:{fontSize:9,color:'#AEAEB2',letterSpacing:2,marginBottom:4},
  navInstruction:{fontSize:14,fontWeight:'700',color:'#fff',textAlign:'center',lineHeight:20},
  navDist:{fontSize:12,color:'#7BA7BC',marginTop:4},
  dayMarker:{width:28,height:28,borderRadius:14,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#fff'},
  dayMarkerTxt:{color:'#fff',fontSize:11,fontWeight:'700'},
  card:{backgroundColor:'#fff',margin:16,borderRadius:16,padding:20,borderWidth:1,borderColor:'#E8E8E8'},
  routeRow:{flexDirection:'row',alignItems:'center',gap:10},
  city:{fontSize:15,fontWeight:'700',color:'#1A1A1A'},
  routeLine:{width:1,height:10,backgroundColor:'#E8E8E8',marginLeft:3,marginVertical:4},
  dot8:{width:8,height:8,borderRadius:4,backgroundColor:'#1A1A1A'},
  navMainBtn:{borderRadius:12,padding:14,alignItems:'center',marginTop:16,marginBottom:12},
  navMainBtnTxt:{color:'#fff',fontSize:12,fontWeight:'700',letterSpacing:2},
  stats:{flexDirection:'row',backgroundColor:'#F5F5F7',borderRadius:12,padding:14},
  statLabel:{fontSize:9,color:'#AEAEB2',fontWeight:'600',letterSpacing:1,marginBottom:4},
  statVal:{fontSize:16,fontWeight:'700',color:'#1A1A1A'},
  statDiv:{width:1,backgroundColor:'#E8E8E8',marginHorizontal:16},
  section:{paddingHorizontal:16,marginBottom:8},
  sectionTitle:{fontSize:10,color:'#AEAEB2',fontWeight:'600',letterSpacing:2,marginBottom:10},
  stageBtn:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:10,borderWidth:1,marginBottom:6},
  stageDot:{width:28,height:28,borderRadius:14,alignItems:'center',justifyContent:'center'},
  stageDotTxt:{color:'#fff',fontSize:11,fontWeight:'700'},
  stageName:{fontSize:12,fontWeight:'700',color:'#1A1A1A'},
  stageInfo:{fontSize:11,color:'#AEAEB2'},
  stepRow:{flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:10},
  stepNum:{width:20,height:20,borderRadius:10,alignItems:'center',justifyContent:'center'},
  stepNumTxt:{fontSize:9,fontWeight:'700'},
  stepTxt:{fontSize:12,color:'#1A1A1A',lineHeight:18,marginBottom:2},
  stepDist:{fontSize:10,color:'#AEAEB2'},
  filterRow:{flexDirection:'row',gap:8,marginBottom:16},
  filterBtn:{flex:1,alignItems:'center',padding:10,borderRadius:12,borderWidth:1},
  filterLabel:{fontSize:9,fontWeight:'600',letterSpacing:1},
  placeCard:{backgroundColor:'#fff',borderRadius:14,padding:16,borderWidth:1,borderColor:'#E8E8E8',marginBottom:12},
  placeHeader:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
  placeIcon:{width:32,height:32,borderRadius:8,alignItems:'center',justifyContent:'center'},
  placeType:{fontSize:9,fontWeight:'600',letterSpacing:2},
  placeName:{fontSize:14,fontWeight:'700',color:'#1A1A1A',marginBottom:4},
  placeVic:{fontSize:11,color:'#AEAEB2',marginBottom:10},
  ratingRow:{flexDirection:'row',alignItems:'center',gap:4,marginBottom:12},
  ratingDot:{width:5,height:5,borderRadius:3},
  ratingTxt:{fontSize:11,color:'#6E6E73',fontWeight:'600',marginLeft:4},
  bookBtn:{borderRadius:8,padding:11,alignItems:'center'},
  bookBtnTxt:{color:'#fff',fontSize:11,fontWeight:'700',letterSpacing:1},
})
