import { useMemo } from 'react'
import useSWR from 'swr'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import type { SavedTrip, Site } from '@/types'

const fetcher = (url: string) => axios.get(url).then((r) => r.data)

export function useSavedTrips() {
  const { data: session } = useSession()
  const { data: savedTripsData, mutate: mutateTrips } = useSWR(
    session ? '/api/saved-trips' : null, 
    fetcher
  )
  
  const trips: SavedTrip[] = useMemo(() => savedTripsData?.trips ?? [], [savedTripsData])
  
  const savedPlaces: Site[] = useMemo(() => {
    const places: Site[] = []
    for (const trip of trips) {
      const fromPlace: any = trip.fromPlace
      const toPlace: any = trip.toPlace
      
      if (fromPlace?.latitude && fromPlace?.longitude) {
        places.push({
          id: fromPlace.id || `${trip.id}:from`,
          name: fromPlace.name,
          latitude: fromPlace.latitude,
          longitude: fromPlace.longitude,
          type: fromPlace.kind,
          fullName: fromPlace.name
        })
      }
      
      if (toPlace?.latitude && toPlace?.longitude) {
        places.push({
          id: toPlace.id || `${trip.id}:to`,
          name: toPlace.name,
          latitude: toPlace.latitude,
          longitude: toPlace.longitude,
          type: toPlace.kind,
          fullName: toPlace.name
        })
      }
    }
    
    // Remove duplicates
    const seen = new Set<string>()
    return places.filter(place => {
      const key = `${place.name}:${place.latitude}:${place.longitude}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [trips])

  return {
    trips,
    savedPlaces,
    mutateTrips,
    isLoading: !savedTripsData && session
  }
}