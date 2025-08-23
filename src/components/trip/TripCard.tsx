"use client"

import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export type TripPlace = {
  kind: 'site' | 'address'
  id?: string
  name: string
  address?: string
  latitude: number
  longitude: number
  type?: string
}

export type TripData = {
  id: string
  label?: string | null
  fromPlace: TripPlace
  toPlace: TripPlace
  pinned?: boolean
  position?: number | null
}

export interface TripCardProps {
  trip: TripData
  onRun?: (trip: TripData) => void
  onEdit?: (trip: TripData) => void
  onDelete?: (id: string) => void
  onPin?: (trip: TripData) => void
  showActions?: boolean
  variant?: 'default' | 'interactive'
  children?: React.ReactNode
}

export function TripCard({
  trip,
  onRun,
  onEdit,
  onDelete,
  onPin,
  showActions = true,
  variant = 'default',
  children
}: TripCardProps) {
  const displayLabel = trip.label || `${trip.fromPlace.name} → ${trip.toPlace.name}`
  const routeDescription = `${trip.fromPlace.name} → ${trip.toPlace.name}`

  return (
    <Card variant={variant} className="p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-violet-800 truncate">
          {displayLabel}
        </div>
        {trip.label && (
          <div className="text-sm text-violet-600/80 truncate">
            {routeDescription}
          </div>
        )}
        {children}
      </div>

      {showActions && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {onRun && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRun(trip)}
            >
              Run
            </Button>
          )}
          
          {onPin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPin(trip)}
            >
              {trip.pinned ? 'Unpin' : 'Pin'}
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(trip)}
            >
              Edit
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(trip.id)}
            >
              🗑️ Remove
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default TripCard