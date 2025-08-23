import { renderHook } from '@testing-library/react'
import { useSavedTrips } from '@/hooks/useSavedTrips'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'

// Add this import for jest types
import type { MockedFunction } from 'jest-mock';

// Mock dependencies
const mockUseSWR = useSWR as unknown as MockedFunction<typeof useSWR>
const mockUseSession = useSession as unknown as MockedFunction<typeof useSession>

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('useSavedTrips', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty arrays when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      mutate: jest.fn(),
      isValidating: false,
    })

    const { result } = renderHook(() => useSavedTrips())

    expect(result.current.trips).toEqual([])
    expect(result.current.savedPlaces).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('returns trips and extracted places when session exists', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user1' } },
      status: 'authenticated',
      update: jest.fn(),
    })

    const mockTripsData = {
      trips: [
        {
          id: 'trip1',
          fromPlace: {
            kind: 'site',
            id: 'place1',
            name: 'Station A',
            latitude: 59.3293,
            longitude: 18.0686,
          },
          toPlace: {
            kind: 'site',
            id: 'place2',
            name: 'Station B',
            latitude: 59.3393,
            longitude: 18.0786,
          },
        },
      ],
    }

    mockUseSWR.mockReturnValue({
      data: mockTripsData,
      error: undefined,
      mutate: jest.fn(),
      isValidating: false,
    })

    const { result } = renderHook(() => useSavedTrips())

    expect(result.current.trips).toHaveLength(1)
    expect(result.current.savedPlaces).toHaveLength(2)
    expect(result.current.savedPlaces[0].name).toBe('Station A')
    expect(result.current.savedPlaces[1].name).toBe('Station B')
  })

  it('removes duplicate places', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user1' } },
      status: 'authenticated',
      update: jest.fn(),
    })

    const mockTripsData = {
      trips: [
        {
          id: 'trip1',
          fromPlace: {
            kind: 'site',
            name: 'Station A',
            latitude: 59.3293,
            longitude: 18.0686,
          },
          toPlace: {
            kind: 'site',
            name: 'Station B',
            latitude: 59.3393,
            longitude: 18.0786,
          },
        },
        {
          id: 'trip2',
          fromPlace: {
            kind: 'site',
            name: 'Station A', // Duplicate
            latitude: 59.3293,
            longitude: 18.0686,
          },
          toPlace: {
            kind: 'site',
            name: 'Station C',
            latitude: 59.3493,
            longitude: 18.0886,
          },
        },
      ],
    }

    mockUseSWR.mockReturnValue({
      data: mockTripsData,
      error: undefined,
      mutate: jest.fn(),
      isValidating: false,
    })

    const { result } = renderHook(() => useSavedTrips())

    expect(result.current.savedPlaces).toHaveLength(3) // A, B, C (no duplicate A)
    expect(result.current.savedPlaces.map((p) => p.name)).toEqual(['Station A', 'Station B', 'Station C'])
  })
})
