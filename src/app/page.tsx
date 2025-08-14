'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import Typeahead from '../components/Typeahead'
import ModeBadge, { LineBadge } from '../components/ModeBadge'
import DateTimePicker from '../components/DateTimePicker'

type Site = {
  id: string
  name: string
  latitude?: number
  longitude?: number
  type: string
  fullName?: string
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data)

export default function PlannerPage() {
  const [from, setFrom] = useState<Site | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [useNow, setUseNow] = useState(true)
  const [when, setWhen] = useState<string>('')
  const [arriveBy, setArriveBy] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  
  const { data: saved } = useSWR('/api/addresses', fetcher)

  // Handle Escape key for search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setShowLocationPicker(false)
      }
    }
    
    if (showSearch) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSearch])

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

  // On mount, try geolocation and pick nearby stops (but only if user hasn't interacted)
  useEffect(() => {
    if (from || hasUserInteracted) {
      setIsLoadingLocation(false)
      return
    }
    
    if (!navigator.geolocation) {
      setIsLoadingLocation(false)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(`/api/nearby-stops?lat=${latitude}&lon=${longitude}&limit=3`)
          const data = await res.json()
          if (data?.results?.length) {
            setFrom(data.results[0])
          }
        } catch {}
        setIsLoadingLocation(false)
      },
      (error) => {
        setIsLoadingLocation(false)
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, hasUserInteracted])

  return (
    <>
      <main className="space-y-6">
        {/* From selection */}
        <section className="space-y-3">
          {from ? (
            <div className="p-4 bg-gradient-to-r from-violet-100/80 to-fuchsia-100/60 rounded-xl shadow-sm space-y-4">
              <div>
                <div className="font-medium">From: {from.name}</div>
                {from.fullName && <div className="text-sm text-gray-600">{from.fullName}</div>}
              </div>
              
              {/* Quick select options */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400/20 to-teal-400/20 hover:from-cyan-400/30 hover:to-teal-400/30 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 text-cyan-800"
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
                </button>
                
                {saved?.addresses?.map((a: any) => (
                  <button
                    key={a.id}
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-400/20 to-purple-400/20 hover:from-violet-400/30 hover:to-purple-400/30 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 text-violet-800"
                    onClick={() => {
                      setHasUserInteracted(true)
                      setFrom({
                        id: a.id,
                        name: a.label,
                        fullName: a.address,
                        latitude: a.latitude,
                        longitude: a.longitude,
                        type: 'saved',
                      })
                    }}
                  >
                    <span>
                      {/home|hem/i.test(a.label) ? '🏠' : /work|office|jobb/i.test(a.label) ? '🏢' : '📍'}
                    </span>
                    {a.label}
                  </button>
                ))}
                
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-400/20 to-pink-400/20 hover:from-rose-400/30 hover:to-pink-400/30 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 text-rose-800"
                  onClick={() => setShowSearch(true)}
                >
                  <span>🔍</span>
                  Search for other
                </button>
              </div>
            </div>
          ) : isLoadingLocation ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="animate-spin h-5 w-5 border-2 border-violet-300 border-t-transparent rounded-full"></div>
                <span className="text-white/90">Finding your cosmic location...</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="font-semibold mb-6 text-white/90">Choose your starting location</h2>
              <button
                type="button"
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                onClick={() => setShowLocationPicker(true)}
              >
                Select location
              </button>
            </div>
          )}
        </section>

      {/* Time controls - show when From is set */}
      {from && (
        <section className="space-y-4">
          <div className="flex items-center gap-4 min-h-[3rem]">
            {/* Leave now toggle */}
            <label className="inline-flex items-center gap-3 cursor-pointer group flex-shrink-0">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={useNow}
                  onChange={(e) => setUseNow(e.target.checked)}
                  className="sr-only"
                />
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
            </label>

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
      )}

      {/* Quick Look - main content */}
      {from && saved?.addresses?.length > 0 && (
        <section className="space-y-4">
          <ul className="space-y-3">
            {saved.addresses.map((a: any) => (
              <li key={a.id} className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <DestinationTrips
                  from={from}
                  dest={{
                    id: a.id,
                    name: a.label,
                    fullName: a.address,
                    latitude: a.latitude,
                    longitude: a.longitude,
                    type: 'saved',
                  }}
                  useNow={useNow}
                  when={when}
                  arriveBy={arriveBy}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>

    {/* Alfred/Spotlight-style search overlay */}
    <AnimatePresence>
      {showSearch && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
            onClick={() => {
              setShowSearch(false)
              setShowLocationPicker(false)
            }}
          >
            {/* Search modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-br from-white/95 to-violet-50/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-visible border-0 ring-1 ring-violet-200/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-violet-400">🔍</span>
                  <span className="text-violet-700 font-medium">Search for a location</span>
                </div>
                <div className="relative z-60">
                  <Typeahead
                    clearable
                    label=""
                    placeholder="Type a stop name or address..."
                    onSelect={(s) => {
                      setHasUserInteracted(true)
                      setFrom({ ...(s as any), type: (s as any).type ?? 'unknown' } as Site)
                      setShowLocationPicker(false)
                      setShowSearch(false)
                    }}
                  />
                </div>
                <div className="mt-4 text-xs text-violet-600/70 flex items-center gap-4">
                  <span>⏎ to select</span>
                  <span>Esc to close</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

  </>
  )
}

function DestinationTrips({ from, dest, useNow, when, arriveBy }: { from: any; dest: any; useNow: boolean; when: string; arriveBy: boolean }) {
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
        // Only paginate when using "Leave now" with Depart at; avoid shifting user-selected time or arrival-by behavior
        let more: any[] = []
        const shouldPaginate = useNow && !arriveBy
        if (shouldPaginate && journeys.length >= 1) {
          const lastFirstLeg = journeys[journeys.length - 1]?.legs?.[0]
          const when0 = lastFirstLeg?.origin?.estimated || lastFirstLeg?.origin?.planned
          if (when0) {
            const t = new Date(when0)
            if (!Number.isNaN(t.getTime())) {
              t.setMinutes(t.getMinutes() + 1)
              const iso = t.toISOString()
              const qs2 = new URLSearchParams(qs)
              qs2.set('when', iso)
              const u2 = `/api/trips?${qs2.toString()}`
              const r2 = await fetch(u2)
              const d2 = await r2.json()
              more = Array.isArray(d2?.journeys) ? d2.journeys : []
            }
          }
        }
        const merged = [...journeys, ...more]
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
        const combined = unique.slice(0, 5)
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

  const first = trips?.[0]
  const firstDepart = first?.legs?.[0]?.origin
  const firstArrive = first?.legs?.[first?.legs?.length - 1]?.destination

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{dest.name}</div>
          {first ? (
            <div className="text-sm text-gray-700">
              {fmt(firstDepart?.estimated || firstDepart?.planned)} →{' '}
              {fmt(firstArrive?.estimated || firstArrive?.planned)} · {Math.round((first.duration ?? 0) / 60)}{' '}
              min
            </div>
          ) : loading ? (
            <div className="text-sm text-violet-300">Loading routes…</div>
          ) : (
            <div className="text-sm text-violet-400/60">No routes found</div>
          )}
        </div>
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
      {expanded && trips && trips.length > 0 ? (
        <ol className="mt-2 space-y-2">
          {trips.slice(0, 5).map((j: any, i: number) => {
            const depart = j.legs?.[0]?.origin
            const arrive = j.legs?.[j.legs.length - 1]?.destination
            const isActive = active === i
            return (
              <li key={i} className="text-sm">
                <button className="w-full text-left p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex items-center justify-between group" onClick={() => setActive(isActive ? null : i)}>
                  <div>
                    {fmt(depart?.estimated || depart?.planned)} → {fmt(arrive?.estimated || arrive?.planned)} ·{' '}
                    {Math.round((j.duration ?? 0) / 60)} min
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
