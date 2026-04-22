import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, SafeAreaView } from 'react-native'
import { supabase } from '../lib/supabase'
import { getSessionId } from '../lib/tracking'

const C = { primary: '#1A1A1A', accent: '#7BA7BC', bg: '#FAFAFA', surface: '#FFFFFF', border: '#E8E8E8', hint: '#AEAEB2', secondary: '#6E6E73' }

export default function MyRoutesScreen({ navigation }: any) {
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      const session_id = await getSessionId()
      const { data } = await supabase
        .from('user_routes')
        .select('*')
        .eq('session_id', session_id)
        .order('saved_at', { ascending: false })
      setRoutes(data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const deleteRoute = (id: string) => {
    Alert.alert('Delete route', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('user_routes').delete().eq('id', id)
          setRoutes(r => r.filter(r => r.id !== id))
        }
      }
    ])
  }

  const openRoute = (r: any) => {
    navigation.navigate('Route', {
      origin: r.origin,
      destination: r.destination,
      planByDay: r.plan_by_day || false,
      limitType: r.limit_type || 'hours',
      limitValue: r.limit_value || 8,
    })
  }

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  )

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>MY ROUTES</Text>
        <View style={{ width: 40 }} />
      </View>

      {routes.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🗺️</Text>
          <Text style={s.emptyTitle}>No saved routes yet</Text>
          <Text style={s.emptyBody}>Plan a route and tap 💾 SAVE to keep it here.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Plan')} style={s.ctaBtn}>
            <Text style={s.ctaBtnTxt}>PLAN A ROUTE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <Text style={s.count}>{routes.length} saved route{routes.length !== 1 ? 's' : ''}</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openRoute(item)} style={s.routeCard}>
              <View style={s.routeMain}>
                <View style={s.routeRow}>
                  <View style={s.dot8} />
                  <Text style={s.routeCity}>{item.origin}</Text>
                </View>
                <View style={s.routeLine} />
                <View style={s.routeRow}>
                  <View style={[s.dot8, { backgroundColor: C.accent }]} />
                  <Text style={s.routeCity}>{item.destination}</Text>
                </View>
              </View>
              <View style={s.routeMeta}>
                {!!item.distance_text && <Text style={s.metaTxt}>📍 {item.distance_text}</Text>}
                {!!item.duration_text && <Text style={s.metaTxt}>⏱ {item.duration_text}</Text>}
              </View>
              <View style={s.routeFooter}>
                <Text style={s.routeDate}>
                  {new Date(item.saved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <View style={s.routeActions}>
                  <TouchableOpacity onPress={() => openRoute(item)} style={s.openBtn}>
                    <Text style={s.openBtnTxt}>OPEN →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteRoute(item.id)} style={s.deleteBtn}>
                    <Text style={s.deleteBtnTxt}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 22, color: C.primary },
  headerTitle: { fontSize: 12, fontWeight: '700', color: C.primary, letterSpacing: 3 },
  count: { fontSize: 12, color: C.hint, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  routeCard: { backgroundColor: C.surface, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  routeMain: { marginBottom: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeLine: { width: 1, height: 10, backgroundColor: C.border, marginLeft: 3, marginVertical: 4 },
  dot8: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  routeCity: { fontSize: 15, fontWeight: '700', color: C.primary, flex: 1 },
  routeMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaTxt: { fontSize: 11, color: C.hint },
  routeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  routeDate: { fontSize: 11, color: C.hint },
  routeActions: { flexDirection: 'row', gap: 8 },
  openBtn: { backgroundColor: C.primary, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14 },
  openBtnTxt: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  deleteBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  deleteBtnTxt: { fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.primary, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 13, color: C.secondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  ctaBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28 },
  ctaBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
})
