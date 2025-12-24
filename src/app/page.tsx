'use client'

import { useState, useEffect, useCallback } from 'react'
import CoverLetterForm from '@/components/CoverLetterForm'
import CoverLetterResult from '@/components/CoverLetterResult'
import DarkModeToggle from '@/components/DarkModeToggle'
import ApplicationHistory from '@/components/ApplicationHistory'
import { parseSSEStream, type SSEBenchmark } from '@/hooks/useSSEStream'
import { useApplicationHistory } from '@/hooks/useApplicationHistory'

interface FormData {
  jobDescription: string
  resume: string
  tone: string
}

interface MatchAnalysis {
  score: number
  reasoning: string
  missingKeywords: string[]
}

export default function Home() {
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false)
  const [formData, setFormData] = useState<FormData | null>(null)
  // Track incomplete generation for "Continue" feature
  const [incompleteText, setIncompleteText] = useState<string | null>(null)
  // Track current application ID for history
  const [currentAppId, setCurrentAppId] = useState<string | null>(null)
  // Track benchmark metrics
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<SSEBenchmark | null>(null)
  // Track real-time status messages during generation
  const [statusMessage, setStatusMessage] = useState<string>('')

  // Application history management
  const {
    applications,
    activeId,
    saveApplication,
    loadApplication,
    deleteApplication,
    renameApplication,
    clearActive,
  } = useApplicationHistory()

  // Auto-save when generation completes
  const handleAutoSave = useCallback(() => {
    if (formData && coverLetter && matchAnalysis && !isLoading) {
      const appId = saveApplication({
        jobDescription: formData.jobDescription,
        resume: formData.resume,
        tone: formData.tone,
        generatedContent: coverLetter,
        matchAnalysis,
      }, currentAppId || undefined)
      setCurrentAppId(appId)
    }
  }, [formData, coverLetter, matchAnalysis, isLoading, currentAppId, saveApplication])

  useEffect(() => {
    handleAutoSave()
  }, [handleAutoSave])

  // Handle loading an application from history
  const handleLoadFromHistory = (id: string) => {
    const app = loadApplication(id)
    if (app) {
      setFormData({
        jobDescription: app.jobDescription,
        resume: app.resume,
        tone: app.tone,
      })
      setCoverLetter(app.generatedContent || '')
      setMatchAnalysis(app.matchAnalysis || null)
      setCurrentAppId(id)
      setIncompleteText(null)
    }
  }

  // Start a new application (clear current state)
  const handleNewApplication = () => {
    setCoverLetter('')
    setMatchAnalysis(null)
    setFormData(null)
    setCurrentAppId(null)
    setIncompleteText(null)
    setBenchmarkMetrics(null)
    clearActive()
  }

  const handleGenerate = async (data: FormData, continueFrom?: string) => {
    setIsLoading(true)
    setFormData(data)
    setIncompleteText(null)
    setStatusMessage('Starting...')
    
    // Start the timer BEFORE the network request
    const startTime = performance.now()
    
    // If continuing, keep existing content; otherwise reset
    if (!continueFrom) {
      setCoverLetter('')
      setMatchAnalysis(null)
    }

    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          // Pass partial text for continuation
          continueFrom: continueFrom || undefined,
        }),
      })

      if (!response.ok) {
        // Handle non-streaming error responses
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          alert(`Failed to generate output: ${errorData.error || response.statusText}`)
        } else {
          alert(`Failed to generate output: ${response.statusText}`)
        }
        return
      }

      // Handle SSE stream with robust parser
      let errorOccurred = false
      const result = await parseSSEStream(response, {
        onStatus: (message) => setStatusMessage(message),
        onAnalysis: (data) => setMatchAnalysis(data),
        onChunk: (text) => setCoverLetter(continueFrom ? continueFrom + text : text),
        onDone: (letter) => setCoverLetter(continueFrom ? continueFrom + letter : letter),
        onError: (error) => {
          errorOccurred = true
          alert(error)
        },
        onIncomplete: (partialText) => {
          // Stream ended without completion - offer continue option
          setIncompleteText(partialText)
        },
        onBenchmark: (metrics) => {
          setBenchmarkMetrics(metrics)
          if (process.env.NODE_ENV === 'development') {
            console.table(metrics)
          }
        }
      }, startTime)
      
      if (errorOccurred) return
      
      // If stream didn't complete but we have partial text
      if (!result.completed && result.partialText.length > 100) {
        setIncompleteText(result.partialText)
      }
    } catch (error) {
      console.error('Error:', error)
      // If we have partial content, offer to continue
      if (coverLetter.length > 100) {
        setIncompleteText(coverLetter)
      } else {
        alert('Failed to generate output. Please try again.')
      }
    } finally {
      setIsLoading(false)
      setStatusMessage('')
    }
  }

  const handleRegenerate = () => {
    if (formData) {
      handleGenerate(formData)
    }
  }

  const handleContinueGeneration = () => {
    if (formData && incompleteText) {
      handleGenerate(formData, incompleteText)
    }
  }

  const handleOptimize = async (missingKeywords: string[]) => {
    if (!formData) return
    
    setIsOptimizing(true)
    try {
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: formData.resume,
          missingKeywords,
          jobDescription: formData.jobDescription,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Failed to optimize: ${errorData.error || response.statusText}`)
        return
      }

      const { optimizedResume } = await response.json()
      
      // Update the form data with optimized resume and regenerate
      const newFormData = { ...formData, resume: optimizedResume }
      setFormData(newFormData)
      
      // Regenerate with the optimized resume
      handleGenerate(newFormData)
    } catch (error) {
      console.error('Optimization error:', error)
      alert('Failed to optimize resume. Please try again.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleStartOver = () => {
    handleNewApplication()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Free AI CV Generator
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300">
                Create personalized, professional CVs & Cover letters in seconds with Google Gemini
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <ApplicationHistory
                applications={applications}
                activeId={activeId}
                onSelect={handleLoadFromHistory}
                onDelete={deleteApplication}
                onRename={renameApplication}
                onNewApplication={handleNewApplication}
              />
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="py-6 sm:py-8">
        {!coverLetter && !matchAnalysis ? (
          <>
            <CoverLetterForm onGenerate={handleGenerate} isLoading={isLoading} statusMessage={statusMessage} />

            {/* Features Section */}
            <div className="max-w-4xl mx-auto mt-12 sm:mt-16 px-4 sm:px-6">
              <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Lightning Fast</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Generate professional Resumes & Cover letters in under 30 seconds</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">AI-Powered</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Uses advanced Google Gemini AI to create tailored, compelling content</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">100% Private</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">No account required. Your data is never stored</p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto mt-12 sm:mt-16 px-4 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900 dark:text-gray-100">Frequently Asked Questions</h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 sm:p-6 shadow border dark:border-zinc-700">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">How does this work?</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Simply paste the job description and your resume, choose your output, and our AI will generate a personalized document tailored to the specific job.</p>
                </div>

                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 sm:p-6 shadow border dark:border-zinc-700">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Is this really free?</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Yes! This tool is completely free to use. We support the service through non-intrusive advertisements.</p>
                </div>

                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 sm:p-6 shadow border dark:border-zinc-700">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Do you store my information?</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">No, we don&apos;t store any of your personal information, resume data, or generated content. Everything is processed in real-time and discarded.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <CoverLetterResult
              coverLetter={coverLetter}
              matchAnalysis={matchAnalysis ?? undefined}
              onRegenerate={handleRegenerate}
              onOptimize={handleOptimize}
              onContinue={incompleteText ? handleContinueGeneration : undefined}
              isLoading={isLoading}
              isOptimizing={isOptimizing}
              isIncomplete={!!incompleteText}
              formData={formData ?? undefined}
              benchmarkMetrics={benchmarkMetrics ?? undefined}
            />

            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={handleStartOver}
                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-md transition-colors duration-200 text-sm sm:text-base"
              >
                Create Another
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-zinc-950 text-white py-8 sm:py-12 mt-12 sm:mt-5">

        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center mb-4">
          <a href="https://saifmb.com">
            <span className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-lg sm:text-2xl font-bold">
              Seifeldin Mahmoud
            </span>
          </a>
        </div>


        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="mb-4 text-white text-sm sm:text-base">© 2025 AI Resume Generator. Made with ❤️ for job seekers worldwide.</p>
          <p className="text-gray-400 dark:text-gray-300 text-xs sm:text-sm">
            Powered by Google Gemini AI • No login required • 100% free
          </p>
        </div>
      </footer>
    </div>
  )
}
