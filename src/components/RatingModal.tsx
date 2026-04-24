import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { supabase } from '../lib/supabase'
import { getSessionId } from '../lib/tracking'

const C = { primary: '#1A1A1A', accent: '#7BA7BC', bg: '#FAFAFA', surface: '#FFFFFF', border: '#E8E8E8', hint: '#AEAEB2', secondary: '#6E6E73' }

interface Props {
  visible: boolean
  onClose: () => void
  origin: string
  destination: string
  distanceKm: number
  durationMin: number
}

export default function RatingModal({ visible, onClose, origin, destination, distanceKm, durationMin }: Props) {
  const [rating, setRating] = useState(0)
  const [tip, setTip] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (rating === 0) return
    setSaving(true)
    try {
      const session_id = getSessionId()
      await supabase.from('orion_events').insert({
        session_id,
        event: 'route_rated',
        origin,
        destination,
        distance_km: distanceKm,
        duration_min: durationMin,
        filter: String(rating),
        place_name: tip || null,
        platform: 'ios',
        app_version: '1.0.0',
      })
      setSubmitted(true)
      setTimeout(() => {
        onClose()
        setSubmitted(false)
        setRating(0)
        setTip('')
      }, 1500)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />

          {submitted ? (
            <View style={s.thankYou}>
              <Text style={s.thankYouEmoji}>🎉</Text>
              <Text style={s.thankYouTitle}>Thanks for rating!</Text>
              <Text style={s.thankYouSub}>Your feedback helps improve Orion for everyone.</Text>
            </View>
          ) : (
            <>
              <Text style={s.title}>How was the drive?</Text>
              <View style={s.routeRow}>
                <View style={s.dot} />
                <Text style={s.routeTxt} numberOfLines={1}>{origin.split(',')[0]}</Text>
                <Text style={s.arrow}>→</Text>
                <Text style={s.routeTxt} numberOfLines={1}>{destination.split(',')[0]}</Text>
              </View>

              {/* Stars */}
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <TouchableOpacity key={i} onPress={() => setRating(i)} style={s.starBtn}>
                    <Text style={[s.star, { opacity: i <= rating ? 1 : 0.2 }]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.ratingLabel}>
                {rating === 0 ? 'Tap to rate' : rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Outstanding!'}
              </Text>

              {/* Tip */}
              <TextInput
                value={tip}
                onChangeText={setTip}
                placeholder="Leave a tip for other drivers... (optional)"
                placeholderTextColor={C.hint}
                style={s.tipInput}
                multiline
                maxLength={120}
              />
              <Text style={s.charCount}>{tip.length}/120</Text>

              {/* Submit */}
              <TouchableOpacity
                onPress={submit}
                disabled={rating === 0 || saving}
                style={[s.submitBtn, { opacity: rating === 0 ? 0.4 : 1, backgroundColor: rating > 0 ? C.accent : C.hint }]}
              >
                <Text style={s.submitTxt}>{saving ? 'SAVING...' : 'SUBMIT RATING'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={s.skipBtn}>
                <Text style={s.skipTxt}>Skip</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#E8E8E8', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F5F5F7', borderRadius: 12, padding: 12, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A1A1A' },
  routeTxt: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  arrow: { fontSize: 13, color: '#AEAEB2' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 48, color: '#F4C430' },
  ratingLabel: { fontSize: 14, color: '#6E6E73', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  tipInput: { backgroundColor: '#F5F5F7', borderRadius: 12, padding: 14, fontSize: 14, color: '#1A1A1A', minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E8E8E8' },
  charCount: { fontSize: 11, color: '#AEAEB2', textAlign: 'right', marginTop: 4, marginBottom: 16 },
  submitBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  submitTxt: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  skipBtn: { alignItems: 'center', padding: 8 },
  skipTxt: { fontSize: 13, color: '#AEAEB2' },
  thankYou: { alignItems: 'center', paddingVertical: 20 },
  thankYouEmoji: { fontSize: 48, marginBottom: 12 },
  thankYouTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  thankYouSub: { fontSize: 14, color: '#6E6E73', textAlign: 'center', lineHeight: 20 },
})
