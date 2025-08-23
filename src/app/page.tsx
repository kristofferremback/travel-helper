'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import Typeahead from '../components/Typeahead'
import UrlPrefill from '../components/UrlPrefill'
import ModeBadge, { LineBadge } from '../components/ModeBadge'
import DateTimePicker from '../components/DateTimePicker'
import { Button, Chip } from '@/components/ui'

type Site = {
  id: string
  name: string
  latitude?: number
  longitude?: number
  type: string
  fullName?: string
}

// Saved trip types
 type PlaceSite = {
  kind: 'site'
  id: string
  name: string
  latitude: number
  longitude: number
  type?: string
}

 type PlaceAddress = {
  kind: 'address'
  name: string
  address: string
  latitude: number
  longitude: number
}

 type Place = PlaceSite | PlaceAddress

 type SavedTrip = {
  id: string
  label?: string | null
  fromPlace: Place
  toPlace: Place
  pinned?: boolean
  position?: number | null
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data)

export default function PlannerPage() {
  const [from, setFrom] = useState<Site | null>(null)
  const [to, setTo] = useState<Site | null>(null)

  const [useNow, setUseNow] = useState(true)
  const [when, setWhen] = useState<string>('')
  const [arriveBy, setArriveBy] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [urlDest, setUrlDest] = useState<Site | null>(null)
  const [currentPos, setCurrentPos] = useState<{ lat: number; lon: number } | null>(null)
  const [reverseState, setReverseState] = useState<Record<string, 'smart' | 'normal' | 'reversed'>>({})
  
  // Session-gated fetch of saved trips
  const { data: session } = useSession()
  const { data: savedTripsData, mutate: mutateTrips } = useSWR(session ? '/api/saved-trips' : null, fetcher)
  const trips: SavedTrip[] = useMemo(() => savedTripsData?.trips ?? [], [savedTripsData])
  
  const savedPlaces: Site[] = useMemo(() => {
    const arr: Site[] = []
    for (const t of trips) {
      const fp: any = t.fromPlace
      const tp: any = t.toPlace
      if (fp?.latitude && fp?.longitude) arr.push({ id: fp.id || `${t.id}:from`, name: fp.name, latitude: fp.latitude, longitude: fp.longitude, type: fp.kind, fullName: fp.name })
      if (tp?.latitude && tp?.longitude) arr.push({ id: tp.id || `${t.id}:to`, name: tp.name, latitude: tp.latitude, longitude: tp.longitude, type: tp.kind, fullName: tp.name })
    }
    const seen = new Set<string>()
    const uniq: Site[] = []
    for (const s of arr) {
      const key = `${s.name}:${s.latitude}:${s.longitude}`
      if (!seen.has(key)) { seen.add(key); uniq.push(s) }
    }
    return uniq
  }, [trips])


  // Initialize default time to now (local)
  useEffect(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const HH = String(d.getHours()).padStart(2, '0')
    const MM = String(d.getMinutes()).padStart(2, '0')
    setWhen(`${yyyy}-${mm}-${dd}T${HH}:${MM}`)
  }, [])

  // URL prefill handled by child component below (wrapped in Suspense)

  // On mount, try geolocation and pick nearby stops (only once, only if no user interaction)
  useEffect(() => {
    let cancelled = false
    
    // Only run once on mount, and only if user hasn't interacted and no 'from' is set
    if (from || hasUserInteracted || !navigator.geolocation) {
      setIsLoadingLocation(false)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return
        try {
          const { latitude, longitude } = pos.coords
          setCurrentPos({ lat: latitude, lon: longitude })
          const res = await fetch(`/api/nearby-stops?lat=${latitude}&lon=${longitude}&limit=3`)
          const data = await res.json()
          if (!cancelled && data?.results?.length && !hasUserInteracted) {
            setFrom(data.results[0])
          }
        } catch {}
        if (!cancelled) setIsLoadingLocation(false)
      },
      (error) => {
        if (!cancelled) setIsLoadingLocation(false)
      }
    )
    
    return () => { cancelled = true }
  }, []) // Empty dependency array - only run once on mount

  return (
    <>
      <main className="space-y-6">
        {/* URL prefill (Suspense) */}
        <Suspense fallback={null}>
          <UrlPrefill onFromChange={setFrom} onToChange={setUrlDest} />
        </Suspense>
        {/* From/To selection */}
        <section className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Typeahead
                label="From"
                value={from ? from.name : undefined}
                onChangeText={(text) => {
                  // Only clear 'from' if the input is completely empty
                  if (!text || text.trim() === '') {
                    setFrom(null)
                  }
                }}
                onSelect={(s) => { setHasUserInteracted(true); setFrom({ ...(s as any), type: (s as any).type ?? 'unknown' } as Site) }}
                placeholder="Search stop or address"
                clearable
                onClear={() => setFrom(null)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      setHasUserInteracted(true)
                      if (!navigator.geolocation) return
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        const { latitude, longitude } = pos.coords
                        const res = await fetch(`/api/nearby-stops?lat=${latitude}&lon=${longitude}&limit=1`)
                        const data = await res.json()
                        if (data?.results?.[0]) {
                          setFrom(data.results[0])
                        }
                      })
                    } catch {}
                  }}
                >
                  <span>📍</span>
                  Current location
                </Button>
                {savedPlaces.map((p) => (
                  <Chip
                    key={`from-${p.id}`}
                    variant="location"
                    icon={<span>📍</span>}
                    onClick={() => { setHasUserInteracted(true); setFrom(p) }}
                  >
                    {p.name}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Typeahead
                label="To"
                value={to ? to.name : undefined}
                onChangeText={(text) => {
                  // Only clear 'to' if the input is completely empty
                  if (!text || text.trim() === '') {
                    setTo(null)
                  }
                }}
                onSelect={(s) => { setHasUserInteracted(true); setTo({ ...(s as any), type: (s as any).type ?? 'unknown' } as Site) }}
                placeholder="Search stop or address"
                clearable
                onClear={() => setTo(null)}
              />
              <div className="flex flex-wrap gap-2">
                {savedPlaces.map((p) => (
                  <Chip
                    key={`to-${p.id}`}
                    variant="location"
                    icon={<span>🎯</span>}
                    onClick={() => { setHasUserInteracted(true); setTo(p) }}
                  >
                    {p.name}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>

      {/* Time controls - always visible for global trip planning */}
        <section className="space-y-4">
          <div className="flex items-center gap-4 min-h-[3rem]">
            {/* Leave now toggle */}
            <div className="inline-flex items-center gap-3 cursor-pointer group flex-shrink-0" onClick={() => setUseNow(!useNow)}>
              <div className="relative">
                <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 ${
                  useNow 
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 shadow-lg' 
                    : 'bg-white/10 border-violet-300/50 hover:border-violet-400'
                }`}>
                  {useNow && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </div>
              <span className="text-white font-medium whitespace-nowrap">Leave now</span>
            </div>

            {/* Spacer to prevent layout shift */}
            <div className="flex-1 flex items-center gap-4 overflow-hidden">
              {/* Time mode options - fade and slide in */}
              <motion.div
                initial={false}
                animate={{ 
                  opacity: useNow ? 0 : 1,
                  x: useNow ? -30 : 0,
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-4 flex-shrink-0"
                style={{ 
                  pointerEvents: useNow ? 'none' : 'auto',
                  visibility: useNow ? 'hidden' : 'visible'
                }}
              >
                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="timeMode"
                      checked={!arriveBy}
                      onChange={() => setArriveBy(false)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      !arriveBy 
                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 shadow-lg' 
                        : 'bg-white/10 border-violet-300/50 hover:border-violet-400'
                    }`}>
                      {!arriveBy && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-1 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-white font-medium whitespace-nowrap">Depart at</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="timeMode"
                      checked={arriveBy}
                      onChange={() => setArriveBy(true)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      arriveBy 
                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 shadow-lg' 
                        : 'bg-white/10 border-violet-300/50 hover:border-violet-400'
                    }`}>
                      {arriveBy && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-1 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-white font-medium whitespace-nowrap">Arrive by</span>
                </label>
              </motion.div>

              {/* DateTime picker - fade and slide from right */}
              <motion.div
                initial={false}
                animate={{ 
                  opacity: useNow ? 0 : 1,
                  x: useNow ? 20 : 0,
                }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
                className="ml-auto flex-shrink-0"
                style={{ 
                  pointerEvents: useNow ? 'none' : 'auto',
                  visibility: useNow ? 'hidden' : 'visible'
                }}
              >
                <DateTimePicker
                  value={when}
                  onChange={(v: string) => setWhen(v)}
                  disabled={useNow}
                />
              </motion.div>
            </div>
          </div>
        </section>

      {/* Ad-hoc trip - only when both from and to are selected */}
      {from && from.latitude && from.longitude && to && to.latitude && to.longitude && (
        <section className="space-y-4">
          <ul className="space-y-3">
            <li className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <DestinationTrips from={from} dest={to} useNow={useNow} when={when} arriveBy={arriveBy} />
            </li>
          </ul>
        </section>
      )}

      {/* URL destination trip - only when from is set and URL destination exists */}
      {from && from.latitude && from.longitude && urlDest && urlDest.latitude && urlDest.longitude && (
        <section className="space-y-4">
          <ul className="space-y-3">
            <li className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <DestinationTrips from={from} dest={urlDest} useNow={useNow} when={when} arriveBy={arriveBy} />
            </li>
          </ul>
        </section>
      )}

      {/* Saved trips - always show when there are trips, regardless of from/to state */}
      {trips.length > 0 && (
        <section className="space-y-4">
          <ul className="space-y-3">
            {trips.map((t) => {
              const { fromSite, toSite, mode } = computeEndpoints(t, currentPos, reverseState[t.id])
              return (
                <li key={t.id} className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <DestinationTrips
                    from={fromSite}
                    dest={toSite}
                    useNow={useNow}
                    when={when}
                    arriveBy={arriveBy}
                    extraActions={
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-lg bg-white/30 hover:bg-white/50 text-violet-900"
                          onClick={() => setReverseState((m) => ({ ...m, [t.id]: 'reversed' }))}
                          title="Reverse (manual)"
                        >↔︎ Reverse</button>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-lg bg-white/30 hover:bg-white/50 text-violet-900"
                          onClick={() => setReverseState((m) => ({ ...m, [t.id]: 'normal' }))}
                          title="Use saved order"
                        >→ Normal</button>
                        {mode !== 'smart' && (
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-lg bg-white/20 hover:bg-white/40 text-violet-900"
                            onClick={() => setReverseState((m) => ({ ...m, [t.id]: 'smart' }))}
                            title="Use smart reverse"
                          >💡 Smart</button>
                        )}
                      </div>
                    }
                  />
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>

    {/* Alfred/Spotlight-style search overlay */}

  </>
  )
}

function toSiteFromPlace(p: Place): Site {
  const anyp: any = p
  return {
    id: anyp.id || `${anyp.kind}:${anyp.name}`,
    name: anyp.name,
    latitude: anyp.latitude,
    longitude: anyp.longitude,
    type: anyp.kind,
    fullName: anyp.address || anyp.name,
  }
}

function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function computeEndpoints(t: SavedTrip, currentPos: { lat: number; lon: number } | null, modeIn?: 'smart' | 'normal' | 'reversed') {
  const fp = toSiteFromPlace(t.fromPlace)
  const tp = toSiteFromPlace(t.toPlace)
  const mode = modeIn || 'smart'
  if (mode === 'normal') return { fromSite: fp, toSite: tp, mode }
  if (mode === 'reversed') return { fromSite: tp, toSite: fp, mode }
  // smart
  if (currentPos && fp.latitude != null && fp.longitude != null && tp.latitude != null && tp.longitude != null) {
    const dFrom = distanceMeters(currentPos.lat, currentPos.lon, fp.latitude!, fp.longitude!)
    const dTo = distanceMeters(currentPos.lat, currentPos.lon, tp.latitude!, tp.longitude!)
    if (dFrom <= dTo) return { fromSite: fp, toSite: tp, mode: 'smart' }
    return { fromSite: tp, toSite: fp, mode: 'smart' }
  }
  return { fromSite: fp, toSite: tp, mode: 'smart' }
}

function runLinkFromTrip(t: SavedTrip) {
  const fp = t.fromPlace as any
  const tp = t.toPlace as any
  const qs = new URLSearchParams()
  qs.set('fromName', fp.name)
  qs.set('fromLat', String(fp.latitude))
  qs.set('fromLon', String(fp.longitude))
  qs.set('fromKind', fp.kind)
  if (fp.id) qs.set('fromId', String(fp.id))

  qs.set('toName', tp.name)
  qs.set('toLat', String(tp.latitude))
  qs.set('toLon', String(tp.longitude))
  qs.set('toKind', tp.kind)
  if (tp.id) qs.set('toId', String(tp.id))

  return `/?${qs.toString()}`
}



function DestinationTrips({ from, dest, useNow, when, arriveBy, extraActions }: { from: any; dest: any; useNow: boolean; when: string; arriveBy: boolean; extraActions?: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const [trips, setTrips] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!from?.latitude || !from?.longitude || !dest?.latitude || !dest?.longitude) return
      setLoading(true)
      try {
        // First batch (up to 3)
        const qs = new URLSearchParams()
        qs.set('fromLat', String(from.latitude))
        qs.set('fromLon', String(from.longitude))
        qs.set('toLat', String(dest.latitude))
        qs.set('toLon', String(dest.longitude))
        qs.set('num', '3')

        if (!useNow && when) {
          qs.set('when', when)
          if (arriveBy) qs.set('arriveBy', 'true')
        }
        const u1 = `/api/trips?${qs.toString()}`
        const r1 = await fetch(u1)
        const d1 = await r1.json()
        let journeys: any[] = Array.isArray(d1?.journeys) ? d1.journeys : []
        // Mark main query trips as preferred (only the first one will be recommended)
        journeys = journeys.map((j, index) => ({ ...j, isFromMainQuery: true }))

        
        // Get more trips: for "Leave now" get later trips, for scheduled times get trips before/after
        let more: any[] = []
        const shouldPaginateNow = useNow && !arriveBy
        const shouldGetSurrounding = !useNow && when
        
        if (shouldPaginateNow && journeys.length >= 1) {
          // Helper to format local time like YYYY-MM-DDTHH:MM
          const formatLocalTime = (date: Date) => {
            const yyyy = date.getFullYear()
            const mm = String(date.getMonth() + 1).padStart(2, '0')
            const dd = String(date.getDate()).padStart(2, '0')
            const HH = String(date.getHours()).padStart(2, '0')
            const MM = String(date.getMinutes()).padStart(2, '0')
            return `${yyyy}-${mm}-${dd}T${HH}:${MM}`
          }

          // Fetch later trips (after the last one from main query)
          const lastFirstLeg = journeys[journeys.length - 1]?.legs?.[0]
          const whenLast = lastFirstLeg?.origin?.estimated || lastFirstLeg?.origin?.planned
          if (whenLast) {
            const t = new Date(whenLast)
            if (!Number.isNaN(t.getTime())) {
              t.setMinutes(t.getMinutes() + 1)
              const qsLater = new URLSearchParams(qs)
              qsLater.set('when', formatLocalTime(t))
              const r2 = await fetch(`/api/trips?${qsLater.toString()}`)
              const d2 = await r2.json()
              const later = Array.isArray(d2?.journeys) ? d2.journeys.map((j: any) => ({ ...j, isFromMainQuery: false })) : []
              more = more.concat(later)
            }
          }

          // Also fetch preceding trips (before the first one from main query)
          const firstFirstLeg = journeys[0]?.legs?.[0]
          const whenFirst = firstFirstLeg?.origin?.estimated || firstFirstLeg?.origin?.planned
          if (whenFirst) {
            const t = new Date(whenFirst)
            if (!Number.isNaN(t.getTime())) {
              t.setMinutes(t.getMinutes() - 15)
              const qsEarlier = new URLSearchParams(qs)
              qsEarlier.set('when', formatLocalTime(t))
              qsEarlier.set('num', '3')
              const rPrev = await fetch(`/api/trips?${qsEarlier.toString()}`)
              const dPrev = await rPrev.json()
              const earlier = Array.isArray(dPrev?.journeys) ? dPrev.journeys.map((j: any) => ({ ...j, isFromMainQuery: false, isPreceding: true })) : []
              more = earlier.concat(more)
            }
          }
        }
        
        // For scheduled trips, get trips around the selected time
        if (shouldGetSurrounding) {
          try {
            // Get earlier trips (15 minutes before) and later trips (30 minutes after)
            // Parse as local time by adding timezone offset
            const [datePart, timePart] = when.split('T')
            const [year, month, day] = datePart.split('-').map(Number)
            const [hour, minute] = timePart.split(':').map(Number)
            
            const selectedTime = new Date(year, month - 1, day, hour, minute)
            const earlierTime = new Date(selectedTime.getTime() - 15 * 60 * 1000)
            const laterTime = new Date(selectedTime.getTime() + 30 * 60 * 1000)
            

            
            // Format times as local YYYY-MM-DDTHH:MM
            const formatLocalTime = (date: Date) => {
              const yyyy = date.getFullYear()
              const mm = String(date.getMonth() + 1).padStart(2, '0')
              const dd = String(date.getDate()).padStart(2, '0')
              const HH = String(date.getHours()).padStart(2, '0')
              const MM = String(date.getMinutes()).padStart(2, '0')
              return `${yyyy}-${mm}-${dd}T${HH}:${MM}`
            }
            
            const qsEarlier = new URLSearchParams(qs)
            qsEarlier.set('when', formatLocalTime(earlierTime))
            qsEarlier.set('num', '2')
            if (arriveBy) qsEarlier.set('arriveBy', 'true')
            
            const qsLater = new URLSearchParams(qs)
            qsLater.set('when', formatLocalTime(laterTime))
            qsLater.set('num', '2')
            if (arriveBy) qsLater.set('arriveBy', 'true')
            
            const [rEarlier, rLater] = await Promise.all([
              fetch(`/api/trips?${qsEarlier.toString()}`),
              fetch(`/api/trips?${qsLater.toString()}`)
            ])
            
            const [dEarlier, dLater] = await Promise.all([
              rEarlier.json(),
              rLater.json()
            ])
            
            const earlierJourneys = Array.isArray(dEarlier?.journeys) ? dEarlier.journeys.map((j: any) => ({ ...j, isFromMainQuery: false })) : []
            const laterJourneys = Array.isArray(dLater?.journeys) ? dLater.journeys.map((j: any) => ({ ...j, isFromMainQuery: false })) : []
            
            more = [...earlierJourneys, ...laterJourneys]
          } catch (error) {
            console.log('Failed to get surrounding trips:', error)
          }
        }
        const merged = [...journeys, ...more]
        
        // Sort all merged trips chronologically by departure time
        merged.sort((a: any, b: any) => {
          const aDept = a.legs?.[0]?.origin?.estimated || a.legs?.[0]?.origin?.planned
          const bDept = b.legs?.[0]?.origin?.estimated || b.legs?.[0]?.origin?.planned
          
          if (aDept && bDept) {
            const aTime = new Date(aDept).getTime()
            const bTime = new Date(bDept).getTime()
            if (aTime !== bTime) return aTime - bTime
          }
          
          // If same departure time, prefer main query trips, then by SL order
          if (a.isFromMainQuery !== b.isFromMainQuery) {
            return a.isFromMainQuery ? -1 : 1
          }
          return a.slPreferredOrder - b.slPreferredOrder
        })
        
        const seen = new Set<string>()
        const unique = [] as any[]
        for (const j of merged) {
          const firstLeg = j?.legs?.[0]
          const lastLeg = j?.legs?.[j?.legs?.length - 1]
          const departTime = firstLeg?.origin?.estimated || firstLeg?.origin?.planned || ''
          const arriveTime = lastLeg?.destination?.estimated || lastLeg?.destination?.planned || ''
          const duration = j.duration || 0
          const lines = Array.isArray(j?.legs)
            ? j.legs
                .map((l: any) => l.transportation?.line || l.transportation?.name || l.mode || '')
                .filter(Boolean)
                .join('|')
            : ''
          
          // Create key based on departure time (rounded to 5-min intervals), arrival time, duration and lines
          const departDate = new Date(departTime)
          const roundedDepart = new Date(Math.round(departDate.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000))
          const key = `${roundedDepart.getTime()}_${arriveTime}_${duration}_${lines}`
          
          if (!seen.has(key)) {
            seen.add(key)
            unique.push(j)
          }
        }
        
        // Build combined list
        let combined = unique.slice(0, 5)
        if (useNow) {
        const now = new Date()
        const withTimes = unique.map((j: any) => {
        const dt = j?.legs?.[0]?.origin?.estimated || j?.legs?.[0]?.origin?.planned || ''
        const dnum = dt ? new Date(dt).getTime() : Number.POSITIVE_INFINITY
        return { j, dt, dnum }
        })
        const preceding = withTimes.filter((x) => Number.isFinite(x.dnum) && x.dnum < now.getTime()).map((x) => x.j)
        const future = withTimes.filter((x) => !Number.isFinite(x.dnum) || x.dnum >= now.getTime()).map((x) => x.j)
        const precedingTail = preceding.slice(-1) // keep up to last 1 past trip for context
        const futureHead = future.slice(0, 3) // show up to 3 future trips
          combined = precedingTail.concat(futureHead)
                 // If we still have room (less than 4 total), append more future trips
          if (combined.length < 4) {
            combined = combined.concat(future.slice(futureHead.length, 4 - combined.length + futureHead.length)).slice(0, 4)
          } else {
            combined = combined.slice(0, 4)
          }
        }
 
        if (!cancelled) setTrips(combined)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [from?.latitude, from?.longitude, dest?.latitude, dest?.longitude, useNow, when, arriveBy])

  const fmt = (s?: string) => {
    if (!s) return ''
    const d = new Date(s)
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Pick recommended trip:
  // For Leave now: first future trip; else top from main query; else first item
  const getDepart = (tr: any) => tr?.legs?.[0]?.origin?.estimated || tr?.legs?.[0]?.origin?.planned
  let preferred: any | undefined
  if (useNow && Array.isArray(trips)) {
    const now = new Date()
    preferred = trips.find((t) => {
      const dt = getDepart(t)
      if (!dt) return false
      const d = new Date(dt)
      return !Number.isNaN(d.getTime()) && d > now
    }) || undefined
  }
  if (!preferred) {
    preferred = trips?.find(t => t.isFromMainQuery === true && t.slPreferredOrder === 0)
  }
  if (!preferred && Array.isArray(trips) && trips.length > 0) preferred = trips[0]

  const firstDepart = preferred?.legs?.[0]?.origin
  const firstArrive = preferred?.legs?.[preferred?.legs?.length - 1]?.destination

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{from?.name} → {dest.name}</div>
          {preferred ? (
            <div className="text-sm text-gray-700">
              {fmt(firstDepart?.estimated || firstDepart?.planned)} →{' '}
              {fmt(firstArrive?.estimated || firstArrive?.planned)} · {Math.round((preferred.duration ?? 0) / 60)}{' '}
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
            <button 
              type="button" 
              className="text-sm text-violet-200 hover:text-white transition-colors duration-200 flex items-center gap-1"
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
            </button>
          )}
        </div>
      </div>
      {expanded && trips && trips.length > 0 ? (
        <ol className="mt-2 space-y-2">
          {trips.slice(0, 5).map((j: any, i: number) => {
            const depart = j.legs?.[0]?.origin
            const arrive = j.legs?.[j.legs.length - 1]?.destination
            const isActive = active === i
            const isPreferred = j === preferred
            return (
              <li key={i} className="text-sm">
                <button className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center justify-between group ${
                  isPreferred 
                    ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-400/30 hover:from-violet-500/30 hover:to-fuchsia-500/30' 
                    : 'hover:bg-white/20'
                }`} onClick={() => setActive(isActive ? null : i)}>
                  <div className="flex items-center gap-2">
                    <span>
                      {fmt(depart?.estimated || depart?.planned)} → {fmt(arrive?.estimated || arrive?.planned)} ·{' '}
                      {Math.round((j.duration ?? 0) / 60)} min
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
                      {j.legs?.map((l: any, k: number) => (
                        <li key={k} className="flex items-center gap-2 flex-wrap">
                          <ModeBadge mode={l.mode} />
                          <span className="text-white flex-1 min-w-0">
                            {l.origin?.name} ({fmt(l.origin?.estimated || l.origin?.planned)}) →{' '}
                            {l.destination?.name} ({fmt(l.destination?.estimated || l.destination?.planned)})
                          </span>
                          <LineBadge mode={l.mode} line={l.line} />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      ) : null}
    </div>
  )
}
