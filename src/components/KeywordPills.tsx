'use client'

import { useState, useCallback } from 'react'
import { ClipboardDocumentIcon, CheckIcon, SparklesIcon, LightBulbIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface KeywordPillsProps {
  keywords: string[]
  onOptimize?: (keywords: string[]) => void
  onGetSuggestions?: (keyword: string) => Promise<string[]>
  isOptimizing?: boolean
  isLoading?: boolean
  generatedContent?: string
}

interface KeywordSuggestion {
  keyword: string
  suggestions: string[]
  isLoading: boolean
}

export default function KeywordPills({ 
  keywords, 
  onOptimize, 
  onGetSuggestions,
  isOptimizing, 
  isLoading,
  generatedContent 
}: KeywordPillsProps) {
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [activeSuggestion, setActiveSuggestion] = useState<KeywordSuggestion | null>(null)

  // Copy keyword to clipboard
  const handleCopyKeyword = useCallback(async (keyword: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(keyword)
      setCopiedKeyword(keyword)
      setTimeout(() => setCopiedKeyword(null), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  // Toggle keyword selection for batch optimization
  const toggleKeywordSelection = useCallback((keyword: string) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev)
      if (next.has(keyword)) {
        next.delete(keyword)
      } else {
        next.add(keyword)
      }
      return next
    })
  }, [])

  // Check if keyword might already be in the content
  const isKeywordPresent = useCallback((keyword: string): boolean => {
    if (!generatedContent) return false
    const lowerContent = generatedContent.toLowerCase()
    const lowerKeyword = keyword.toLowerCase()
    return lowerContent.includes(lowerKeyword)
  }, [generatedContent])

  // Get contextual suggestions for where to add a keyword
  const handleGetSuggestions = useCallback(async (keyword: string) => {
    if (!onGetSuggestions) return
    
    setActiveSuggestion({ keyword, suggestions: [], isLoading: true })
    
    try {
      const suggestions = await onGetSuggestions(keyword)
      setActiveSuggestion({ keyword, suggestions, isLoading: false })
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      setActiveSuggestion(null)
    }
  }, [onGetSuggestions])

  // Optimize selected keywords (or all if none selected)
  const handleOptimize = useCallback(() => {
    if (!onOptimize) return
    
    const keywordsToOptimize = selectedKeywords.size > 0 
      ? Array.from(selectedKeywords)
      : keywords
    
    onOptimize(keywordsToOptimize)
    setSelectedKeywords(new Set())
  }, [onOptimize, selectedKeywords, keywords])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Keywords to Consider Adding
          {selectedKeywords.size > 0 && (
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
              ({selectedKeywords.size} selected)
            </span>
          )}
        </h4>
        {onOptimize && (
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || isLoading}
            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-xs font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <SparklesIcon className="w-3.5 h-3.5 mr-1.5" />
            {isOptimizing 
              ? 'Optimizing...' 
              : selectedKeywords.size > 0 
                ? `Optimize ${selectedKeywords.size} Keywords` 
                : 'Optimize All'
            }
          </button>
        )}
      </div>
      
      {/* Keyword Pills */}
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, idx) => {
          const isPresent = isKeywordPresent(keyword)
          const isSelected = selectedKeywords.has(keyword)
          const isCopied = copiedKeyword === keyword
          
          return (
            <button
              key={idx}
              onClick={() => toggleKeywordSelection(keyword)}
              onDoubleClick={(e) => handleCopyKeyword(keyword, e)}
              className={`group inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                transition-all duration-200 cursor-pointer
                ${isPresent 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700 line-through opacity-60' 
                  : isSelected
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-2 border-blue-400 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                }`}
              title={isPresent ? 'Already in content' : 'Click to select, double-click to copy'}
            >
              {keyword}
              
              {/* Copy button on hover */}
              <span 
                onClick={(e) => handleCopyKeyword(keyword, e)}
                className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isCopied ? (
                  <CheckIcon className="w-3 h-3 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="w-3 h-3" />
                )}
              </span>
              
              {/* Suggestion button */}
              {onGetSuggestions && !isPresent && (
                <span
                  onClick={(e) => { e.stopPropagation(); handleGetSuggestions(keyword); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600"
                  title="Get placement suggestions"
                >
                  <LightBulbIcon className="w-3 h-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Selected keywords hint */}
      {selectedKeywords.size > 0 && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Click &quot;Optimize {selectedKeywords.size} Keywords&quot; to incorporate selected keywords into your resume, 
          or click keywords to deselect.
        </p>
      )}
      
      {/* Suggestion Panel */}
      {activeSuggestion && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Suggestions for &quot;{activeSuggestion.keyword}&quot;
              </span>
            </div>
            <button
              onClick={() => setActiveSuggestion(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          {activeSuggestion.isLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Generating suggestions...
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {activeSuggestion.suggestions.length > 0 ? (
                activeSuggestion.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">
                  No specific suggestions available. Try adding this keyword to a relevant bullet point describing your experience.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
      
      {/* Usage hints */}
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        💡 Click keywords to select for batch optimization. Double-click to copy. Green = already in content.
      </p>
    </div>
  )
}
