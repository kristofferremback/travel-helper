"use client"

import React from 'react'

function tone(mode?: string) {
  const m = (mode || '').toUpperCase()
  if (m.includes('METRO') || m.includes('TUNNELBANA')) return { text: 'text-green-700', ring: 'ring-green-200' }
  if (m.includes('TRAM')) return { text: 'text-emerald-700', ring: 'ring-emerald-200' }
  if (m.includes('TRAIN') || m.includes('RAIL')) return { text: 'text-purple-700', ring: 'ring-purple-200' }
  if (m.includes('BUS')) return { text: 'text-blue-700', ring: 'ring-blue-200' }
  if (m.includes('FERRY') || m.includes('SHIP')) return { text: 'text-cyan-700', ring: 'ring-cyan-200' }
  if (m.includes('WALK')) return { text: 'text-gray-700', ring: 'ring-gray-200' }
  return { text: 'text-slate-700', ring: 'ring-slate-200' }
}

function emoji(mode?: string) {
  const m = (mode || '').toUpperCase()
  if (m.includes('METRO') || m.includes('TUNNELBANA')) return '🚇'
  if (m.includes('TRAM')) return '🚊'
  if (m.includes('TRAIN') || m.includes('RAIL')) return '🚆'
  if (m.includes('BUS')) return '🚌'
  if (m.includes('FERRY') || m.includes('SHIP')) return '⛴️'
  if (m.includes('WALK')) return '🚶'
  return '🧭'
}

export default function ModeBadge({ mode }: { mode?: string }) {
  const e = emoji(mode)
  const colors = tone(mode)
  return (
    <span className={`inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium ${colors.text} ring-1 ${colors.ring}`}>
      <span className="mr-1.5" aria-hidden>{e}</span>
      <span className="capitalize">{mode || 'Leg'}</span>
    </span>
  )
}

// Simple SL-ish line color mapping
const SL_LINE_COLORS: Record<string, string> = {
  // Metro blue
  '10': 'bg-blue-600 text-white', '11': 'bg-blue-600 text-white',
  // Metro red
  '13': 'bg-red-600 text-white', '14': 'bg-red-600 text-white',
  // Metro green
  '17': 'bg-green-600 text-white', '18': 'bg-green-600 text-white', '19': 'bg-green-600 text-white',
}

export function LineBadge({ mode, line }: { mode?: string; line?: string | number | null }) {
  if (!line) return null
  const key = String(line)
  const metro = SL_LINE_COLORS[key]
  const base = metro ?? `bg-white/30 backdrop-blur-sm ${tone(mode).text} ring-1 ${tone(mode).ring}`
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${base} min-w-[2rem] justify-center`}>
      {line}
    </span>
  )
}
