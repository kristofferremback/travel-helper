"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card } from './Card'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="p-6 text-center max-w-md mx-auto">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-violet-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-violet-600 mb-4 text-sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="primary"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </Button>
        </Card>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary