"use client"

import React from 'react'
import Typeahead from '@/components/Typeahead'
import { Button, Chip } from '@/components/ui'
import type { Site } from '@/types'

interface LocationSearchSectionProps {
  from: Site | null
  to: Site | null
  savedPlaces: Site[]
  hasUserInteracted: boolean
  onFromChange: (site: Site | null) => void
  onToChange: (site: Site | null) => void
  onUserInteraction: () => void
}

export default function LocationSearchSection({
  from,
  to,
  savedPlaces,
  hasUserInteracted,
  onFromChange,
  onToChange,
  onUserInteraction
}: LocationSearchSectionProps) {
  return (
    <section className="space-y-3">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Typeahead
            label="From"
            value={from ? from.name : undefined}
            onChangeText={(text) => {
              // Only clear 'from' if the input is completely empty
              if (!text || text.trim() === '') {
                onFromChange(null)
              }
            }}
            onSelect={(s) => {
              onUserInteraction()
              onFromChange({ ...(s as any), type: (s as any).type ?? 'unknown' } as Site)
            }}
            placeholder="Search stop or address"
            clearable
            onClear={() => onFromChange(null)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  onUserInteraction()
                  if (!navigator.geolocation) return
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords
                    const res = await fetch(`/api/nearby-stops?lat=${latitude}&lon=${longitude}&limit=1`)
                    const data = await res.json()
                    if (data?.results?.[0]) {
                      onFromChange(data.results[0])
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
                onClick={() => {
                  onUserInteraction()
                  onFromChange(p)
                }}
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
                onToChange(null)
              }
            }}
            onSelect={(s) => {
              onUserInteraction()
              onToChange({ ...(s as any), type: (s as any).type ?? 'unknown' } as Site)
            }}
            placeholder="Search stop or address"
            clearable
            onClear={() => onToChange(null)}
          />
          <div className="flex flex-wrap gap-2">
            {savedPlaces.map((p) => (
              <Chip
                key={`to-${p.id}`}
                variant="location"
                icon={<span>🎯</span>}
                onClick={() => {
                  onUserInteraction()
                  onToChange(p)
                }}
              >
                {p.name}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}