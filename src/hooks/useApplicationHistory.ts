'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Represents a saved application with all relevant data
 */
export interface SavedApplication {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  jobDescription: string
  resume: string
  tone: string
  generatedContent?: string
  matchAnalysis?: {
    score: number
    reasoning: string
    missingKeywords: string[]
  }
}

const STORAGE_KEY = 'cv_application_history'
const MAX_APPLICATIONS = 20 // Limit to prevent localStorage bloat

/**
 * Hook to manage application history with localStorage persistence.
 * Allows users to save, load, and switch between multiple applications.
 */
export function useApplicationHistory() {
  const [applications, setApplications] = useState<SavedApplication[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { applications: SavedApplication[]; activeId: string | null }
        setApplications(parsed.applications || [])
        setActiveId(parsed.activeId || null)
      }
    } catch (error) {
      console.warn('Failed to load application history:', error)
    }
    setIsHydrated(true)
  }, [])

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (!isHydrated) return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        applications,
        activeId
      }))
    } catch (error) {
      console.warn('Failed to save application history:', error)
    }
  }, [applications, activeId, isHydrated])

  /**
   * Get the currently active application
   */
  const activeApplication = applications.find(app => app.id === activeId) || null

  /**
   * Generate a unique ID for new applications
   */
  const generateId = () => `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  /**
   * Extract company name from job description for auto-naming
   */
  const extractCompanyName = (jobDescription: string): string => {
    // Try to find company name patterns
    const patterns = [
      /(?:at|for|with|join)\s+([A-Z][A-Za-z0-9\s&]+?)(?:\s+(?:is|are|we|as|to|,|\.|$))/i,
      /^([A-Z][A-Za-z0-9\s&]+?)(?:\s+(?:is|are|seeking|looking|hiring))/i,
      /company:\s*([A-Za-z0-9\s&]+)/i,
    ]
    
    for (const pattern of patterns) {
      const match = jobDescription.match(pattern)
      if (match?.[1]) {
        return match[1].trim().slice(0, 30)
      }
    }
    
    // Fallback: first meaningful words
    const words = jobDescription.trim().split(/\s+/).slice(0, 3).join(' ')
    return words.slice(0, 30) || 'Untitled'
  }

  /**
   * Save current form data as a new application or update existing
   */
  const saveApplication = useCallback((
    data: {
      jobDescription: string
      resume: string
      tone: string
      generatedContent?: string
      matchAnalysis?: SavedApplication['matchAnalysis']
    },
    existingId?: string
  ): string => {
    const now = new Date().toISOString()
    
    if (existingId) {
      // Update existing application
      setApplications(prev => prev.map(app => 
        app.id === existingId
          ? { ...app, ...data, updatedAt: now }
          : app
      ))
      return existingId
    } else {
      // Create new application
      const newApp: SavedApplication = {
        id: generateId(),
        name: extractCompanyName(data.jobDescription),
        createdAt: now,
        updatedAt: now,
        ...data
      }
      
      setApplications(prev => {
        // Add to beginning, enforce max limit
        const updated = [newApp, ...prev].slice(0, MAX_APPLICATIONS)
        return updated
      })
      
      setActiveId(newApp.id)
      return newApp.id
    }
  }, [])

  /**
   * Load an application by ID (set as active)
   */
  const loadApplication = useCallback((id: string) => {
    const app = applications.find(a => a.id === id)
    if (app) {
      setActiveId(id)
      return app
    }
    return null
  }, [applications])

  /**
   * Delete an application by ID
   */
  const deleteApplication = useCallback((id: string) => {
    setApplications(prev => prev.filter(app => app.id !== id))
    if (activeId === id) {
      setActiveId(null)
    }
  }, [activeId])

  /**
   * Rename an application
   */
  const renameApplication = useCallback((id: string, newName: string) => {
    setApplications(prev => prev.map(app =>
      app.id === id
        ? { ...app, name: newName.slice(0, 50), updatedAt: new Date().toISOString() }
        : app
    ))
  }, [])

  /**
   * Clear the active selection (start fresh)
   */
  const clearActive = useCallback(() => {
    setActiveId(null)
  }, [])

  /**
   * Clear all history
   */
  const clearAllHistory = useCallback(() => {
    setApplications([])
    setActiveId(null)
  }, [])

  return {
    applications,
    activeApplication,
    activeId,
    isHydrated,
    saveApplication,
    loadApplication,
    deleteApplication,
    renameApplication,
    clearActive,
    clearAllHistory,
  }
}
