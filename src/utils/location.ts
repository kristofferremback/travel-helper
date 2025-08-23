import type { Site, Place, SavedTrip, GeoPosition, ReverseMode } from '@/types'

/**
 * Calculate distance between two points using Haversine formula
 */
export function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000 // Earth's radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert Place object to Site format
 */
export function toSiteFromPlace(place: Place): Site {
  const anyPlace: any = place
  return {
    id: anyPlace.id || `${anyPlace.kind}:${anyPlace.name}`,
    name: anyPlace.name,
    latitude: anyPlace.latitude,
    longitude: anyPlace.longitude,
    type: anyPlace.kind,
    fullName: anyPlace.address || anyPlace.name,
  }
}

/**
 * Determine optimal trip endpoints based on user location and preferences
 */
export function computeEndpoints(
  trip: SavedTrip, 
  currentPos: GeoPosition | null, 
  mode: ReverseMode = 'smart'
) {
  const fromSite = toSiteFromPlace(trip.fromPlace)
  const toSite = toSiteFromPlace(trip.toPlace)
  
  if (mode === 'normal') return { fromSite, toSite, mode }
  if (mode === 'reversed') return { fromSite: toSite, toSite: fromSite, mode }
  
  // Smart mode: use closest location as starting point
  if (currentPos && fromSite.latitude != null && fromSite.longitude != null && 
      toSite.latitude != null && toSite.longitude != null) {
    const dFrom = distanceMeters(currentPos.lat, currentPos.lon, fromSite.latitude, fromSite.longitude)
    const dTo = distanceMeters(currentPos.lat, currentPos.lon, toSite.latitude, toSite.longitude)
    
    if (dFrom <= dTo) return { fromSite, toSite, mode: 'smart' as const }
    return { fromSite: toSite, toSite: fromSite, mode: 'smart' as const }
  }
  
  return { fromSite, toSite, mode: 'smart' as const }
}