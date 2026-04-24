import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import * as Location from 'expo-location'

const C = { primary: '#1A1A1A', accent: '#7BA7BC', bg: '#FAFAFA', surface: '#FFFFFF', border: '#E8E8E8', hint: '#AEAEB2', secondary: '#6E6E73' }

const ROUTES = [
  {
    id: 'bohemian-dream',
    emoji: '🏰',
    title: 'Bohemian Dream',
    tagline: 'Medieval castles, baroque towns and Alpine lakes',
    origin: 'Prague, Czech Republic',
    destination: 'Salzburg, Austria',
    days: 3,
    km: '520 km',
    highlights: ['Český Krumlov', 'Linz Old Town', 'Salzburg Old City', 'Hohensalzburg Castle'],
    best_season: 'May – October',
    color: '#7BA7BC',
    tags: ['culture', 'castles', 'weekend'],
    country: 'CZ',
  },
  {
    id: 'prague-to-adriatic',
    emoji: '🌊',
    title: 'Prague to Adriatic',
    tagline: 'From Bohemia to the Croatian coast in 5 days',
    origin: 'Prague, Czech Republic',
    destination: 'Split, Croatia',
    days: 5,
    km: '1,450 km',
    highlights: ['Vienna', 'Ljubljana Old Town', 'Plitvice Lakes', 'Split Diocletian Palace'],
    best_season: 'June – September',
    color: '#7BBCB0',
    tags: ['coastal', 'culture', 'summer'],
    country: 'CZ',
  },
  {
    id: 'alpine-classic',
    emoji: '🏔️',
    title: 'Alpine Classic',
    tagline: 'The greatest mountain drive in Europe',
    origin: 'Munich, Germany',
    destination: 'Vienna, Austria',
    days: 4,
    km: '680 km',
    highlights: ['Neuschwanstein Castle', 'Innsbruck', 'Grossglockner Pass', 'Hallstatt'],
    best_season: 'June – September',
    color: '#9B8BB4',
    tags: ['mountains', 'scenic', 'nature'],
    country: 'DE',
  },
  {
    id: 'danube-grand-tour',
    emoji: '🏛️',
    title: 'Danube Grand Tour',
    tagline: 'Three capitals along Europe\'s greatest river',
    origin: 'Prague, Czech Republic',
    destination: 'Budapest, Hungary',
    days: 3,
    km: '530 km',
    highlights: ['Brno', 'Vienna Ringstrasse', 'Bratislava Castle', 'Budapest Parliament'],
    best_season: 'April – October',
    color: '#C4A882',
    tags: ['cities', 'culture', 'history'],
    country: 'CZ',
  },
  {
    id: 'coastal-croatia',
    emoji: '🌊',
    title: 'Coastal Croatia',
    tagline: 'The most beautiful coastline in the Mediterranean',
    origin: 'Split, Croatia',
    destination: 'Dubrovnik, Croatia',
    days: 3,
    km: '230 km',
    highlights: ['Trogir Old Town', 'Makarska Riviera', 'Pelješac Peninsula', 'Dubrovnik Old Walls'],
    best_season: 'June – September',
    color: '#7BA7BC',
    tags: ['coastal', 'summer', 'swimming'],
    country: 'HR',
  },
  {
    id: 'german-romantic-road',
    emoji: '🌿',
    title: 'German Romantic Road',
    tagline: 'Germany\'s most iconic drive through medieval towns',
    origin: 'Frankfurt, Germany',
    destination: 'Munich, Germany',
    days: 3,
    km: '460 km',
    highlights: ['Würzburg Residenz', 'Rothenburg ob der Tauber', 'Dinkelsbühl', 'Augsburg'],
    best_season: 'May – October',
    color: '#8BAF8B',
    tags: ['culture', 'history', 'scenic'],
    country: 'DE',
  },
  {
    id: 'tuscany-wine-route',
    emoji: '🍷',
    title: 'Tuscany Wine Route',
    tagline: 'Rolling hills, vineyards and Renaissance cities',
    origin: 'Florence, Italy',
    destination: 'Rome, Italy',
    days: 4,
    km: '380 km',
    highlights: ['Chianti wine region', 'Siena Piazza del Campo', 'Montalcino', 'Val d\'Orcia'],
    best_season: 'April – October',
    color: '#C97B7B',
    tags: ['wine', 'food', 'culture'],
    country: 'IT',
  },
  {
    id: 'swiss-alps-classic',
    emoji: '🏔️',
    title: 'Swiss Alps Classic',
    tagline: 'Lakes, peaks and chocolate box villages',
    origin: 'Zurich, Switzerland',
    destination: 'Geneva, Switzerland',
    days: 4,
    km: '320 km',
    highlights: ['Lucerne Chapel Bridge', 'Interlaken', 'Grindelwald', 'Montreux'],
    best_season: 'June – September',
    color: '#9B8BB4',
    tags: ['mountains', 'lakes', 'scenic'],
    country: 'CH',
  },
  {
    id: 'scottish-highlands',
    emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    title: 'Scottish Highlands',
    tagline: 'Wild landscapes and ancient castles at the edge of Europe',
    origin: 'Edinburgh, United Kingdom',
    destination: 'Inverness, United Kingdom',
    days: 3,
    km: '320 km',
    highlights: ['Loch Lomond', 'Glencoe Valley', 'Ben Nevis', 'Loch Ness'],
    best_season: 'May – September',
    color: '#7BA7BC',
    tags: ['nature', 'scenic', 'castles'],
    country: 'GB',
  },
  {
    id: 'italian-riviera',
    emoji: '🌊',
    title: 'Italian Riviera',
    tagline: 'Glamour, sea and the world\'s most scenic coastline',
    origin: 'Nice, France',
    destination: 'Cinque Terre, Italy',
    days: 4,
    km: '280 km',
    highlights: ['Monaco', 'Eze Village', 'Portofino', 'Cinque Terre villages'],
    best_season: 'May – September',
    color: '#7BBCB0',
    tags: ['coastal', 'glamour', 'food'],
    country: 'FR',
  },
]

