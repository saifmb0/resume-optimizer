'use client'

import { useState, useRef, useCallback } from 'react'
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm'
import { isWebGPUSupported } from '@/utils/gpuDetection'

// Model configuration
const MODEL_ID = 'Llama-3.2-3B-Instruct-q4f32_1-MLC'

export type ProcessingMode = 'edge' | 'cloud'

interface OptimizeParams {
    resume: string
    missingKeywords: string[]
    jobDescription: string
}

interface UseHybridInferenceOptions {
    forceCloud?: boolean
}

interface UseHybridInferenceReturn {
    generate: (params: OptimizeParams) => Promise<string>
    processingMode: ProcessingMode
    progress: string
    isLoading: boolean
    isModelLoaded: boolean
    error: string | null
}

/**
 * Hybrid Inference Hook
 * Automatically chooses between local WebLLM (edge) and server API (cloud)
 * based on device capabilities and user preference
 */
export function useHybridInference(
    options: UseHybridInferenceOptions = {}
): UseHybridInferenceReturn {
    const { forceCloud = false } = options

    const [progress, setProgress] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [isModelLoaded, setIsModelLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const engineRef = useRef<MLCEngine | null>(null)

    // Determine processing mode based on GPU support and user preference
    const processingMode: ProcessingMode =
        forceCloud || !isWebGPUSupported() ? 'cloud' : 'edge'

    /**
     * Initialize the WebLLM engine with progress tracking
     */
    const initEngine = useCallback(async (): Promise<MLCEngine> => {
        if (engineRef.current) {
            return engineRef.current
        }

        setProgress('Initializing AI engine...')

        const engine = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback: (report) => {
                const percent = Math.round(report.progress * 100)
                setProgress(`Downloading model: ${percent}%`)
            },
        })

        engineRef.current = engine
        setIsModelLoaded(true)
        setProgress('')

        return engine
    }, [])

    /**
     * Generate optimized resume using local WebLLM
     */
    const generateLocal = useCallback(async (params: OptimizeParams): Promise<string> => {
        const engine = await initEngine()

        setProgress('Generating...')

        const systemPrompt = `You are an expert Resume Layout Engineer. Your job is to enhance a resume by naturally incorporating missing keywords while ensuring clean, professional formatting.

CRITICAL CONTENT RULES:
- ONLY enhance existing content - NEVER invent new experiences, skills, or qualifications
- Keywords must be incorporated naturally into existing bullet points and descriptions
- Maintain the original structure and format of the resume
- Keep the same truthful information, just optimized for ATS
- If a keyword cannot be naturally incorporated without lying, skip it

STRICT FORMATTING RULES:
1. Use "### Section Name" for ALL section headers
2. Use "- " (dash space) for ALL bullet points
3. Keep bullet points concise: 1-2 lines maximum each
4. Use **bold text** ONLY for inline emphasis (company names, job titles)

PAGE LENGTH CONSTRAINT:
- The output MUST fit on exactly ONE A4 page
- Be extremely concise - remove all fluff words
- Prioritize quantifiable achievements

OUTPUT FORMAT:
Return ONLY the optimized resume text with clean markdown formatting. No explanations.`

        const userPrompt = `Here is the resume to optimize:

${params.resume}

Here is the job description for context:
${params.jobDescription}

Missing keywords to naturally incorporate where truthful:
${params.missingKeywords.join(', ')}

Return the optimized resume with these keywords naturally woven into existing content.`

        let output = ''

        const response = await engine.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 2048,
        })

        for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta?.content || ''
            output += delta
        }

        return output
    }, [initEngine])

    /**
     * Generate optimized resume using server API (cloud fallback)
     */
    const generateCloud = useCallback(async (params: OptimizeParams): Promise<string> => {
        setProgress('Optimizing via cloud...')

        const response = await fetch('/api/optimize-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to optimize resume')
        }

        const { optimizedResume } = await response.json()
        return optimizedResume
    }, [])

    /**
     * Unified generate function - automatically routes to edge or cloud
     */
    const generate = useCallback(async (params: OptimizeParams): Promise<string> => {
        setIsLoading(true)
        setError(null)

        try {
            if (processingMode === 'edge') {
                return await generateLocal(params)
            } else {
                return await generateCloud(params)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Generation failed'
            setError(message)
            throw err
        } finally {
            setIsLoading(false)
            setProgress('')
        }
    }, [processingMode, generateLocal, generateCloud])

    return {
        generate,
        processingMode,
        progress,
        isLoading,
        isModelLoaded,
        error,
    }
}
