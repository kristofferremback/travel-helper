import type { SavedTrip, Site, TripOptions } from '@/types'

/**
 * Create URL query parameters for trip planning
 */
export function createTripQueryParams(
  from: Site, 
  to: Site, 
  options: TripOptions,
  numTrips: number = 3
): URLSearchParams {
  const params = new URLSearchParams()
  params.set('fromLat', String(from.latitude))
  params.set('fromLon', String(from.longitude))
  params.set('toLat', String(to.latitude))
  params.set('toLon', String(to.longitude))
  params.set('num', String(numTrips))

  if (!options.useNow && options.when) {
    params.set('when', options.when)
    if (options.arriveBy) params.set('arriveBy', 'true')
  }

  return params
}

/**
 * Generate URL for running a saved trip
 */
export function createTripRunLink(trip: SavedTrip): string {
  const fromPlace = trip.fromPlace as any
  const toPlace = trip.toPlace as any
  const params = new URLSearchParams()
  
  params.set('fromName', fromPlace.name)
  params.set('fromLat', String(fromPlace.latitude))
  params.set('fromLon', String(fromPlace.longitude))
  params.set('fromKind', fromPlace.kind)
  if (fromPlace.id) params.set('fromId', String(fromPlace.id))

  params.set('toName', toPlace.name)
  params.set('toLat', String(toPlace.latitude))
  params.set('toLon', String(toPlace.longitude))
  params.set('toKind', toPlace.kind)
  if (toPlace.id) params.set('toId', String(toPlace.id))

  return `/?${params.toString()}`
}