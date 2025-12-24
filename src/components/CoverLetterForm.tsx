'use client'

import { useState, useRef } from 'react'
import { DocumentTextIcon, BriefcaseIcon, UserIcon, ExclamationTriangleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { inputSchema, containsMaliciousContent, detectPromptInjectionWithContext } from '@/utils/validation'
import { usePersistedState } from '@/hooks/usePersistedState'
import { z } from 'zod'

interface FormData {
  jobDescription: string
  resume: string
  tone: string
}

interface CoverLetterFormProps {
  onGenerate: (data: FormData) => void
  isLoading: boolean
  statusMessage?: string
}

interface ValidationErrors {
  jobDescription?: string
  resume?: string
  general?: string
}

const toneOptions = [
  { value: 'CV', label: 'CV' },
  { value: 'CoverLetter', label: 'Cover Letter' },
  { value: 'Wdywtwh', label: 'Why do you want to work here?' }
]

export default function CoverLetterForm({ onGenerate, isLoading, statusMessage }: CoverLetterFormProps) {
  // Persist form data to localStorage to prevent data loss on refresh
  const [formData, setFormData, clearFormData] = usePersistedState<FormData>(
    'cv_draft',
    {
      jobDescription: '',
      resume: '',
      tone: 'CV'
    },
    500 // Debounce saves by 500ms
  )
  
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateInput = (data: FormData): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    try {
      inputSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path[0] as keyof ValidationErrors
          if (field === 'jobDescription' || field === 'resume') {
            errors[field] = err.message
          }
        })
      }
    }
    
    // Additional security checks with detailed detection
    const jobDescMalicious = containsMaliciousContent(data.jobDescription)
    if (jobDescMalicious.isDetected) {
      errors.jobDescription = `Security issue detected: ${jobDescMalicious.pattern} - "${jobDescMalicious.match}"`
    }
    
    const resumeMalicious = containsMaliciousContent(data.resume)
    if (resumeMalicious.isDetected) {
      errors.resume = `Security issue detected: ${resumeMalicious.pattern} - "${resumeMalicious.match}"`
    }

    const jobDescInjection = detectPromptInjectionWithContext(data.jobDescription)
    if (jobDescInjection.isDetected) {
      errors.jobDescription = `Prompt injection detected: ${jobDescInjection.pattern} - "${jobDescInjection.match}"`
    }
    
    const resumeInjection = detectPromptInjectionWithContext(data.resume)
    if (resumeInjection.isDetected) {
      errors.resume = `Prompt injection detected: ${resumeInjection.pattern} - "${resumeInjection.match}"`
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setErrors({})
    
    // Client-side validation
    const validationErrors = validateInput(formData)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsValidating(false)
      return
    }
    
    try {
      await onGenerate(formData)
    } catch {
      setErrors({ general: 'An error occurred. Please try again.' })
    } finally {
      setIsValidating(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, resume: 'Only PDF files are supported' }))
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, resume: 'File too large. Maximum size is 5MB.' }))
      return
    }

    setIsParsing(true)
    setErrors(prev => ({ ...prev, resume: undefined }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse PDF')
      }

      const result = await response.json()
      
      // Auto-fill the resume textarea with extracted text
      setFormData(prev => ({ ...prev, resume: result.text }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse PDF'
      setErrors(prev => ({ ...prev, resume: errorMessage }))
    } finally {
      setIsParsing(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            AI CV Generator
          </h1>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
            Paste your job description and resume to get a personalized CV in seconds
          </p>
        </div>

        {/* Error Display */}
        {errors.general && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Job Description */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
              <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              Job Description
            </label>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => handleInputChange('jobDescription', e.target.value)}
              placeholder="Paste the job description here..."
              className={`w-full h-32 sm:h-40 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base ${
                errors.jobDescription 
                  ? 'border-red-300 dark:border-red-700' 
                  : 'border-gray-300 dark:border-zinc-700'
              }`}
              required
              maxLength={5000}
            />
            {errors.jobDescription && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.jobDescription}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.jobDescription.length}/5000 characters
            </p>
          </div>

          {/* Resume */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-200">
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                Your Resume/Background
              </label>
              
              {/* PDF Upload Button */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                  disabled={isParsing || isLoading}
                />
                <label
                  htmlFor="resume-upload"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                    isParsing || isLoading
                      ? 'bg-gray-200 text-gray-400 dark:bg-zinc-700 dark:text-zinc-500 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                  }`}
                >
                  {isParsing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                      Parsing...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                      Upload PDF
                    </>
                  )}
                </label>
              </div>
            </div>
            <textarea
              value={formData.resume}
              onChange={(e) => handleInputChange('resume', e.target.value)}
              placeholder="Paste your resume content, upload a PDF, or enter your LinkedIn profile summary..."
              className={`w-full h-32 sm:h-40 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base ${
                errors.resume 
                  ? 'border-red-300 dark:border-red-700' 
                  : 'border-gray-300 dark:border-zinc-700'
              }`}
              required
              maxLength={10000}
            />
            {errors.resume && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400">{errors.resume}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.resume.length}/10000 characters
            </p>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
              <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              Output
            </label>
            <select
              value={formData.tone}
              onChange={(e) => handleInputChange('tone', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
            >
              {toneOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <button
                type="submit"
                disabled={isLoading || isValidating || !formData.jobDescription.trim() || !formData.resume.trim() || Object.keys(errors).length > 0}
                className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-md transition-colors duration-200 flex items-center text-sm sm:text-base"
              >
                {isLoading || isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    {isValidating ? 'Validating...' : (statusMessage || 'Generating...')}
                  </>
                ) : (
                  'Generate'
                )}
              </button>
              
              {/* Clear Draft Button */}
              {(formData.jobDescription.trim() || formData.resume.trim()) && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear your draft? This action cannot be undone.')) {
                      clearFormData()
                      setFormData({ jobDescription: '', resume: '', tone: 'CV' })
                      setErrors({})
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm underline"
                >
                  Clear Draft
                </button>
              )}
            </div>
            
            {/* Security Notice */}
            <p className="mt-3 sm:mt-4 text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto px-4">
              🔒 Your data is processed securely and not stored. All content is validated for safety.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
