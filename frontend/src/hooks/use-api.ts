"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface UseApiOptions<T> {
  initialData?: T
  dependencies?: any[]
  cacheKey?: string
  cacheDuration?: number // in milliseconds
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  errorMessage?: string
  successMessage?: string
  retries?: number
  retryDelay?: number
}

/**
 * Custom hook for API data fetching with caching, error handling, and abort control
 * 
 * @param fetchFn - The API fetch function to call
 * @param options - Configuration options
 * @returns Object containing data, loading state, error state, and refetch function
 */
export function useApi<T>(
  fetchFn: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const {
    initialData,
    dependencies = [],
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    onSuccess,
    onError,
    errorMessage = "Une erreur est survenue",
    successMessage,
    retries = 1,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Use refs to avoid dependency issues in useEffect
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const isMountedRef = useRef(true)

  // Check cache on initial load if cacheKey is provided
  useEffect(() => {
    if (cacheKey) {
      try {
        const cachedData = sessionStorage.getItem(cacheKey)
        const cachedTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`)
        
        if (cachedData && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10)
          const now = Date.now()
          
          // Only use cache if it's within the cache duration
          if (now - timestamp < cacheDuration) {
            const parsedData = JSON.parse(cachedData) as T
            setData(parsedData)
            return
          }
        }
      } catch (err) {
        console.warn('Error reading from cache:', err)
      }
    }
  }, [cacheKey, cacheDuration])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchData = useCallback(async (...args: any[]) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Reset retry count
    retryCountRef.current = 0
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    
    setIsLoading(true)
    setError(null)

    const attemptFetch = async (): Promise<T | undefined> => {
      try {
        const result = await fetchFn(...args)
        
        if (signal.aborted) return undefined
        
        // Update cache if cacheKey is provided
        if (cacheKey && result) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(result))
            sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString())
          } catch (err) {
            console.warn('Error writing to cache:', err)
          }
        }
        
        if (successMessage) {
          toast.success(successMessage)
        }
        
        if (onSuccess && result) {
          onSuccess(result)
        }
        
        return result
      } catch (err) {
        // Don't retry if request was aborted
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.log('Request was aborted')
          return undefined
        }
        
        // Retry logic
        if (retryCountRef.current < retries) {
          retryCountRef.current++
          console.log(`Retrying (${retryCountRef.current}/${retries})...`)
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return attemptFetch()
        }
        
        // If all retries failed or no retries configured
        const error = err instanceof Error ? err : new Error(String(err))
        
        if (onError) {
          onError(error)
        }
        
        toast.error(errorMessage)
        throw error
      }
    }

    try {
      const result = await attemptFetch()
      
      if (isMountedRef.current && result !== undefined) {
        setData(result)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      if (isMountedRef.current && !signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [fetchFn, cacheKey, onSuccess, onError, errorMessage, successMessage, retries, retryDelay])

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData()
  }, [...dependencies])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  }
}

export default useApi
