import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'
import { GOOGLE_MAPS_KEY } from '../lib/maps'

interface Props {
  value: string
  onChangeText: (text: string) => void
  onSelect: (address: string) => void
  placeholder: string
}

export default function AutocompleteInput({ value, onChangeText, onSelect, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<any>(null)
  const userLocRef = useRef<{ lat: number, lng: number } | null>(null)

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then(loc => { userLocRef.current = { lat: loc.coords.latitude, lng: loc.coords.longitude } })
          .catch(() => {})
      }
    })
  }, [])

  const fetchSuggestions = async (text: string) => {
    if (text.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    setLoading(true)
    try {
      const loc = userLocRef.current
      // Soft bias toward user location — 500km radius — does NOT restrict results globally
      // geocode type covers: streets, cities, countries, addresses — everything
      const locationParam = loc ? `&location=${loc.lat},${loc.lng}&radius=500000` : ''
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&types=geocode${locationParam}&key=${GOOGLE_MAPS_KEY}&language=en`
      const res = await fetch(url)
      const data = await res.json()
      setSuggestions(data.predictions || [])
      setShowSuggestions((data.predictions || []).length > 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleChange = (text: string) => {
    onChangeText(text)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300)
  }

  const handleSelect = (item: any) => {
    onChangeText(item.description)
    onSelect(item.description)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <View>
      <View style={s.inputRow}>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#AEAEB2"
          style={s.input}
          returnKeyType="done"
          autoCorrect={false}
          autoCapitalize="words"
          onFocus={() => { if (value.length > 1) fetchSuggestions(value) }}
          onBlur={() => setTimeout(() => { setSuggestions([]); setShowSuggestions(false) }, 200)}
        />
        {loading && <ActivityIndicator size="small" color="#7BA7BC" style={{ paddingRight: 10 }} />}
        {!loading && value.length > 0 && (
          <TouchableOpacity onPress={() => { onChangeText(''); setSuggestions([]); setShowSuggestions(false) }} style={s.clear}>
            <Text style={s.clearTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {showSuggestions && suggestions.length > 0 && (
        <View style={s.dropdown}>
          {suggestions.slice(0, 5).map((item, i) => (
            <TouchableOpacity
              key={item.place_id}
              onPress={() => handleSelect(item)}
              style={[s.row, i < Math.min(suggestions.length, 5) - 1 && s.rowBorder]}
            >
              <Text style={s.main}>{item.structured_formatting?.main_text || item.description}</Text>
              {!!item.structured_formatting?.secondary_text && (
                <Text style={s.sub} numberOfLines={1}>{item.structured_formatting.secondary_text}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F7', borderRadius: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  input: { flex: 1, padding: 13, fontSize: 14, color: '#1A1A1A' },
  clear: { paddingHorizontal: 12, paddingVertical: 13 },
  clearTxt: { fontSize: 12, color: '#AEAEB2', fontWeight: '600' },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E8E8E8', marginTop: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  row: { paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  main: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  sub: { fontSize: 11, color: '#AEAEB2' },
})
