'use client'

import { useState, useRef, useCallback } from 'react'
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm'
import { isWebGPUSupported } from '@/utils/gpuDetection'
import { OPTIMIZE_RESUME_SYSTEM_PROMPT, constructOptimizeResumePrompt } from '@/lib/prompts'

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
    const hasWebGPU = isWebGPUSupported()
    const processingMode: ProcessingMode =
        forceCloud || !hasWebGPU ? 'cloud' : 'edge'

    // Log mode determination on mount/change
    console.log('[HybridInference] Mode Determination:', {
        hasWebGPU,
        forceCloud,
        selectedMode: processingMode,
        reason: forceCloud ? 'User forced cloud' : !hasWebGPU ? 'No WebGPU support' : 'WebGPU available'
    })

    /**
     * Initialize the WebLLM engine with progress tracking
     */
    const initEngine = useCallback(async (): Promise<MLCEngine> => {
        if (engineRef.current) {
            console.log('[HybridInference:LOCAL] Engine already initialized, reusing')
            return engineRef.current
        }

        console.log('[HybridInference:LOCAL] ⚡ Initializing WebLLM engine...')
        console.log('[HybridInference:LOCAL] Model:', MODEL_ID)
        const startTime = performance.now()

        setProgress('Initializing AI engine...')

        const engine = await CreateMLCEngine(MODEL_ID, {
            initProgressCallback: (report) => {
                const percent = Math.round(report.progress * 100)
                setProgress(`Downloading model: ${percent}%`)
                if (percent % 25 === 0) {
                    console.log(`[HybridInference:LOCAL] Download progress: ${percent}%`)
                }
            },
        })

        const elapsed = performance.now() - startTime
        console.log(`[HybridInference:LOCAL] ✅ Engine initialized in ${elapsed.toFixed(0)}ms`)

        engineRef.current = engine
        setIsModelLoaded(true)
        setProgress('')

        return engine
    }, [])

    /**
     * Generate optimized resume using local WebLLM
     */
    const generateLocal = useCallback(async (params: OptimizeParams): Promise<string> => {
        console.log('[HybridInference:LOCAL] 🛡️ STARTING LOCAL GENERATION')
        console.log('[HybridInference:LOCAL] This runs ENTIRELY on your device - NO network call')
        const startTime = performance.now()

        const engine = await initEngine()

        setProgress('Generating...')

        // Use shared prompts for consistency across both local and cloud paths
        const userPrompt = constructOptimizeResumePrompt(
            params.resume,
            params.jobDescription,
            params.missingKeywords
        )

        console.log('[HybridInference:LOCAL] Prompt length:', userPrompt.length, 'chars')

        let output = ''
        let tokenCount = 0

        const response = await engine.chat.completions.create({
            messages: [
                { role: 'system', content: OPTIMIZE_RESUME_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 2048,
        })

        for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta?.content || ''
            output += delta
            tokenCount++
        }

        const elapsed = performance.now() - startTime
        console.log('[HybridInference:LOCAL] ✅ LOCAL GENERATION COMPLETE')
        console.log('[HybridInference:LOCAL] Stats:', {
            elapsed: `${elapsed.toFixed(0)}ms`,
            tokens: tokenCount,
            tokensPerSecond: (tokenCount / (elapsed / 1000)).toFixed(1),
            outputLength: output.length
        })

        return output
    }, [initEngine])

    /**
     * Generate optimized resume using server API (cloud fallback)
     */
    const generateCloud = useCallback(async (params: OptimizeParams): Promise<string> => {
        console.log('[HybridInference:CLOUD] ☁️ STARTING CLOUD GENERATION')
        console.log('[HybridInference:CLOUD] This calls /api/optimize-resume - NETWORK request')
        const startTime = performance.now()

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

        const elapsed = performance.now() - startTime
        console.log('[HybridInference:CLOUD] ✅ CLOUD GENERATION COMPLETE')
        console.log('[HybridInference:CLOUD] Stats:', {
            elapsed: `${elapsed.toFixed(0)}ms`,
            outputLength: optimizedResume.length
        })

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
