import React, { useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Share } from 'react-native'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'

interface Props {
  visible: boolean
  onClose: () => void
  origin: string
  destination: string
  distance: string
  duration: string
  days?: number
}

export default function ShareCard({ visible, onClose, origin, destination, distance, duration, days }: Props) {
  const cardRef = useRef<ViewShot>(null)

  const handleShare = async () => {
    try {
      const uri = await cardRef.current?.capture?.()
      if (!uri) return
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${origin} → ${destination}`,
        })
      }
    } catch (e) {
      console.error(e)
      // Fallback to text share
      await Share.share({
        message: `Just planned ${origin} → ${destination} on Orion — the road trip app that finds hotels, restaurants and attractions along your exact route.\n\noriontravel.app`,
        title: `${origin} → ${destination}`,
      })
    }
  }

  const originCity = origin.split(',')[0]
  const destCity = destination.split(',')[0]

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.container}>

          {/* The card that gets captured as image */}
          <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
            <View style={s.card}>
              {/* Header */}
              <View style={s.cardHeader}>
                <View style={s.logoRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }} />
                    <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: '#fff' }} />
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }} />
                  </View>
                  <Text style={s.logoTxt}>ORION</Text>
                </View>
                <Text style={s.headerSub}>Road Trip Planned</Text>
              </View>

              {/* Route */}
              <View style={s.cardBody}>
                <Text style={s.cityFrom}>{originCity}</Text>
                <View style={s.routeLine}>
                  <View style={s.routeDot} />
                  <View style={s.routeTrack} />
                  <Text style={s.routeIcon}>🧭</Text>
                  <View style={s.routeTrack} />
                  <View style={[s.routeDot, { backgroundColor: '#7BA7BC' }]} />
                </View>
                <Text style={s.cityTo}>{destCity}</Text>

                {/* Stats */}
                <View style={s.statsRow}>
                  <View style={s.stat}>
                    <Text style={s.statVal}>{distance}</Text>
                    <Text style={s.statLbl}>DISTANCE</Text>
                  </View>
                  <View style={s.statDiv} />
                  <View style={s.stat}>
                    <Text style={s.statVal}>{duration}</Text>
                    <Text style={s.statLbl}>DRIVE TIME</Text>
                  </View>
                  {days && days > 1 && (
                    <>
                      <View style={s.statDiv} />
                      <View style={s.stat}>
                        <Text style={s.statVal}>{days}</Text>
                        <Text style={s.statLbl}>DAYS</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Features */}
                <View style={s.features}>
                  {[
                    { icon: '🏨', label: 'Hotels along route' },
                    { icon: '🍽️', label: 'Restaurants on the way' },
                    { icon: '🎭', label: 'Sights & attractions' },
                  ].map((f, i) => (
                    <View key={i} style={s.featureRow}>
                      <Text style={s.featureIcon}>{f.icon}</Text>
                      <Text style={s.featureTxt}>{f.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Footer */}
              <View style={s.cardFooter}>
                <Text style={s.footerTxt}>oriontravel.app</Text>
                <Text style={s.footerSub}>Hotels, restaurants, attractions — all on your way.</Text>
              </View>
            </View>
          </ViewShot>

          {/* Actions */}
          <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
            <Text style={s.shareBtnTxt}>📤 SHARE THIS TRIP</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeTxt}>Close</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { width: '100%', alignItems: 'center' },
  card: { width: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#1A1A1A' },
  cardHeader: { backgroundColor: '#1A1A1A', padding: 20, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  logoTxt: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 6 },
  headerSub: { fontSize: 11, color: '#555', fontStyle: 'italic', marginLeft: 34 },
  cardBody: { backgroundColor: '#fff', padding: 24 },
  cityFrom: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  routeLine: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A1A1A' },
  routeTrack: { flex: 1, height: 1, backgroundColor: '#E8E8E8' },
  routeIcon: { fontSize: 20, marginHorizontal: 8 },
  cityTo: { fontSize: 28, fontWeight: '900', color: '#7BA7BC', letterSpacing: -0.5, marginBottom: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: '#F5F5F7', borderRadius: 16, padding: 16, marginBottom: 20 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 3 },
  statLbl: { fontSize: 8, color: '#AEAEB2', fontWeight: '600', letterSpacing: 1 },
  statDiv: { width: 1, backgroundColor: '#E8E8E8', marginHorizontal: 8 },
  features: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { fontSize: 16 },
  featureTxt: { fontSize: 13, color: '#6E6E73', fontWeight: '500' },
  cardFooter: { backgroundColor: '#1A1A1A', padding: 16, alignItems: 'center' },
  footerTxt: { fontSize: 13, fontWeight: '700', color: '#7BA7BC', letterSpacing: 2 },
  footerSub: { fontSize: 10, color: '#444', marginTop: 3 },
  shareBtn: { backgroundColor: '#7BA7BC', borderRadius: 14, padding: 16, alignItems: 'center', width: '100%', marginTop: 16 },
  shareBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  closeBtn: { padding: 16, alignItems: 'center' },
  closeTxt: { color: '#888', fontSize: 14 },
})
