"use client"

import React, { useState } from 'react'

export const dynamic = 'force-dynamic'
import useSWR from 'swr'
import axios from 'axios'
import { useSession } from 'next-auth/react'

type Address = { id: string; label: string; description?: string; address: string; latitude: number; longitude: number }

type Site = { id: string; name: string; latitude?: number; longitude?: number; type: string; fullName?: string }

const fetcher = (url: string) => axios.get(url).then((r) => r.data)

export default function AddressesPage() {
  const { data: session, status } = useSession()
  const { data, mutate } = useSWR(session ? '/api/addresses' : null, fetcher)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Site | null>(null)
  const { data: options } = useSWR(q.length > 1 ? `/api/sites/search?q=${encodeURIComponent(q)}` : null, fetcher)
  const [form, setForm] = useState({ label: '', description: '' })

  async function addAddress() {
    if (!picked || !form.label) return
    if (picked.latitude == null || picked.longitude == null) return
    await axios.post('/api/addresses', {
      label: form.label,
      description: form.description,
      address: picked.fullName || picked.name,
      latitude: picked.latitude,
      longitude: picked.longitude,
    })
    setForm({ label: '', description: '' })
    setPicked(null)
    setQ('')
    mutate()
  }

  async function remove(id: string) {
    await axios.delete(`/api/addresses/${id}`)
    mutate()
  }

  if (status === "loading") {
    return (
      <main className="space-y-6">
        <div className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-8 text-center">
          <div className="animate-spin text-3xl mb-4">✨</div>
          <p className="text-violet-700">Loading your cosmic destinations...</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="space-y-6">
        <div className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-xl font-semibold text-violet-800 mb-2">Sign in required</h2>
          <p className="text-violet-600">Please sign in to save and manage your cosmic destinations.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="space-y-6">
      <section className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌟</span>
          <h2 className="text-lg font-semibold text-violet-800">Add cosmic destination</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm text-violet-700 font-medium mb-1">Search address/stop</label>
            <input className="w-full rounded-xl border border-violet-200/50 bg-white/40 backdrop-blur-sm px-4 py-3 text-sm shadow-sm placeholder:text-violet-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200" value={picked ? picked.name : q} onChange={(e) => { setPicked(null); setQ(e.target.value) }} />
            {picked == null && options?.results?.length > 0 && (
              <ul className="bg-white/90 backdrop-blur-sm rounded-xl mt-2 max-h-60 overflow-auto shadow-lg border border-violet-200/30">
                {options.results.map((s: Site) => (
                  <li key={s.id} className="p-3 hover:bg-violet-50/50 cursor-pointer transition-colors duration-200 border-b border-violet-100/30 last:border-0" onClick={() => { setPicked(s) }}>
                    <div className="flex items-center justify-between">
                      <span className="text-violet-800">{s.name}</span>
                      <span className="inline-flex items-center rounded-full bg-violet-100/80 px-2 py-1 text-xs font-medium text-violet-700 capitalize">{s.type}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-violet-700 font-medium mb-1">Label</label>
              <input className="w-full rounded-xl border border-violet-200/50 bg-white/40 backdrop-blur-sm px-4 py-3 text-sm shadow-sm placeholder:text-violet-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm text-violet-700 font-medium mb-1">Description</label>
              <input className="w-full rounded-xl border border-violet-200/50 bg-white/40 backdrop-blur-sm px-4 py-3 text-sm shadow-sm placeholder:text-violet-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-medium text-white shadow hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!picked || !form.label} onClick={addAddress}>
              <span>✨</span>
              <span>Save destination</span>
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🌌</span>
          <h2 className="text-lg font-semibold text-white">Saved destinations</h2>
        </div>
        <ul className="space-y-3">
          {data?.addresses?.map((a: Address) => (
            <li key={a.id} className="bg-gradient-to-br from-white/60 to-violet-50/40 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01] flex items-center justify-between">
              <div>
                <div className="font-medium text-violet-800 flex items-center gap-2">
                  <span className="text-sm">
                    {/home|hem/i.test(a.label) ? '🏠' : /work|office|jobb/i.test(a.label) ? '🏢' : '📍'}
                  </span>
                  {a.label}
                </div>
                <div className="text-sm text-violet-600/80">{a.address}</div>
                {a.description && <div className="text-sm text-violet-500/60">{a.description}</div>}
              </div>
              <button 
                className="text-white/60 text-sm hover:text-white/80 transition-colors duration-200 px-3 py-1 hover:bg-red-500/20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg" 
                onClick={() => remove(a.id)}
              >
                🗑️ Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
