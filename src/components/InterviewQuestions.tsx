'use client'

import { useState } from 'react'
import { AcademicCapIcon, ChatBubbleLeftRightIcon, LightBulbIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface InterviewQuestion {
  question: string
  context: string
}

interface InterviewQuestionsData {
  technicalQuestions: InterviewQuestion[]
  behavioralQuestions: InterviewQuestion[]
  tips: string[]
}

interface InterviewQuestionsProps {
  resume: string
  jobDescription: string
}

export default function InterviewQuestions({ resume, jobDescription }: InterviewQuestionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<InterviewQuestionsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate questions')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 rounded-lg border border-indigo-200 dark:border-zinc-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <AcademicCapIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Interview Prep
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get personalized interview questions based on your resume and this job
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <AcademicCapIcon className="w-5 h-5 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-zinc-750 dark:hover:to-zinc-750 transition-colors"
      >
        <div className="flex items-center">
          <AcademicCapIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Interview Preparation
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Technical Questions */}
          <div>
            <div className="flex items-center mb-4">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                Technical Questions ({data.technicalQuestions.length})
              </h4>
            </div>
            <div className="space-y-4">
              {data.technicalQuestions.map((q, idx) => (
                <div key={idx} className="bg-blue-50 dark:bg-zinc-800 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {idx + 1}. {q.question}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    💡 {q.context}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Questions */}
          <div>
            <div className="flex items-center mb-4">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                Behavioral Questions ({data.behavioralQuestions.length})
              </h4>
            </div>
            <div className="space-y-4">
              {data.behavioralQuestions.map((q, idx) => (
                <div key={idx} className="bg-green-50 dark:bg-zinc-800 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {idx + 1}. {q.question}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    💡 {q.context}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {data.tips && data.tips.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <LightBulbIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" />
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                  Preparation Tips
                </h4>
              </div>
              <ul className="space-y-2">
                {data.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-amber-500 mr-2">✓</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regenerate Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              {isLoading ? 'Regenerating...' : '↻ Generate different questions'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
