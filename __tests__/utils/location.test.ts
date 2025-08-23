import { distanceMeters, toSiteFromPlace, computeEndpoints } from '@/utils/location'
import type { SavedTrip, GeoPosition } from '@/types'

describe('location utilities', () => {
  describe('distanceMeters', () => {
    it('calculates distance between Stockholm and Gothenburg', () => {
      const stockholmLat = 59.3293
      const stockholmLon = 18.0686
      const gothenburgLat = 57.7089
      const gothenburgLon = 11.9746
      
      const distance = distanceMeters(stockholmLat, stockholmLon, gothenburgLat, gothenburgLon)
      
      // Should be approximately 398km
      expect(distance).toBeGreaterThan(390000)
      expect(distance).toBeLessThan(410000)
    })

    it('returns 0 for same coordinates', () => {
      const distance = distanceMeters(59.3293, 18.0686, 59.3293, 18.0686)
      expect(distance).toBe(0)
    })
  })

  describe('toSiteFromPlace', () => {
    it('converts site place to site format', () => {
      const place = {
        kind: 'site' as const,
        id: 'site123',
        name: 'Central Station',
        latitude: 59.3293,
        longitude: 18.0686,
        type: 'station'
      }

      const site = toSiteFromPlace(place)

      expect(site).toEqual({
        id: 'site123',
        name: 'Central Station',
        latitude: 59.3293,
        longitude: 18.0686,
        type: 'site',
        fullName: 'Central Station'
      })
    })

    it('converts address place to site format', () => {
      const place = {
        kind: 'address' as const,
        name: 'Home',
        address: '123 Main St, Stockholm',
        latitude: 59.3293,
        longitude: 18.0686
      }

      const site = toSiteFromPlace(place)

      expect(site).toEqual({
        id: 'address:Home',
        name: 'Home',
        latitude: 59.3293,
        longitude: 18.0686,
        type: 'address',
        fullName: '123 Main St, Stockholm'
      })
    })
  })

  describe('computeEndpoints', () => {
    const mockTrip: SavedTrip = {
      id: 'trip1',
      fromPlace: {
        kind: 'site',
        id: 'from1',
        name: 'Station A',
        latitude: 59.3293,
        longitude: 18.0686
      },
      toPlace: {
        kind: 'site',
        id: 'to1',
        name: 'Station B',
        latitude: 59.3393,
        longitude: 18.0786
      }
    }

    it('returns normal order for normal mode', () => {
      const result = computeEndpoints(mockTrip, null, 'normal')
      
      expect(result.mode).toBe('normal')
      expect(result.fromSite.name).toBe('Station A')
      expect(result.toSite.name).toBe('Station B')
    })

    it('returns reversed order for reversed mode', () => {
      const result = computeEndpoints(mockTrip, null, 'reversed')
      
      expect(result.mode).toBe('reversed')
      expect(result.fromSite.name).toBe('Station B')
      expect(result.toSite.name).toBe('Station A')
    })

    it('chooses closest station for smart mode', () => {
      const currentPos: GeoPosition = {
        lat: 59.3393, // Closer to Station B
        lon: 18.0786
      }
      
      const result = computeEndpoints(mockTrip, currentPos, 'smart')
      
      expect(result.mode).toBe('smart')
      expect(result.fromSite.name).toBe('Station B') // Closest becomes from
      expect(result.toSite.name).toBe('Station A')
    })
  })
})