import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native'
import { saveRoute } from '../lib/tracking'
import { signInWithGoogle, signInWithApple, saveUserProfile, getCurrentUser } from '../lib/auth'

const C = { primary: '#1A1A1A', accent: '#7BA7BC', bg: '#FAFAFA', surface: '#FFFFFF', border: '#E8E8E8', hint: '#AEAEB2', secondary: '#6E6E73' }

interface Props {
  visible: boolean
  onClose: () => void
  onSaved: () => void
  routeParams: {
    origin: string
    destination: string
    distance_text: string
    duration_text: string
    total_m: number
    plan_by_day: boolean
    limit_type: string
    limit_value: number
  }
}

export default function SaveRouteModal({ visible, onClose, onSaved, routeParams }: Props) {
  const [loading, setLoading] = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)

  const handleSaveAnonymous = async () => {
    setLoading(true)
    const ok = await saveRoute(routeParams)
    setLoading(false)
    if (ok) { onSaved(); onClose() }
    else Alert.alert('Error', 'Could not save route. Please try again.')
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    const result = await signInWithGoogle()
    if (result.success) {
      const user = await getCurrentUser()
      if (user) {
        await saveUserProfile(user, consentMarketing)
        await saveRoute({ ...routeParams })
        onSaved()
        onClose()
      }
    } else {
      Alert.alert('Sign in failed', result.error || 'Please try again.')
    }
    setLoading(false)
  }

  const handleAppleSignIn = async () => {
    setLoading(true)
    const result = await signInWithApple()
    if (result.success) {
      const user = await getCurrentUser()
      if (user) {
        await saveUserProfile(user, consentMarketing)
        await saveRoute({ ...routeParams })
        onSaved()
        onClose()
      }
    } else {
      Alert.alert('Sign in failed', result.error || 'Please try again.')
    }
    setLoading(false)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <Text style={s.title}>Save this route</Text>
          <Text style={s.subtitle}>Sign in to save across devices and get personalised suggestions.</Text>

          {/* Route preview */}
          <View style={s.routePreview}>
            <View style={s.routeRow}>
              <View style={s.dot} />
              <Text style={s.routeTxt} numberOfLines={1}>{routeParams.origin}</Text>
            </View>
            <View style={s.routeLine} />
            <View style={s.routeRow}>
              <View style={[s.dot, { backgroundColor: C.accent }]} />
              <Text style={s.routeTxt} numberOfLines={1}>{routeParams.destination}</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={C.accent} size="large" style={{ marginVertical: 24 }} />
          ) : (
            <>
              {/* Google Sign In */}
              <TouchableOpacity onPress={handleGoogleSignIn} style={s.googleBtn}>
                <Text style={s.googleIcon}>G</Text>
                <Text style={s.googleTxt}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Apple Sign In */}
              <TouchableOpacity onPress={handleAppleSignIn} style={s.appleBtn}>
                <Text style={s.appleIcon}></Text>
                <Text style={s.appleTxt}>Continue with Apple</Text>
              </TouchableOpacity>

              {/* Marketing consent */}
              <TouchableOpacity onPress={() => setConsentMarketing(v => !v)} style={s.consentRow}>
                <View style={[s.checkbox, consentMarketing && { backgroundColor: C.accent, borderColor: C.accent }]}>
                  {consentMarketing && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.consentTxt}>Send me travel tips and route suggestions by email</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={s.dividerRow}>
                <View style={s.divider} />
                <Text style={s.dividerTxt}>or</Text>
                <View style={s.divider} />
              </View>

              {/* Save without account */}
              <TouchableOpacity onPress={handleSaveAnonymous} style={s.anonBtn}>
                <Text style={s.anonTxt}>Save on this device only</Text>
              </TouchableOpacity>

              <Text style={s.gdpr}>
                By signing in you agree to our{' '}
                <Text style={{ color: C.accent }}>Privacy Policy</Text>.
                {' '}We never sell your data.
              </Text>
            </>
          )}

          {/* Close */}
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeTxt}>Not now</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: C.primary, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: C.secondary, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  routePreview: { backgroundColor: C.bg, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeLine: { width: 1, height: 8, backgroundColor: C.border, marginLeft: 3, marginVertical: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  routeTxt: { fontSize: 13, fontWeight: '600', color: C.primary, flex: 1 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: C.border, marginBottom: 10 },
  googleIcon: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  googleTxt: { fontSize: 14, fontWeight: '600', color: C.primary },
  appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.primary, borderRadius: 12, padding: 14, marginBottom: 16 },
  appleIcon: { fontSize: 16, color: '#fff' },
  appleTxt: { fontSize: 14, fontWeight: '600', color: '#fff' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkmark: { fontSize: 12, color: '#fff', fontWeight: '700' },
  consentTxt: { fontSize: 12, color: C.secondary, flex: 1, lineHeight: 17 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  divider: { flex: 1, height: 1, backgroundColor: C.border },
  dividerTxt: { fontSize: 11, color: C.hint },
  anonBtn: { borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  anonTxt: { fontSize: 13, fontWeight: '600', color: C.secondary },
  gdpr: { fontSize: 11, color: C.hint, textAlign: 'center', lineHeight: 16, marginBottom: 10 },
  closeBtn: { alignItems: 'center', padding: 8 },
  closeTxt: { fontSize: 13, color: C.hint },
})
