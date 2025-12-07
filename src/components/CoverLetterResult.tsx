'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ClipboardIcon, ArrowDownTrayIcon, ArrowPathIcon, SparklesIcon, PencilIcon, CheckIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import { pdf } from '@react-pdf/renderer'
import { CvDocument } from '@/documents/CvDocument'
import { type ThemeId } from '@/documents/themes'
import InterviewQuestions from './InterviewQuestions'
import ThemeSelector from './ThemeSelector'
import StructuredEditor from './StructuredEditor'

interface MatchAnalysis {
  score: number
  reasoning: string
  missingKeywords: string[]
}

interface CoverLetterResultProps {
  coverLetter: string
  matchAnalysis?: MatchAnalysis
  onRegenerate: () => void
  onOptimize?: (missingKeywords: string[]) => void
  onContinue?: () => void // For incomplete stream recovery
  isLoading: boolean
  isOptimizing?: boolean
  isIncomplete?: boolean // True when stream ended without completion
  formData?: {
    jobDescription: string
    resume: string
    tone: string
  }
}

// ATS Score Gauge Component
function ATSScoreGauge({ score }: { score: number }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: '#22c55e', text: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' }
    if (score >= 60) return { stroke: '#eab308', text: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' }
    return { stroke: '#ef4444', text: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' }
  }
  
  const colors = getScoreColor(score)
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-zinc-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${colors.text}`}>{score}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">ATS Match Score</span>
    </div>
  )
}

export default function CoverLetterResult({ coverLetter, matchAnalysis, onRegenerate, onOptimize, onContinue, isLoading, isOptimizing, isIncomplete, formData }: CoverLetterResultProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [useRawEditor, setUseRawEditor] = useState(false) // Toggle between structured and raw
  const [editedContent, setEditedContent] = useState(coverLetter)
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('modern')
  // Debounced content for PDF generation - prevents re-renders while typing
  const [debouncedContent, setDebouncedContent] = useState(coverLetter)

  // Sync editedContent when coverLetter prop changes (e.g., regeneration)
  useEffect(() => {
    setEditedContent(coverLetter)
    setDebouncedContent(coverLetter)
    setIsEditing(false)
  }, [coverLetter])

  // Debounce content changes for PDF generation (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(editedContent)
    }, 500)
    return () => clearTimeout(timer)
  }, [editedContent])

  // Memoize PDF document to prevent re-renders while typing
  // Only regenerates when debounced content or theme changes
  const memoizedPdfDocument = useMemo(() => {
    return <CvDocument content={debouncedContent} theme={selectedTheme} />
  }, [debouncedContent, selectedTheme])

  // Use edited content for copy (immediate), debounced for PDF
  const currentContent = editedContent

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }, [currentContent])

  const handleDownloadPDF = useCallback(async () => {
    try {
      // Generate PDF using memoized document (uses debounced content)
      const blob = await pdf(memoizedPdfDocument).toBlob()
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'resume.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }, [memoizedPdfDocument])

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Results</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center px-3 sm:px-4 py-2 ${
                isEditing 
                  ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600' 
                  : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600'
              } text-white rounded-md transition-colors duration-200 text-sm sm:text-base`}
            >
              {isEditing ? (
                <>
                  <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Done
                </>
              ) : (
                <>
                  <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Edit
                </>
              )}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <ClipboardIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-3 sm:px-4 py-2 bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Export PDF
            </button>
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="flex items-center px-3 sm:px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 text-white rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {isLoading ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {/* Incomplete Generation Warning */}
        {isIncomplete && onContinue && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  Generation was interrupted. Your partial content is preserved.
                </span>
              </div>
              <button
                onClick={onContinue}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm font-medium"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                {isLoading ? 'Continuing...' : 'Continue Generation'}
              </button>
            </div>
          </div>
        )}

        {/* PDF Theme Selector */}
        <ThemeSelector
          selectedTheme={selectedTheme}
          onThemeChange={setSelectedTheme}
        />

        {/* ATS Match Analysis Section */}
        {matchAnalysis && (
          <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 rounded-lg border border-blue-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              ATS Match Analysis
            </h3>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Score Gauge */}
              <div className="flex-shrink-0 flex justify-center md:justify-start">
                <ATSScoreGauge score={matchAnalysis.score} />
              </div>
              
              {/* Analysis Details */}
              <div className="flex-1 space-y-4">
                {/* Reasoning */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {matchAnalysis.reasoning}
                  </p>
                </div>
                
                {/* Missing Keywords */}
                {matchAnalysis.missingKeywords && matchAnalysis.missingKeywords.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Keywords to Consider Adding
                      </h4>
                      {onOptimize && (
                        <button
                          onClick={() => onOptimize(matchAnalysis.missingKeywords)}
                          disabled={isOptimizing || isLoading}
                          className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-xs font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <SparklesIcon className="w-3.5 h-3.5 mr-1.5" />
                          {isOptimizing ? 'Optimizing...' : 'Optimize Resume'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {matchAnalysis.missingKeywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-zinc-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-zinc-700">
          {isEditing ? (
            /* Edit Mode */
            <div className="relative">
              {/* Editor Toggle */}
              <div className="flex items-center justify-end mb-3 gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Editor mode:</span>
                <button
                  onClick={() => setUseRawEditor(false)}
                  className={`px-2.5 py-1 text-xs rounded-l-md border transition-colors ${
                    !useRawEditor
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  Structured
                </button>
                <button
                  onClick={() => setUseRawEditor(true)}
                  className={`px-2.5 py-1 text-xs rounded-r-md border-t border-r border-b transition-colors flex items-center gap-1 ${
                    useRawEditor
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  <CodeBracketIcon className="w-3 h-3" />
                  Raw
                </button>
              </div>
              
              {useRawEditor ? (
                /* Raw Markdown Editor */
                <>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full min-h-[400px] p-4 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-mono leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Edit your content here..."
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Tip: Use **text** for bold headers, and *   for bullet points
                  </p>
                </>
              ) : (
                /* Structured Form Editor */
                <StructuredEditor
                  content={editedContent}
                  onChange={setEditedContent}
                />
              )}
            </div>
          ) : (
            /* View Mode: Rendered Markdown */
            <div className="text-gray-900 dark:text-gray-100 leading-relaxed space-y-3 sm:space-y-4 text-sm sm:text-base">
            {currentContent.split('\n').map((line, index) => {
              const trimmedLine = line.trim()
              
              if (trimmedLine === '') {
                return <div key={index} className="h-1 sm:h-2"></div>
              }
              
              // Bold headers (name, section headers)
              if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                const text = trimmedLine.replace(/\*\*/g, '')
                if (index === 0) {
                  // Name at the top
                  return (
                    <h1 key={index} className="text-lg sm:text-xl lg:text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                      {text}
                    </h1>
                  )
                } else {
                  // Section headers
                  return (
                    <h2 key={index} className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mt-4 sm:mt-6 mb-2 border-b border-gray-300 dark:border-zinc-600 pb-1">
                      {text}
                    </h2>
                  )
                }
              }
              
              // Mixed bold text with following content (like **Job Title**Content)
              if (trimmedLine.includes('**') && !trimmedLine.startsWith('*   ')) {
                // Handle cases where multiple entries might be concatenated
                const parts = trimmedLine.split('**')
                const elements = []
                
                for (let i = 0; i < parts.length; i++) {
                  const part = parts[i]
                  
                  if (part.trim() !== '') {
                    // Check if this appears to be a new entry (bold text starting with capital letter)
                    const isNewEntry = i > 0 && 
                                     i % 2 === 1 && 
                                     part.match(/^[A-Z]/) && 
                                     !part.includes('•') &&
                                     i > 1
                    
                    if (isNewEntry) {
                      // Break to new line for new entries
                      elements.push(<br key={`br-${i}`} />)
                    }
                    
                    if (i % 2 === 1) {
                      // Odd indices are bold text
                      elements.push(
                        <strong key={i} className="font-semibold text-gray-900 dark:text-gray-200">
                          {part}
                        </strong>
                      )
                    } else {
                      // Even indices are normal text
                      elements.push(<span key={i} className="text-gray-800 dark:text-gray-300">{part}</span>)
                    }
                  }
                }
                
                return (
                  <div key={index} className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                    {elements}
                  </div>
                )
              }
              
              // Contact info or job details with pipes
              if (trimmedLine.includes('|')) {
                return (
                  <p key={index} className="text-center text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                    {trimmedLine.split('|').map((part, i) => (
                      <span key={i}>
                        {part.trim()}
                        {i < trimmedLine.split('|').length - 1 && <span className="mx-1 sm:mx-2">•</span>}
                      </span>
                    ))}
                  </p>
                )
              }
              
              // Bullet points
              if (trimmedLine.startsWith('*   ')) {
                const bulletText = trimmedLine.replace('*   ', '')
                return (
                  <li key={index} className="ml-3 sm:ml-4 text-gray-800 dark:text-gray-300 text-xs sm:text-sm">
                    {bulletText.split('**').map((part, i) => {
                      if (i % 2 === 1) {
                        // Odd indices are bold text (between **)
                        return <strong key={i} className="font-semibold text-gray-900 dark:text-gray-200">{part}</strong>
                      }
                      return <span key={i} className="text-gray-800 dark:text-gray-300">{part}</span>
                    })}
                  </li>
                )
              }
              
              // Job titles or positions (text with pipe and dates)
              if (trimmedLine.includes(' | ') && !trimmedLine.startsWith('*')) {
                return (
                  <p key={index} className="font-semibold text-gray-900 dark:text-gray-200 text-xs sm:text-sm">
                    {trimmedLine}
                  </p>
                )
              }
              
              // Handle single asterisks for inline bold (*text*)
              if (trimmedLine.includes('*') && !trimmedLine.includes('**') && !trimmedLine.startsWith('*   ')) {
                return (
                  <p key={index} className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                    {trimmedLine.split('*').map((part, i) => {
                      if (i % 2 === 1 && part.trim() !== '') {
                        // Odd indices are bold text (between single *)
                        return <strong key={i} className="font-semibold text-gray-900 dark:text-gray-200">{part}</strong>
                      }
                      return <span key={i} className="text-gray-800 dark:text-gray-300">{part}</span>
                    })}
                  </p>
                )
              }
              
              // Regular paragraphs
              return (
                <p key={index} className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                  {trimmedLine}
                </p>
              )
            })}
          </div>
          )}
        </div>

        {/* Interview Prep Section */}
        {formData && (
          <InterviewQuestions 
            resume={formData.resume} 
            jobDescription={formData.jobDescription} 
          />
        )}
      </div>
    </div>
  )
}
