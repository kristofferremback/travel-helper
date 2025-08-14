'use client'

import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import axios from 'axios'
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
  const [to, setTo] = useState<Site | null>(null)
  const [qFrom, setQFrom] = useState('')
  const [qTo, setQTo] = useState('')
  const [editingFrom, setEditingFrom] = useState(false)
  const [editingTo, setEditingTo] = useState(false)
  const [useNow, setUseNow] = useState(true)
  const [when, setWhen] = useState<string>('')

  const { data: fromOpts } = useSWR(
    qFrom.length > 1 ? `/api/sites/search?q=${encodeURIComponent(qFrom)}` : null,
    fetcher,
  )

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
  const { data: toOpts } = useSWR(
    qTo.length > 1 ? `/api/sites/search?q=${encodeURIComponent(qTo)}` : null,
    fetcher,
  )
  const { data: saved } = useSWR('/api/addresses', fetcher)

  // On mount, try geolocation and pick nearby stops (but do not fight user typing)
  useEffect(() => {
    if (from || editingFrom) return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const res = await fetch(`/api/nearby-stops?lat=${latitude}&lon=${longitude}&limit=3`)
        const data = await res.json()
        if (data?.results?.length) {
          setFrom(data.results[0])
          const addrs = saved?.addresses ?? []
          const preferred =
            addrs.find((a: any) => /work|office|jobb/i.test(a.label)) ||
            addrs.find((a: any) => /home|hem/i.test(a.label)) ||
            addrs[0]
          if (preferred) {
            setTo({
              id: preferred.id,
              name: preferred.label,
              fullName: preferred.address,
              latitude: preferred.latitude,
              longitude: preferred.longitude,
              type: 'saved',
            })
          }
        }
      } catch {}
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, editingFrom, saved?.addresses?.length])

  const canSearch = from && to
  const [arriveBy, setArriveBy] = useState(false)

  return (
    <main className="space-y-6">
      {from && !editingFrom && saved?.addresses?.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Quick Look</h2>
          <ul className="space-y-2">
            {saved.addresses.map((a: any) => (
              <li key={a.id} className="border rounded p-3">
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

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <Typeahead
            clearable
            label="From"
            value={editingFrom ? qFrom : from?.name ?? qFrom}
            placeholder="Search stop or address"
            onChangeText={(t) => {
              setEditingFrom(true)
              setQFrom(t)
            }}
            onClear={() => {
              setQFrom('')
            }}
            onSelect={(s) => {
              setEditingFrom(false)
              setFrom({ ...(s as any), type: (s as any).type ?? 'unknown' } as Site)
              setQFrom('')
            }}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              className="chip hover:bg-blue-100"
              onClick={async () => {
                try {
                  setEditingFrom(true)
                  if (!navigator.geolocation) return
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords
                    const res = await fetch(`/api/nearby-stops?lat=${latitude}&lon=${longitude}&limit=1`)
                    const data = await res.json()
                    if (data?.results?.[0]) {
                      setFrom(data.results[0])
                      setQFrom('')
                    }
                    setEditingFrom(false)
                  })
                } catch {
                  setEditingFrom(false)
                }
              }}
              title="Use current location"
            >
              <span aria-hidden className="mr-1">
                📍
              </span>{' '}
              Use current location
            </button>
          </div>
          {saved?.addresses?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {saved.addresses.slice(0, 8).map((a: any) => (
                <button
                  key={a.id}
                  type="button"
                  className="chip hover:bg-blue-100"
                  title={`From ${a.label}`}
                  onClick={() => {
                    setFrom({
                      id: a.id,
                      name: a.label,
                      fullName: a.address,
                      latitude: a.latitude,
                      longitude: a.longitude,
                      type: 'saved',
                    })
                    setEditingFrom(false)
                    setQFrom('')
                  }}
                >
                  <span aria-hidden className="mr-1">
                    {/home|hem/i.test(a.label) ? '🏠' : /work|office|jobb/i.test(a.label) ? '🏢' : '📍'}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <Typeahead
            clearable
            label="To"
            value={editingTo ? qTo : to?.name ?? qTo}
            placeholder="Search stop or address"
            onChangeText={(t) => {
              setEditingTo(true)
              setQTo(t)
            }}
            onClear={() => {
              setEditingTo(true)
              setQTo('')
            }}
            onSelect={(s) => {
              setEditingTo(false)
              setTo({ ...(s as any), type: (s as any).type ?? 'unknown' } as Site)
              setQTo('')
            }}
          />

          {saved?.addresses?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {saved.addresses.slice(0, 8).map((a: any) => (
                <button
                  key={a.id}
                  type="button"
                  className="chip hover:bg-blue-100"
                  title={`Go to ${a.label}`}
                  onClick={() => {
                    setEditingTo(false)
                    setQTo('')
                    setTo({
                      id: a.id,
                      name: a.label,
                      fullName: a.address,
                      latitude: a.latitude,
                      longitude: a.longitude,
                      type: 'saved',
                    })
                  }}
                >
                  <span aria-hidden className="mr-1">
                    {/home|hem/i.test(a.label) ? '🏠' : /work|office|jobb/i.test(a.label) ? '🏢' : '📍'}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Time controls */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={useNow} onChange={(e) => setUseNow(e.target.checked)} />
            <span>Leave now</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="timeMode"
              checked={!arriveBy}
              onChange={() => setArriveBy(false)}
              disabled={useNow}
            />
            <span>Depart at</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="timeMode"
              checked={arriveBy}
              onChange={() => setArriveBy(true)}
              disabled={useNow}
            />
            <span>Arrive by</span>
          </label>
        </div>
        <div>
          <DateTimePicker value={when} onChange={(v) => setWhen(v)} disabled={useNow} />
        </div>
      </section>

      {canSearch ? (
        <section className="space-y-2">
          <h2 className="font-semibold">Plan</h2>
          <div className="border rounded p-3">
            <DestinationTrips from={from} dest={to} useNow={useNow} when={when} arriveBy={arriveBy} />
          </div>
        </section>
      ) : null}
    </main>
  )
}

function DestinationTrips({
  from,
  dest,
  useNow,
  when,
  arriveBy,
}: {
  from: any
  dest: any
  useNow: boolean
  when: string
  arriveBy: boolean
}) {
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
          const depart = firstLeg?.origin?.estimated || firstLeg?.origin?.planned || ''
          const arrive = lastLeg?.destination?.estimated || lastLeg?.destination?.planned || ''
          const lines = Array.isArray(j?.legs)
            ? j.legs
                .map((l: any) => l.transportation?.line || l.transportation?.name || l.mode || '')
                .join('|')
            : ''
          const key = `${depart}__${arrive}__${lines}`
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
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="text-sm text-gray-500">No trips</div>
          )}
        </div>
        <button type="button" className="text-sm text-blue-600" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide' : 'Show more'}
        </button>
      </div>
      {expanded && trips?.length ? (
        <ol className="mt-2 space-y-2">
          {trips.slice(0, 5).map((j: any, i: number) => {
            const depart = j.legs?.[0]?.origin
            const arrive = j.legs?.[j.legs.length - 1]?.destination
            const isActive = active === i
            return (
              <li key={i} className="text-sm">
                <button className="w-full text-left" onClick={() => setActive(isActive ? null : i)}>
                  {fmt(depart?.estimated || depart?.planned)} → {fmt(arrive?.estimated || arrive?.planned)} ·{' '}
                  {Math.round((j.duration ?? 0) / 60)} min
                </button>
                {isActive && (
                  <ol className="ml-3 mt-1 space-y-1 text-xs text-gray-700">
                    {j.legs?.map((l: any, k: number) => (
                      <li key={k}>
                        <ModeBadge mode={l.mode} />
                        <span className="text-gray-700">
                          {l.origin?.name} ({fmt(l.origin?.estimated || l.origin?.planned)}) →{' '}
                          {l.destination?.name} ({fmt(l.destination?.estimated || l.destination?.planned)})
                        </span>
                        <LineBadge mode={l.mode} line={l.line} />
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            )
          })}
        </ol>
      ) : null}
    </div>
  )
}
