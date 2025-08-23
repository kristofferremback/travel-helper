"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Site } from '@/types'

interface UrlPrefillProps {
  onFromChange: (site: Site | null) => void
  onToChange: (site: Site | null) => void
}

export default function UrlPrefill({ onFromChange, onToChange }: UrlPrefillProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!searchParams) return

    const fromLat = searchParams.get('fromLat')
    const fromLon = searchParams.get('fromLon')
    const fromName = searchParams.get('fromName')
    const fromKind = searchParams.get('fromKind') || 'site'
    const toLat = searchParams.get('toLat')
    const toLon = searchParams.get('toLon')
    const toName = searchParams.get('toName')
    const toKind = searchParams.get('toKind') || 'site'

    if (fromLat && fromLon && fromName) {
      onFromChange({ 
        id: searchParams.get('fromId') || 'from', 
        name: fromName, 
        latitude: Number(fromLat), 
        longitude: Number(fromLon), 
        type: fromKind, 
        fullName: fromName 
      })
    }

    if (toLat && toLon && toName) {
      onToChange({ 
        id: searchParams.get('toId') || 'to', 
        name: toName, 
        latitude: Number(toLat), 
        longitude: Number(toLon), 
        type: toKind, 
        fullName: toName 
      })
    }
  }, [searchParams, onFromChange, onToChange])

  return null
}