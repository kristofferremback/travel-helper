"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ModeBadge, { LineBadge } from '@/components/ModeBadge'
import { Card, CardContent } from '@/components/ui'
import { formatLocalTime } from '@/utils/time'
import type { Site } from '@/types'

interface TripResultsSectionProps {
  from: Site
  dest: Site
  useNow: boolean
  when: string
  arriveBy: boolean
  extraActions?: React.ReactNode
}

export default function TripResultsSection({
  from,
  dest,
  useNow,
  when,
  arriveBy,
  extraActions,
}: TripResultsSectionProps) {
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
        journeys = journeys.map((j: any) => ({ ...j, isFromMainQuery: true }))

        // Get more trips: for "Leave now" get later trips, for scheduled times get trips before/after
        let more: any[] = []
        const shouldPaginateNow = useNow && !arriveBy
        const shouldGetSurrounding = !useNow && when

        if (shouldPaginateNow && journeys.length >= 1) {
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
              const later = Array.isArray(d2?.journeys)
                ? d2.journeys.map((j: any) => ({ ...j, isFromMainQuery: false }))
                : []
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
              const earlier = Array.isArray(dPrev?.journeys)
                ? dPrev.journeys.map((j: any) => ({ ...j, isFromMainQuery: false, isPreceding: true }))
                : []
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
              fetch(`/api/trips?${qsLater.toString()}`),
            ])

            const [dEarlier, dLater] = await Promise.all([rEarlier.json(), rLater.json()])

            const earlierJourneys = Array.isArray(dEarlier?.journeys)
              ? dEarlier.journeys.map((j: any) => ({ ...j, isFromMainQuery: false }))
              : []
            const laterJourneys = Array.isArray(dLater?.journeys)
              ? dLater.journeys.map((j: any) => ({ ...j, isFromMainQuery: false }))
              : []

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
          const preceding = withTimes
            .filter((x) => Number.isFinite(x.dnum) && x.dnum < now.getTime())
            .map((x) => x.j)
          const future = withTimes
            .filter((x) => !Number.isFinite(x.dnum) || x.dnum >= now.getTime())
            .map((x) => x.j)
          const precedingTail = preceding.slice(-1) // keep up to last 1 past trip for context
          const futureHead = future.slice(0, 3) // show up to 3 future trips
          combined = precedingTail.concat(futureHead)
          // If we still have room (less than 4 total), append more future trips
          if (combined.length < 4) {
            combined = combined
              .concat(future.slice(futureHead.length, 4 - combined.length + futureHead.length))
              .slice(0, 4)
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

  const fmt = (timeString?: string) => {
    if (!timeString) return ''
    const date = new Date(timeString)
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Pick recommended trip:
  // For Leave now: first future trip; else top from main query; else first item
  const getDepart = (tr: any) => tr?.legs?.[0]?.origin?.estimated || tr?.legs?.[0]?.origin?.planned
  let preferred: any | undefined
  if (useNow && Array.isArray(trips)) {
    const now = new Date()
    preferred =
      trips.find((t) => {
        const dt = getDepart(t)
        if (!dt) return false
        const d = new Date(dt)
        return !Number.isNaN(d.getTime()) && d > now
      }) || undefined
  }
  if (!preferred) {
    preferred = trips?.find((t) => t.isFromMainQuery === true && t.slPreferredOrder === 0)
  }
  if (!preferred && Array.isArray(trips) && trips.length > 0) preferred = trips[0]

  const firstDepart = preferred?.legs?.[0]?.origin
  const firstArrive = preferred?.legs?.[preferred?.legs?.length - 1]?.destination

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">
            {from?.name} → {dest.name}
          </div>
          {preferred ? (
            <div className="text-sm text-gray-700">
              {fmt(firstDepart?.estimated || firstDepart?.planned)} →{' '}
              {fmt(firstArrive?.estimated || firstArrive?.planned)} ·{' '}
              {Math.round((preferred.duration ?? 0) / 60)} min
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
                  <svg
                    className="w-3 h-3 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span className="text-xs">🚀</span>
                  <span>Explore more</span>
                  <svg
                    className="w-3 h-3 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && trips && trips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <ol className="mt-2 space-y-2">
            {trips.slice(0, 5).map((j: any, i: number) => {
              const depart = j.legs?.[0]?.origin
              const arrive = j.legs?.[j.legs.length - 1]?.destination
              const isActive = active === i
              const isPreferred = j === preferred
              return (
                <li key={i} className="text-sm">
                  <button
                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center justify-between group ${
                      isPreferred
                        ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-400/30 hover:from-violet-500/30 hover:to-fuchsia-500/30'
                        : 'hover:bg-white/20'
                    }`}
                    onClick={() => setActive(isActive ? null : i)}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {fmt(depart?.estimated || depart?.planned)} →{' '}
                        {fmt(arrive?.estimated || arrive?.planned)} · {Math.round((j.duration ?? 0) / 60)} min
                      </span>
                      {isPreferred && (
                        <span className="text-xs bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white px-2 py-0.5 rounded-full font-medium">
                          ⭐ Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-violet-300 group-hover:text-white transition-colors duration-200">
                      <span className="text-xs">Details</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isActive && (
                    <Card className="mt-3 bg-white/10 backdrop-blur-sm border-white/20">
                      <CardContent className="p-3">
                        <ol className="space-y-2 text-xs">
                          {j.legs?.map((l: any, k: number) => (
                            <li key={k} className="flex items-center gap-2 flex-wrap">
                              <ModeBadge mode={l.mode} />
                              <span className="text-white flex-1 min-w-0">
                                {l.origin?.name} ({fmt(l.origin?.estimated || l.origin?.planned)}) →{' '}
                                {l.destination?.name} ({fmt(l.destination?.estimated || l.destination?.planned)}
                                )
                              </span>
                              <LineBadge mode={l.mode} line={l.line} />
                            </li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  )}
                </li>
              )
            })}
          </ol>
        </motion.div>
      )}
    </div>
  )
}