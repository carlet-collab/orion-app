import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Dimensions, SafeAreaView } from 'react-native'

const { width: W } = Dimensions.get('window')
const C = { primary: '#1A1A1A', accent: '#7BA7BC', bg: '#FAFAFA', surface: '#FFFFFF', border: '#E8E8E8', hint: '#AEAEB2', secondary: '#6E6E73' }

const Logo = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
    <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: '#fff' }} />
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
  </View>
)

const LogoDark = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary }} />
    <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: C.primary }} />
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary }} />
  </View>
)

export default function HomeScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start()
  }, [])

  const steps = [
    { step: '1', icon: '📍', color: '#7BA7BC', title: 'Enter your route', body: 'Type where you start and where you are headed.' },
    { step: '2', icon: '⏱️', color: '#8BAF8B', title: 'Set your pace', body: 'Days, hours or km — Orion plans your stages.' },
    { step: '3', icon: '🧭', color: '#9B8BB4', title: 'Discover and go', body: 'Hotels, restaurants, sights. Book in one tap.' },
  ]

  const features = [
    { icon: '🏨', color: '#7BA7BC', title: 'Hotels on your road', body: 'Every hotel shown is actually on your route — not 40km off the highway.' },
    { icon: '🍽️', color: '#8BAF8B', title: 'Great food. Zero detours.', body: 'Restaurants directly on your path. Eat well, stay on track.' },
    { icon: '🎭', color: '#9B8BB4', title: 'Sights you\'d drive past', body: 'Castles, viewpoints, hidden gems — shown exactly when you need them.' },
    { icon: '🎯', color: '#7BBCB0', title: 'Tours ahead of you', body: 'Experiences and tours along your exact route, updated as you drive.' },
  ]

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* HERO — dark section matching web CTA */}
      <View style={s.hero}>
        <SafeAreaView>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Logo */}
            <View style={s.logoRow}>
              <Logo />
              <Text style={s.logoTxt}>ORION</Text>
            </View>
            <Text style={s.logoSub}>Your journey. Discovered.</Text>

            {/* Badge */}
            <View style={s.badge}>
              <View style={s.badgeDot} />
              <Text style={s.badgeTxt}>ROUTE DISCOVERY · NOW AVAILABLE</Text>
            </View>

            {/* Headline */}
            <Text style={s.heroTitle}>The road trip app that thinks ahead{' '}
              <Text style={{ color: C.accent }}>so you don't have to.</Text>
            </Text>
            <Text style={s.heroSub}>Plan your route. Set your driving hours. Orion finds the perfect hotels, restaurants and landmarks — right where you need them.</Text>

            {/* Preview card */}
            <View style={s.previewCard}>
              <View style={s.previewRoute}>
                <View style={s.previewDot} />
                <Text style={s.previewCity}>Prague</Text>
                <Text style={s.previewArrow}>→</Text>
                <Text style={s.previewCity}>Madrid</Text>
                <Text style={s.previewDays}>3 days</Text>
              </View>
              {['Day 1 · 892 km · 9h 30m', 'Day 2 · 650 km · 7h 15m', 'Day 3 · 580 km · 6h 45m'].map((day, i) => (
                <View key={i} style={[s.previewDay, i < 2 && s.previewDayBorder]}>
                  <View style={s.previewNum}><Text style={s.previewNumTxt}>{i + 1}</Text></View>
                  <Text style={s.previewDayTxt}>{day}</Text>
                </View>
              ))}
              <View style={s.previewPlaces}>
                {[{ name: 'Hotel Sax Prague', type: 'HOTEL', color: '#7BA7BC', icon: '🏨' },
                  { name: 'La Terrasse', type: 'DINING', color: '#8BAF8B', icon: '🍽️' }].map((p, i) => (
                  <View key={i} style={[s.placeCard, { borderColor: p.color + '30' }]}>
                    <View style={[s.placeIcon, { backgroundColor: p.color + '18' }]}>
                      <Text style={{ fontSize: 14 }}>{p.icon}</Text>
                    </View>
                    <Text style={[s.placeType, { color: p.color }]}>{p.type}</Text>
                    <Text style={s.placeName}>{p.name}</Text>
                    <View style={[s.bookBtn, { backgroundColor: p.color }]}>
                      <Text style={s.bookBtnTxt}>BOOK NOW</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* CTAs */}
            <TouchableOpacity onPress={() => navigation.navigate('Plan')} style={s.ctaPrimary}>
              <Text style={s.ctaPrimaryTxt}>PLAN YOUR ROUTE →</Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* STATS */}
      <View style={s.stats}>
        {[{ v: '18+', l: 'Places per route' }, { v: '4', l: 'Categories' }, { v: '1', l: 'App. Zero switching.' }, { v: '∞', l: 'Discoveries ahead' }].map((st, i) => (
          <View key={i} style={[s.stat, i < 3 && s.statBorder]}>
            <Text style={s.statVal}>{st.v}</Text>
            <Text style={s.statLbl}>{st.l}</Text>
          </View>
        ))}
      </View>

      {/* HOW IT WORKS */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>HOW IT WORKS</Text>
        <Text style={s.sectionTitle}>Three steps to your perfect road trip.</Text>
        {steps.map((item, i) => (
          <View key={i} style={s.stepCard}>
            <View style={[s.stepIcon, { backgroundColor: item.color + '18' }]}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.stepLabel, { color: item.color }]}>STEP {item.step}</Text>
              <Text style={s.stepTitle}>{item.title}</Text>
              <Text style={s.stepBody}>{item.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* FEATURES */}
      <View style={[s.section, { backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border }]}>
        <Text style={s.sectionLabel}>WHY ORION</Text>
        <Text style={s.sectionTitle}>Everything your road trip was missing.</Text>
        <View style={s.featuresGrid}>
          {features.map((item, i) => (
            <View key={i} style={s.featureCard}>
              <View style={[s.featureIcon, { backgroundColor: item.color + '18' }]}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              </View>
              <Text style={s.featureTitle}>{item.title}</Text>
              <Text style={s.featureBody}>{item.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* DARK CTA — matches web */}
      <View style={s.darkSection}>
        <View style={s.logoRowCenter}>
          <Logo />
          <Text style={s.logoTxtDark}>ORION</Text>
        </View>
        <Text style={s.darkTitle}>Your next road trip{'\n'}starts here.</Text>
        <Text style={s.darkSub}>No account needed. Just enter your route and discover everything along the way.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Plan')} style={s.darkBtn}>
          <Text style={s.darkBtnTxt}>PLAN YOUR ROUTE →</Text>
        </TouchableOpacity>
        <View style={s.darkFeatures}>
          {['No account needed', 'Free to use', 'Works across Europe', 'Real-time data'].map((item, i) => (
            <View key={i} style={s.darkFeatureItem}>
              <View style={s.darkFeatureDot} />
              <Text style={s.darkFeatureTxt}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* FOOTER */}
      <View style={s.footer}>
        <LogoDark />
        <Text style={s.footerTxt}>© 2026 Orion · oriontravel.app</Text>
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  // Hero
  hero: { backgroundColor: '#1A1A1A', padding: 24, paddingBottom: 40 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  logoTxt: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 6 },
  logoSub: { fontSize: 10, color: '#555', fontStyle: 'italic', marginBottom: 24, marginLeft: 36 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F7FF18', borderWidth: 1, borderColor: '#7BA7BC30', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 20 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7BA7BC' },
  badgeTxt: { fontSize: 10, color: '#7BA7BC', fontWeight: '600', letterSpacing: 2 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#fff', lineHeight: 40, letterSpacing: -0.5, marginBottom: 14 },
  heroSub: { fontSize: 14, color: '#888', lineHeight: 22, marginBottom: 24 },
  // Preview card
  previewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 24 },
  previewRoute: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F5F7', borderRadius: 10, padding: 10, marginBottom: 14 },
  previewDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A1A1A' },
  previewCity: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  previewArrow: { fontSize: 12, color: '#AEAEB2', marginHorizontal: 2 },
  previewDays: { marginLeft: 'auto', fontSize: 11, color: '#7BA7BC', fontWeight: '600' },
  previewDay: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  previewDayBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  previewNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#7BA7BC', alignItems: 'center', justifyContent: 'center' },
  previewNumTxt: { fontSize: 10, fontWeight: '700', color: '#fff' },
  previewDayTxt: { fontSize: 12, color: '#6E6E73', fontWeight: '500' },
  previewPlaces: { flexDirection: 'row', gap: 10, marginTop: 14 },
  placeCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E8E8E8' },
  placeIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  placeType: { fontSize: 8, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  placeName: { fontSize: 11, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  bookBtn: { borderRadius: 6, padding: 7, alignItems: 'center' },
  bookBtnTxt: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  // CTAs
  ctaPrimary: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  ctaPrimaryTxt: { color: '#1A1A1A', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  // Stats
  stats: { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  stat: { flex: 1, padding: 16, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: C.border },
  statVal: { fontSize: 22, fontWeight: '900', color: C.primary, marginBottom: 2 },
  statLbl: { fontSize: 9, color: C.hint, fontWeight: '500', textAlign: 'center', lineHeight: 13 },
  // Sections
  section: { padding: 32 },
  sectionLabel: { fontSize: 10, fontWeight: '600', color: C.hint, letterSpacing: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: C.primary, lineHeight: 30, letterSpacing: -0.5, marginBottom: 24 },
  // Steps
  stepCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20, backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border },
  stepIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 3 },
  stepTitle: { fontSize: 15, fontWeight: '800', color: C.primary, marginBottom: 4 },
  stepBody: { fontSize: 12, color: C.secondary, lineHeight: 18 },
  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { width: '47%', backgroundColor: C.bg, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: C.border },
  featureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featureTitle: { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 6, lineHeight: 18 },
  featureBody: { fontSize: 11, color: C.secondary, lineHeight: 16 },
  // Dark CTA
  darkSection: { backgroundColor: '#1A1A1A', padding: 48, alignItems: 'center' },
  logoRowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  logoTxtDark: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 6 },
  darkTitle: { fontSize: 36, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 42, letterSpacing: -0.5, marginBottom: 14 },
  darkSub: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  darkBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 36, marginBottom: 28 },
  darkBtnTxt: { color: '#1A1A1A', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  darkFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  darkFeatureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  darkFeatureDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#7BA7BC' },
  darkFeatureTxt: { fontSize: 11, color: '#555', fontWeight: '500' },
  // Footer
  footer: { backgroundColor: '#111', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerTxt: { fontSize: 11, color: '#444' },
})
