"use client"

import React, { useEffect, useState } from 'react'
import type { Site, Journey, TripOptions } from '@/types'
import { createTripQueryParams } from '@/utils/api'
import { formatTime, formatLocalTime } from '@/utils/time'
import ModeBadge, { LineBadge } from '@/components/ModeBadge'
import { Button } from '@/components/ui'

interface DestinationTripsProps {
  from: Site
  dest: Site
  options: TripOptions
  extraActions?: React.ReactNode
}

export default function DestinationTrips({ 
  from, 
  dest, 
  options,
  extraActions 
}: DestinationTripsProps) {
  const [expanded, setExpanded] = useState(false)
  const [trips, setTrips] = useState<Journey[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    
    async function fetchTrips() {
      if (!from?.latitude || !from?.longitude || !dest?.latitude || !dest?.longitude) return
      
      setLoading(true)
      try {
        // Get main trips
        const params = createTripQueryParams(from, dest, options, 3)
        const response = await fetch(`/api/trips?${params.toString()}`)
        const data = await response.json()
        let journeys: Journey[] = Array.isArray(data?.journeys) ? data.journeys : []
        
        journeys = journeys.map((j, index) => ({ ...j, isFromMainQuery: true }))

        // Get additional trips for context
        let additional: Journey[] = []
        
        if (options.useNow && !options.arriveBy && journeys.length >= 1) {
          additional = await fetchAdditionalTripsForNow(journeys, params)
        } else if (!options.useNow && options.when) {
          additional = await fetchSurroundingTrips(params, options)
        }

        const allTrips = [...journeys, ...additional]
        const processed = processAndFilterTrips(allTrips, options.useNow)
        
        if (!cancelled) setTrips(processed)
      } catch (error) {
        console.error('Failed to fetch trips:', error)
        if (!cancelled) setTrips([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTrips()
    return () => { cancelled = true }
  }, [from?.latitude, from?.longitude, dest?.latitude, dest?.longitude, options.useNow, options.when, options.arriveBy])

  const preferred = getPreferredTrip(trips, options.useNow)
  const firstDepart = preferred?.legs?.[0]?.origin
  const firstArrive = preferred?.legs?.[preferred?.legs?.length - 1]?.destination

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{from?.name} → {dest.name}</div>
          {preferred ? (
            <div className="text-sm text-gray-700">
              {formatTime(firstDepart?.estimated || firstDepart?.planned)} →{' '}
              {formatTime(firstArrive?.estimated || firstArrive?.planned)} · {Math.round((preferred.duration ?? 0) / 60)}{' '}
              min
            </div>
          ) : loading ? (
            <div className="text-sm text-violet-300">Loading routes…</div>
          ) : (
            <div className="text-sm text-violet-400/60">No routes found</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {trips && trips.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <>
                  <span className="text-xs">✨</span>
                  <span>Collapse</span>
                  <svg className="w-3 h-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span className="text-xs">🚀</span>
                  <span>Explore more</span>
                  <svg className="w-3 h-3 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      {expanded && trips && trips.length > 0 && (
        <TripsList 
          trips={trips.slice(0, 5)} 
          preferred={preferred}
          active={active}
          onSetActive={setActive}
        />
      )}
    </div>
  )
}

// Helper components and functions
function TripsList({ 
  trips, 
  preferred, 
  active, 
  onSetActive 
}: {
  trips: Journey[]
  preferred: Journey | undefined
  active: number | null
  onSetActive: (index: number | null) => void
}) {
  return (
    <ol className="mt-2 space-y-2">
      {trips.map((journey, i) => {
        const depart = journey.legs?.[0]?.origin
        const arrive = journey.legs?.[journey.legs.length - 1]?.destination
        const isActive = active === i
        const isPreferred = journey === preferred
        
        return (
          <li key={i} className="text-sm">
            <button 
              className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center justify-between group ${
                isPreferred 
                  ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-400/30 hover:from-violet-500/30 hover:to-fuchsia-500/30' 
                  : 'hover:bg-white/20'
              }`} 
              onClick={() => onSetActive(isActive ? null : i)}
            >
              <div className="flex items-center gap-2">
                <span>
                  {formatTime(depart?.estimated || depart?.planned)} → {formatTime(arrive?.estimated || arrive?.planned)} ·{' '}
                  {Math.round((journey.duration ?? 0) / 60)} min
                </span>
                {isPreferred && (
                  <span className="text-xs bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white px-2 py-0.5 rounded-full font-medium">
                    ⭐ Recommended
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-violet-300 group-hover:text-white transition-colors duration-200">
                <span className="text-xs">Details</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isActive && (
              <div className="mt-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                <ol className="space-y-2 text-xs">
                  {journey.legs?.map((leg, k) => (
                    <li key={k} className="flex items-center gap-2 flex-wrap">
                      <ModeBadge mode={leg.mode} />
                      <span className="text-white flex-1 min-w-0">
                        {leg.origin?.name} ({formatTime(leg.origin?.estimated || leg.origin?.planned)}) →{' '}
                        {leg.destination?.name} ({formatTime(leg.destination?.estimated || leg.destination?.planned)})
                      </span>
                      <LineBadge mode={leg.mode} line={leg.line} />
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

// Helper functions
async function fetchAdditionalTripsForNow(journeys: Journey[], baseParams: URLSearchParams): Promise<Journey[]> {
  const additional: Journey[] = []
  
  // Get later trips
  const lastFirstLeg = journeys[journeys.length - 1]?.legs?.[0]
  const whenLast = lastFirstLeg?.origin?.estimated || lastFirstLeg?.origin?.planned
  if (whenLast) {
    const laterTrips = await fetchTripsFromTime(baseParams, whenLast, 1)
    additional.push(...laterTrips)
  }

  // Get earlier trips  
  const firstFirstLeg = journeys[0]?.legs?.[0]
  const whenFirst = firstFirstLeg?.origin?.estimated || firstFirstLeg?.origin?.planned
  if (whenFirst) {
    const earlierTrips = await fetchTripsFromTime(baseParams, whenFirst, -15, 3)
    additional.unshift(...earlierTrips)
  }

  return additional
}

async function fetchSurroundingTrips(baseParams: URLSearchParams, options: TripOptions): Promise<Journey[]> {
  try {
    const [datePart, timePart] = options.when.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    
    const selectedTime = new Date(year, month - 1, day, hour, minute)
    const earlierTime = new Date(selectedTime.getTime() - 15 * 60 * 1000)
    const laterTime = new Date(selectedTime.getTime() + 30 * 60 * 1000)
    
    const [earlierTrips, laterTrips] = await Promise.all([
      fetchTripsAtTime(baseParams, earlierTime, options.arriveBy, 2),
      fetchTripsAtTime(baseParams, laterTime, options.arriveBy, 2)
    ])
    
    return [...earlierTrips, ...laterTrips]
  } catch (error) {
    console.error('Failed to get surrounding trips:', error)
    return []
  }
}

async function fetchTripsFromTime(
  baseParams: URLSearchParams, 
  timeString: string, 
  minuteOffset: number,
  numTrips: number = 2
): Promise<Journey[]> {
  const time = new Date(timeString)
  if (Number.isNaN(time.getTime())) return []
  
  time.setMinutes(time.getMinutes() + minuteOffset)
  return fetchTripsAtTime(baseParams, time, false, numTrips)
}

async function fetchTripsAtTime(
  baseParams: URLSearchParams,
  time: Date,
  arriveBy: boolean,
  numTrips: number
): Promise<Journey[]> {
  const params = new URLSearchParams(baseParams)
  params.set('when', formatLocalTime(time))
  params.set('num', String(numTrips))
  if (arriveBy) params.set('arriveBy', 'true')
  
  try {
    const response = await fetch(`/api/trips?${params.toString()}`)
    const data = await response.json()
    return Array.isArray(data?.journeys) 
      ? data.journeys.map((j: any) => ({ ...j, isFromMainQuery: false }))
      : []
  } catch {
    return []
  }
}


function processAndFilterTrips(trips: Journey[], useNow: boolean): Journey[] {
  // Sort trips chronologically
  const sorted = trips.sort((a, b) => {
    const aDept = a.legs?.[0]?.origin?.estimated || a.legs?.[0]?.origin?.planned
    const bDept = b.legs?.[0]?.origin?.estimated || b.legs?.[0]?.origin?.planned
    
    if (aDept && bDept) {
      const aTime = new Date(aDept).getTime()
      const bTime = new Date(bDept).getTime()
      if (aTime !== bTime) return aTime - bTime
    }
    
    if (a.isFromMainQuery !== b.isFromMainQuery) {
      return a.isFromMainQuery ? -1 : 1
    }
    return (a.slPreferredOrder || 0) - (b.slPreferredOrder || 0)
  })

  // Remove duplicates
  const seen = new Set<string>()
  const unique = sorted.filter(journey => {
    const firstLeg = journey?.legs?.[0]
    const lastLeg = journey?.legs?.[journey?.legs?.length - 1]
    const departTime = firstLeg?.origin?.estimated || firstLeg?.origin?.planned || ''
    const arriveTime = lastLeg?.destination?.estimated || lastLeg?.destination?.planned || ''
    const duration = journey.duration || 0
    const lines = journey.legs
      ?.map(l => l.line || '')
      .filter(Boolean)
      .join('|') || ''
    
    const departDate = new Date(departTime)
    const roundedDepart = new Date(Math.round(departDate.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000))
    const key = `${roundedDepart.getTime()}_${arriveTime}_${duration}_${lines}`
    
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Filter for "leave now" mode
  if (useNow) {
    const now = new Date()
    const withTimes = unique.map(j => {
      const dt = j?.legs?.[0]?.origin?.estimated || j?.legs?.[0]?.origin?.planned || ''
      const dnum = dt ? new Date(dt).getTime() : Number.POSITIVE_INFINITY
      return { j, dnum }
    })
    
    const preceding = withTimes.filter(x => Number.isFinite(x.dnum) && x.dnum < now.getTime()).map(x => x.j)
    const future = withTimes.filter(x => !Number.isFinite(x.dnum) || x.dnum >= now.getTime()).map(x => x.j)
    
    const precedingTail = preceding.slice(-1)
    const futureHead = future.slice(0, 3)
    let combined = precedingTail.concat(futureHead)
    
    if (combined.length < 4) {
      combined = combined.concat(future.slice(futureHead.length, 4 - combined.length + futureHead.length)).slice(0, 4)
    } else {
      combined = combined.slice(0, 4)
    }
    
    return combined
  }

  return unique.slice(0, 5)
}

function getPreferredTrip(trips: Journey[] | null, useNow: boolean): Journey | undefined {
  if (!Array.isArray(trips) || trips.length === 0) return undefined
  
  if (useNow) {
    const now = new Date()
    const preferred = trips.find(t => {
      const dt = t?.legs?.[0]?.origin?.estimated || t?.legs?.[0]?.origin?.planned
      if (!dt) return false
      const d = new Date(dt)
      return !Number.isNaN(d.getTime()) && d > now
    })
    if (preferred) return preferred
  }
  
  const mainQueryPreferred = trips.find(t => t.isFromMainQuery === true && t.slPreferredOrder === 0)
  if (mainQueryPreferred) return mainQueryPreferred
  
  return trips[0]
}