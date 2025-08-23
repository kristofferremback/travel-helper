'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useState } from 'react'
import UrlPrefill from '../components/UrlPrefill'
import type { Site, ReverseMode, GeoPosition } from '@/types'
import { computeEndpoints } from '@/utils/location'
import { formatLocalTime } from '@/utils/time'
import { useSavedTrips } from '@/hooks/useSavedTrips'
import LocationSearchSection from '@/components/trip/LocationSearchSection'
import TimeSelectionSection from '@/components/trip/TimeSelectionSection'
import TripResultsSection from '@/components/trip/TripResultsSection'

export default function PlannerPage() {
  const [from, setFrom] = useState<Site | null>(null)
  const [to, setTo] = useState<Site | null>(null)

  const [useNow, setUseNow] = useState(true)
  const [when, setWhen] = useState<string>('')
  const [arriveBy, setArriveBy] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [urlDest, setUrlDest] = useState<Site | null>(null)
  const [currentPos, setCurrentPos] = useState<GeoPosition | null>(null)
  const [reverseState, setReverseState] = useState<Record<string, ReverseMode>>({})

  // Use consolidated saved trips hook
  const { trips, savedPlaces } = useSavedTrips()

  // Initialize default time to now (local)
  useEffect(() => {
    setWhen(formatLocalTime(new Date()))
  }, [])

  // URL prefill handled by child component below (wrapped in Suspense)

  // On mount, try geolocation and pick nearby stops (only once, only if no user interaction)
  useEffect(() => {
    let cancelled = false

    // Only run once on mount, and only if user hasn't interacted and no 'from' is set
    if (from || hasUserInteracted || !navigator.geolocation) {
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
      }
    )

    return () => {
      cancelled = true
    }
  }, []) // Empty dependency array - only run once on mount

  return (
    <>
      <main className="space-y-6">
        {/* URL prefill (Suspense) */}
        <Suspense fallback={null}>
          <UrlPrefill onFromChange={setFrom} onToChange={setUrlDest} />
        </Suspense>
        <LocationSearchSection
          from={from}
          to={to}
          savedPlaces={savedPlaces}
          hasUserInteracted={hasUserInteracted}
          onFromChange={setFrom}
          onToChange={setTo}
          onUserInteraction={() => setHasUserInteracted(true)}
        />

        <TimeSelectionSection
          useNow={useNow}
          when={when}
          arriveBy={arriveBy}
          onUseNowChange={setUseNow}
          onWhenChange={setWhen}
          onArriveByChange={setArriveBy}
        />

        {/* Ad-hoc trip - only when both from and to are selected */}
        {from && from.latitude && from.longitude && to && to.latitude && to.longitude && (
          <section className="space-y-4">
            <ul className="space-y-3">
              <li className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <TripResultsSection from={from} dest={to} useNow={useNow} when={when} arriveBy={arriveBy} />
              </li>
            </ul>
          </section>
        )}

        {/* URL destination trip - only when from is set and URL destination exists */}
        {from && from.latitude && from.longitude && urlDest && urlDest.latitude && urlDest.longitude && (
          <section className="space-y-4">
            <ul className="space-y-3">
              <li className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <TripResultsSection
                  from={from}
                  dest={urlDest}
                  useNow={useNow}
                  when={when}
                  arriveBy={arriveBy}
                />
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
                  <li
                    key={t.id}
                    className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    <TripResultsSection
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
                          >
                            ↔︎ Reverse
                          </button>
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-lg bg-white/30 hover:bg-white/50 text-violet-900"
                            onClick={() => setReverseState((m) => ({ ...m, [t.id]: 'normal' }))}
                            title="Use saved order"
                          >
                            → Normal
                          </button>
                          {mode !== 'smart' && (
                            <button
                              type="button"
                              className="text-xs px-2 py-1 rounded-lg bg-white/20 hover:bg-white/40 text-violet-900"
                              onClick={() => setReverseState((m) => ({ ...m, [t.id]: 'smart' }))}
                              title="Use smart reverse"
                            >
                              💡 Smart
                            </button>
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