const TAGS = ['All', 'coastal', 'mountains', 'culture', 'wine', 'nature', 'scenic', 'weekend']

export default function DiscoverScreen({ navigation }: any) {
  const [activeTag, setActiveTag] = useState('All')

  const filtered = activeTag === 'All'
    ? ROUTES
    : ROUTES.filter(r => r.tags.includes(activeTag))

  const useRoute = (r: any) => {
    navigation.navigate('Plan', {
      prefillOrigin: r.origin,
      prefillDestination: r.destination,
      prefillDays: r.days,
    })
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>DISCOVER ROUTES</Text>
          <Text style={s.headerSub}>10 iconic European road trips</Text>
        </View>
      </View>

      {/* Tag filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagScroll} contentContainerStyle={s.tagRow}>
        {TAGS.map(tag => (
          <TouchableOpacity
            key={tag}
            onPress={() => setActiveTag(tag)}
            style={[s.tag, activeTag === tag && s.tagActive]}
          >
            <Text style={[s.tagTxt, activeTag === tag && s.tagTxtActive]}>
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Routes */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {filtered.map((r, i) => (
          <View key={r.id} style={s.card}>
            {/* Card header */}
            <View style={[s.cardHeader, { backgroundColor: r.color + '15' }]}>
              <Text style={s.cardEmoji}>{r.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: r.color }]}>{r.title}</Text>
                <Text style={s.cardTagline}>{r.tagline}</Text>
              </View>
            </View>

            {/* Route */}
            <View style={s.routeRow}>
              <View style={s.routeDot} />
              <Text style={s.routeCity}>{r.origin.split(',')[0]}</Text>
              <Text style={s.routeArrow}>→</Text>
              <Text style={s.routeCity}>{r.destination.split(',')[0]}</Text>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={s.statVal}>{r.days}</Text>
                <Text style={s.statLbl}>days</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.stat}>
                <Text style={s.statVal}>{r.km}</Text>
                <Text style={s.statLbl}>distance</Text>
              </View>
              <View style={s.statDiv} />
              <View style={s.stat}>
                <Text style={s.statVal}>{r.best_season}</Text>
                <Text style={s.statLbl}>best time</Text>
              </View>
            </View>

            {/* Highlights */}
            <View style={s.highlights}>
              <Text style={s.highlightsLabel}>HIGHLIGHTS</Text>
              <View style={s.highlightRow}>
                {r.highlights.map((h, j) => (
                  <View key={j} style={[s.highlightChip, { borderColor: r.color + '40', backgroundColor: r.color + '10' }]}>
                    <Text style={[s.highlightTxt, { color: r.color }]}>{h}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={() => useRoute(r)}
              style={[s.cta, { backgroundColor: r.color }]}
            >
              <Text style={s.ctaTxt}>USE THIS ROUTE →</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backTxt: { fontSize: 22, color: C.primary },
  headerTitle: { fontSize: 13, fontWeight: '700', color: C.primary, letterSpacing: 3 },
  headerSub: { fontSize: 11, color: C.hint, marginTop: 2 },
  tagScroll: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  tagRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  tagActive: { backgroundColor: C.primary, borderColor: C.primary },
  tagTxt: { fontSize: 12, fontWeight: '600', color: C.secondary },
  tagTxtActive: { color: '#fff' },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: C.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  cardHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 36 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  cardTagline: { fontSize: 12, color: C.secondary, lineHeight: 17 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  routeCity: { fontSize: 13, fontWeight: '700', color: C.primary },
  routeArrow: { fontSize: 13, color: C.hint, flex: 1 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '700', color: C.primary },
  statLbl: { fontSize: 10, color: C.hint, marginTop: 2 },
  statDiv: { width: 1, backgroundColor: C.border, marginHorizontal: 8 },
  highlights: { paddingHorizontal: 16, paddingBottom: 14 },
  highlightsLabel: { fontSize: 9, fontWeight: '600', color: C.hint, letterSpacing: 2, marginBottom: 8 },
  highlightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  highlightChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  highlightTxt: { fontSize: 11, fontWeight: '600' },
  cta: { margin: 16, borderRadius: 12, padding: 14, alignItems: 'center' },
  ctaTxt: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
})
