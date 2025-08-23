// Core location and place types
export type Site = {
  id: string
  name: string
  latitude?: number
  longitude?: number
  type: string
  fullName?: string
}

export type PlaceSite = {
  kind: 'site'
  id: string
  name: string
  latitude: number
  longitude: number
  type?: string
}

export type PlaceAddress = {
  kind: 'address'
  name: string
  address: string
  latitude: number
  longitude: number
}

export type Place = PlaceSite | PlaceAddress

// Trip types
export type SavedTrip = {
  id: string
  label?: string | null
  fromPlace: Place
  toPlace: Place
  pinned?: boolean
  position?: number | null
}

// Journey and route types
export type TripLeg = {
  origin: {
    name: string
    planned?: string
    estimated?: string
  }
  destination: {
    name: string
    planned?: string
    estimated?: string
  }
  mode?: string
  line?: string | number
}

export type Journey = {
  slPreferredOrder: number
  duration?: number
  legs: TripLeg[]
  isFromMainQuery?: boolean
  isPreceding?: boolean
}

// UI and state types
export type GeoPosition = {
  lat: number
  lon: number
}

export type ReverseMode = 'smart' | 'normal' | 'reversed'

export type TripOptions = {
  useNow: boolean
  when: string
  arriveBy: boolean
}