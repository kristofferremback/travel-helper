"use client"

import React from 'react'
import { Card } from './Card'
import { Button } from './Button'

interface ErrorMessageProps {
  error: Error | string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ error, onRetry, className = '' }: ErrorMessageProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <Card className={`p-4 text-center border-red-200 bg-red-50/80 ${className}`}>
      <div className="text-red-600 text-sm mb-2">⚠️ {errorMessage}</div>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-red-600 hover:text-red-700"
        >
          Try again
        </Button>
      )}
    </Card>
  )
}

export function ErrorCard({ 
  title = "Something went wrong",
  error, 
  onRetry 
}: { 
  title?: string
  error: Error | string
  onRetry?: () => void 
}) {
  return (
    <Card className="p-6 text-center max-w-md mx-auto">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-semibold text-violet-800 mb-2">{title}</h2>
      <p className="text-violet-600 mb-4 text-sm">
        {typeof error === 'string' ? error : error.message}
      </p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  )
}

export default ErrorMessage