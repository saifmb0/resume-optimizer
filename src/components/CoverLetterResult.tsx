'use client'

import { useState } from 'react'
import { ClipboardIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { pdf } from '@react-pdf/renderer'
import { CvDocument } from '@/documents/CvDocument'

interface MatchAnalysis {
  score: number
  reasoning: string
  missingKeywords: string[]
}

interface CoverLetterResultProps {
  coverLetter: string
  matchAnalysis?: MatchAnalysis
  onRegenerate: () => void
  isLoading: boolean
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

export default function CoverLetterResult({ coverLetter, matchAnalysis, onRegenerate, isLoading }: CoverLetterResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      // Generate PDF using declarative React-PDF renderer
      const blob = await pdf(<CvDocument content={coverLetter} />).toBlob()
      
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
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Results</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
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
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Keywords to Consider Adding
                    </h4>
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
          <div className="text-gray-900 dark:text-gray-100 leading-relaxed space-y-3 sm:space-y-4 text-sm sm:text-base">
            {coverLetter.split('\n').map((line, index) => {
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
        </div>

        {/* AdSense Placeholder */}
        <div className="mt-6 sm:mt-8 p-4 bg-gray-100 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Google AdSense Ad Placement</p>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">728x90 or 300x250 responsive ad unit</p>
        </div>
      </div>
    </div>
  )
}
