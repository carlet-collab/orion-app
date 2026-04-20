export const GOOGLE_MAPS_KEY = 'AIzaSyBrTT7_GB3uM3Fp36xXAWvliWL4eM8PsxY'

export function getDirectionsUrl(origin: string, destination: string) {
  return `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_KEY}`
}

export function getPlacesUrl(lat: number, lng: number, type: string, radius: number) {
  return `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_KEY}`
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function decodePolyline(encoded: string): {latitude: number; longitude: number}[] {
  const points: {latitude: number; longitude: number}[] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let b, shift = 0, result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 })
  }
  return points
}

export function stripHtml(html: string): string {
  return html?.replace(/<[^>]*>/g, '') || ''
}

export const FILTERS = [
  { key: 'lodging', icon: '🏨', label: 'Hotels', color: '#7BA7BC', bookUrl: (name: string, vicinity: string) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(name + ' ' + vicinity)}&aid=YOUR_AID` },
  { key: 'restaurant', icon: '🍽️', label: 'Dining', color: '#8BAF8B', bookUrl: (name: string, vicinity: string) => `https://www.thefork.com/search#query=${encodeURIComponent(name + ' ' + vicinity)}` },
  { key: 'tourist_attraction', icon: '🎭', label: 'Sights', color: '#9B8BB4', bookUrl: (name: string, vicinity: string) => `https://www.viator.com/search/${encodeURIComponent(vicinity || name)}?pid=YOUR_VIATOR_PID` },
  { key: 'travel_agency', icon: '🎯', label: 'Tours', color: '#7BBCB0', bookUrl: (name: string, vicinity: string) => `https://www.getyourguide.com/s/?q=${encodeURIComponent(name + ' ' + vicinity)}&partner_id=YOUR_GYG_ID` },
]
