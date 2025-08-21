"use client"

export const dynamic = 'force-dynamic'

import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import Typeahead, { TypeaheadItem } from '@/components/Typeahead'

const fetcher = (url: string) => axios.get(url).then((r) => r.data)

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

type Trip = {
  id: string
  label?: string | null
  fromPlace: Place
  toPlace: Place
  pinned?: boolean
  position?: number | null
}

function toPlace(item: TypeaheadItem): Place {
  const lat = Number(item.latitude ?? 0)
  const lon = Number(item.longitude ?? 0)
  const t = (item.type || '').toLowerCase()
  if (t === 'address') {
    return { kind: 'address', name: item.name, address: item.fullName || item.name, latitude: lat, longitude: lon }
  }
  return { kind: 'site', id: String(item.id), name: item.name, latitude: lat, longitude: lon, type: t }
}

export default function TripsPage() {
  const { data: session, status } = useSession()
  const { data, mutate } = useSWR(session ? '/api/saved-trips' : null, fetcher)
  const [from, setFrom] = useState<Place | null>(null)
  const [to, setTo] = useState<Place | null>(null)
  const [label, setLabel] = useState('')

  const canSave = useMemo(() => !!from && !!to, [from, to])

  async function saveTrip() {
  if (!from || !to) return
  const res = await axios.post('/api/saved-trips', { label: label || undefined, fromPlace: from, toPlace: to })
  const created = res?.data?.trip
  // Optimistic update
  await mutate((prev: any) => {
    const prevTrips = Array.isArray(prev?.trips) ? prev.trips : []
      return { trips: [created, ...prevTrips] }
     }, { revalidate: true })
    setLabel('')
  setFrom(null)
  setTo(null)
  }
 
  async function remove(id: string) {
    // Optimistic removal
    await mutate((prev: any) => {
      const prevTrips = Array.isArray(prev?.trips) ? prev.trips : []
      return { trips: prevTrips.filter((t: any) => t.id !== id) }
    }, { revalidate: false })
    await axios.delete(`/api/saved-trips/${id}`)
    // Revalidate to be safe
    mutate()
  }

  function runLink(t: Trip) {
    const fp = t.fromPlace
    const tp = t.toPlace
    const qs = new URLSearchParams()
    qs.set('fromName', fp.kind === 'address' ? fp.name : fp.name)
    qs.set('fromLat', String(fp.latitude))
    qs.set('fromLon', String(fp.longitude))
    qs.set('fromKind', fp.kind)
    if ((fp as any).id) qs.set('fromId', String((fp as any).id))

    qs.set('toName', tp.kind === 'address' ? tp.name : tp.name)
    qs.set('toLat', String(tp.latitude))
    qs.set('toLon', String(tp.longitude))
    qs.set('toKind', tp.kind)
    if ((tp as any).id) qs.set('toId', String((tp as any).id))

    return `/?${qs.toString()}`
  }

  if (status === 'loading') {
    return <div className="p-8 text-center text-violet-700">Loading…</div>
  }
  if (!session) {
    return (
      <main className="space-y-6">
        <div className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-xl font-semibold text-violet-800 mb-2">Sign in required</h2>
          <p className="text-violet-600">Please sign in to save and manage your trips.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="space-y-6">
      <section className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧭</span>
          <h2 className="text-lg font-semibold text-white/90 drop-shadow">Add trip</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Typeahead
              label="From"
              value={from ? (from.kind === 'address' ? from.name : from.name) : undefined}
              onChangeText={() => setFrom(null)}
              onSelect={(item) => setFrom(toPlace(item))}
              placeholder="Search stop or address"
              clearable
              onClear={() => setFrom(null)}
            />
            <Typeahead
              label="To"
              value={to ? (to.kind === 'address' ? to.name : to.name) : undefined}
              onChangeText={() => setTo(null)}
              onSelect={(item) => setTo(toPlace(item))}
              placeholder="Search stop or address"
              clearable
              onClear={() => setTo(null)}
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white/90 drop-shadow mb-1">Label (optional)</label>
              <input className="input" placeholder="Optional label" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-medium text-white shadow hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canSave} onClick={saveTrip}>
              <span>✨</span>
              <span>Save trip</span>
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🗺️</span>
          <h2 className="text-lg font-semibold text-white">Saved trips</h2>
        </div>
        <ul className="space-y-3">
          {data?.trips?.map((t: Trip) => (
            <li key={t.id} className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] flex items-center justify-between">
              <div>
                <div className="font-medium text-violet-800">
                  {t.label || `${t.fromPlace.name} → ${t.toPlace.name}`}
                </div>
                <div className="text-sm text-violet-600/80">{t.fromPlace.name} → {t.toPlace.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-sm px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 transition-colors" onClick={() => remove(t.id)}>🗑️ Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
