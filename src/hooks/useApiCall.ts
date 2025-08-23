import { useState, useEffect, useCallback } from 'react'

export interface ApiCallState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export function useApiCall<T>(url: string | null, options?: RequestInit) {
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    error: null,
    loading: false
  })

  const execute = useCallback(async () => {
    if (!url) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setState({ data, error: null, loading: false })
      return data
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error occurred')
      setState({ data: null, error: errorObj, loading: false })
      throw errorObj
    }
  }, [url, options])

  useEffect(() => {
    if (url) {
      execute()
    }
  }, [execute, url])

  const refetch = useCallback(() => {
    return execute()
  }, [execute])

  return {
    ...state,
    refetch
  }
}

export function useAsyncAction<T extends any[], R>() {
  const [state, setState] = useState<{
    loading: boolean
    error: Error | null
  }>({
    loading: false,
    error: null
  })

  const execute = useCallback(async (fn: (...args: T) => Promise<R>, ...args: T): Promise<R | null> => {
    setState({ loading: true, error: null })
    
    try {
      const result = await fn(...args)
      setState({ loading: false, error: null })
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error occurred')
      setState({ loading: false, error: errorObj })
      console.error('Async action failed:', errorObj)
      return null
    }
  }, [])

  return {
    ...state,
    execute
  }
}