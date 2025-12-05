'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook that persists state to localStorage with debounced saves.
 * Prevents data loss on page refresh for long-form content.
 * 
 * @param key - localStorage key
 * @param initialValue - default value if nothing in storage
 * @param debounceMs - milliseconds to wait before saving (default: 500ms)
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  debounceMs: number = 500
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Track if we've hydrated from localStorage
  const [isHydrated, setIsHydrated] = useState(false)
  const [state, setState] = useState<T>(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as T
        setState(parsed)
      }
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error)
    }
    setIsHydrated(true)
  }, [key])

  // Debounced save to localStorage
  const saveToStorage = useCallback((value: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error)
      }
    }, debounceMs)
  }, [key, debounceMs])

  // Wrapper around setState that also persists
  const setPersistedState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const nextValue = typeof value === 'function' 
        ? (value as (prev: T) => T)(prev)
        : value
      
      // Only persist after initial hydration
      if (isHydrated) {
        saveToStorage(nextValue)
      }
      
      return nextValue
    })
  }, [isHydrated, saveToStorage])

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error)
    }
  }, [key])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, setPersistedState, clearPersistedState]
}
