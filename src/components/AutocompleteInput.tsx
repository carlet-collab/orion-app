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
  const userLocRef = useRef<{lat: number, lng: number} | null>(null)

  // Get user location on mount for bias
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then(loc => {
          userLocRef.current = { lat: loc.coords.latitude, lng: loc.coords.longitude }
        }).catch(() => {})
      }
    })
  }, [])

  const fetchSuggestions = async (text: string) => {
    if (text.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    setLoading(true)
    try {
      const loc = userLocRef.current
      // location bias: 50km radius around user if we have location
      const locationParam = loc
        ? `&location=${loc.lat},${loc.lng}&radius=50000&strictbounds=false`
        : ''
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&types=establishment%7Cgeocode${locationParam}&key=${GOOGLE_MAPS_KEY}`
      )
      const data = await res.json()
      if (data.predictions) {
        setSuggestions(data.predictions)
        setShowSuggestions(true)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleChange = (text: string) => {
    onChangeText(text)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 350)
  }

  const handleSelect = (item: any) => {
    const address = item.description
    onChangeText(address)
    onSelect(address)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <View style={s.container}>
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
          onFocus={() => value.length > 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {loading && <ActivityIndicator size="small" color="#7BA7BC" style={s.spinner} />}
        {value.length > 0 && (
          <TouchableOpacity onPress={() => { onChangeText(''); setSuggestions([]); setShowSuggestions(false) }} style={s.clear}>
            <Text style={s.clearTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {showSuggestions && suggestions.length > 0 && (
        <View style={s.dropdown}>
          {suggestions.map((item, i) => (
            <TouchableOpacity key={item.place_id} onPress={() => handleSelect(item)}
              style={[s.suggestion, i < suggestions.length - 1 && s.suggestionBorder]}>
              <Text style={s.suggestionMain} numberOfLines={1}>
                {item.structured_formatting?.main_text || item.description}
              </Text>
              <Text style={s.suggestionSub} numberOfLines={1}>
                {item.structured_formatting?.secondary_text || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { zIndex: 999 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F7', borderRadius: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  input: { flex: 1, padding: 13, fontSize: 14, color: '#1A1A1A' },
  spinner: { paddingRight: 10 },
  clear: { paddingHorizontal: 12, paddingVertical: 13 },
  clearTxt: { fontSize: 12, color: '#AEAEB2', fontWeight: '600' },
  dropdown: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E8E8E8', marginTop: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 20 },
  suggestion: { paddingHorizontal: 14, paddingVertical: 12 },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F7' },
  suggestionMain: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  suggestionSub: { fontSize: 11, color: '#AEAEB2' },
})
