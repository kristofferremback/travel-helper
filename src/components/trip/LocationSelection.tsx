"use client"

import React from 'react'
import Typeahead from '@/components/Typeahead'
import { Button, Chip } from '@/components/ui'
import type { Site } from '@/types'

interface LocationSelectionProps {
  from: Site | null
  to: Site | null
  savedPlaces: Site[]
  onFromChange: (site: Site | null) => void
  onToChange: (site: Site | null) => void
  onUserInteraction: () => void
  isLoadingLocation?: boolean
}

export default function LocationSelection({
  from,
  to,
  savedPlaces,
  onFromChange,
  onToChange,
  onUserInteraction,
  isLoadingLocation = false
}: LocationSelectionProps) {
  
  const handleCurrentLocation = async () => {
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
    } catch (error) {
      console.error('Failed to get current location:', error)
    }
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Typeahead
            label="From"
            value={from ? from.name : undefined}
            onChangeText={() => onFromChange(null)}
            onSelect={(s) => {
              onUserInteraction()
              onFromChange({
                ...(s as any),
                type: (s as any).type ?? 'unknown'
              } as Site)
            }}
            placeholder="Search stop or address"
            clearable
            onClear={() => onFromChange(null)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={isLoadingLocation}
            >
              <span>📍</span>
              {isLoadingLocation ? 'Loading...' : 'Current location'}
            </Button>
            {savedPlaces.map((place) => (
              <Chip
                key={`from-${place.id}`}
                variant="location"
                size="sm"
                icon={<span>📍</span>}
                onClick={() => { 
                  onUserInteraction()
                  onFromChange(place) 
                }}
              >
                {place.name}
              </Chip>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <Typeahead
            label="To"
            value={to ? to.name : undefined}
            onChangeText={() => onToChange(null)}
            onSelect={(s) => {
              onUserInteraction()
              onToChange({
                ...(s as any),
                type: (s as any).type ?? 'unknown'
              } as Site)
            }}
            placeholder="Search stop or address"
            clearable
            onClear={() => onToChange(null)}
          />
          <div className="flex flex-wrap gap-2">
            {savedPlaces.map((place) => (
              <Chip
                key={`to-${place.id}`}
                variant="location"
                size="sm"
                icon={<span>🎯</span>}
                onClick={() => { 
                  onUserInteraction()
                  onToChange(place) 
                }}
              >
                {place.name}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}