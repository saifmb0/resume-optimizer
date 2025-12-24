import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import {
  ANALYSIS_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  TONE_DESCRIPTIONS,
  ANALYSIS_ONLY_SCHEMA,
  GENERATION_ONLY_SCHEMA,
  constructAnalysisPrompt,
  constructGenerationPrompt,
  type ToneType,
} from '@/lib/prompts'

/**
 * Analysis result from Phase 1
 */
export interface AnalysisResult {
  score: number
  reasoning: string
  missingKeywords: string[]
  strengths: string[]
}

/**
 * Generation result from Phase 2
 */
export interface GenerationResult {
  generatedDocument: string
}

/**
 * Input for cover letter generation
 */
export interface CoverLetterInput {
  jobDescription: string
  resume: string
  tone: ToneType
  continueFrom?: string
}

/**
 * Streaming events emitted during generation
 */
export type StreamEvent =
  | { type: 'status'; data: { message: string } }
  | { type: 'analysis'; data: { score: number; reasoning: string; missingKeywords: string[] } }
  | { type: 'chunk'; data: { text: string } }
  | { type: 'done'; data: { coverLetter: string; generatedDocument: string } }
  | { type: 'error'; data: { error: string } }

/**
 * Service class for cover letter generation with two-phase prompt chaining
 * Implements Dependency Injection for testability
 */
export class CoverLetterGenerator {
  private readonly analysisSchema = z.object({
    score: z.number().min(0).max(100),
    reasoning: z.string(),
    missingKeywords: z.array(z.string()),
    strengths: z.array(z.string()),
  })

  private readonly generationSchema = z.object({
    generatedDocument: z.string(),
  })

  /**
   * Create a new cover letter generator
   * @param aiClient - Google GenAI client (injected for testing)
   */
  constructor(private readonly aiClient: GoogleGenAI) {}

  /**
   * Phase 1: Analyze resume against job description using ATS scoring
   */
  async analyzeResume(jobDescription: string, resume: string): Promise<AnalysisResult> {
    const analysisPrompt = constructAnalysisPrompt(jobDescription, resume)
    const model = process.env.PRIMARY_MODEL || 'gemini-2.0-flash'

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Gemini] Analysis using model: ${model}`)
    }

    try {
      const analysisResponse = await this.aiClient.models.generateContent({
        model,
        config: {
          systemInstruction: ANALYSIS_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: ANALYSIS_ONLY_SCHEMA,
        },
        contents: analysisPrompt,
      })

      const analysisText = analysisResponse.text
      if (!analysisText) {
        throw new Error('Analysis phase returned empty response')
      }

      // Parse and validate analysis
      try {
        const jsonAnalysis = JSON.parse(analysisText)
        return this.analysisSchema.parse(jsonAnalysis)
      } catch (parseError) {
        throw new Error(`Failed to parse analysis response: ${parseError}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Gemini] Analysis error with model ${model}:`, errorMsg)
      }
      throw error
    }
  }

  /**
   * Phase 2: Generate document using analysis context
   */
  async generateDocument(
    jobDescription: string,
    resume: string,
    tone: ToneType,
    analysis: AnalysisResult,
    continueFrom?: string
  ): Promise<string> {
    const documentType = TONE_DESCRIPTIONS[tone]
    const generationPrompt = constructGenerationPrompt(
      jobDescription,
      resume,
      documentType,
      analysis,
      continueFrom
    )
    const model = process.env.SECONDARY_MODEL || 'gemini-2.5-flash'

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Gemini] Generation using model: ${model}`)
    }

    try {
      const generationStream = await this.aiClient.models.generateContentStream({
        model,
        config: {
          systemInstruction: GENERATION_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: GENERATION_ONLY_SCHEMA,
        },
        contents: generationPrompt,
      })

      // Accumulate the generation response
      let generationText = ''

      for await (const chunk of generationStream) {
        const chunkText = chunk.text
        if (chunkText) {
          generationText += chunkText
        }
      }

      if (!generationText) {
        throw new Error('Generation phase returned empty response')
      }

      // Parse generation response
      try {
        const jsonGeneration = JSON.parse(generationText)
        const parsed = this.generationSchema.parse(jsonGeneration)
        return parsed.generatedDocument
      } catch (parseError) {
        throw new Error(`Failed to parse generation response: ${parseError}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Gemini] Generation error with model ${model}:`, errorMsg)
      }
      throw error
    }
  }

  /**
   * Generate cover letter with streaming support
   * Returns async generator that yields stream events
   */
  async *generateStream(input: CoverLetterInput): AsyncGenerator<StreamEvent> {
    try {
      const isDev = process.env.NODE_ENV === 'development'
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const analysisTimerId = `Gemini:Analysis-${requestId}`
      const generationTimerId = `Gemini:Generation-${requestId}`

      // Yield status immediately to show user progress
      yield {
        type: 'status',
        data: { message: 'Analyzing job description and resume...' },
      }

      // Phase 1: Analysis (heavy processing)
      if (isDev) console.time(analysisTimerId)
      const analysis = await this.analyzeResume(input.jobDescription, input.resume)
      if (isDev) console.timeEnd(analysisTimerId)

      // Yield analysis result
      yield {
        type: 'analysis',
        data: {
          score: analysis.score,
          reasoning: analysis.reasoning,
          missingKeywords: analysis.missingKeywords,
        },
      }

      // Update status for generation phase
      yield {
        type: 'status',
        data: { message: 'Writing your document...' },
      }

      // Phase 2: Generation
      if (isDev) console.time(generationTimerId)
      const generatedDocument = await this.generateDocument(
        input.jobDescription,
        input.resume,
        input.tone,
        analysis,
        input.continueFrom
      )
      if (isDev) console.timeEnd(generationTimerId)

      // Validate output quality
      if (generatedDocument.length < 50) {
        throw new Error(`Generated content too short: ${generatedDocument.length} characters`)
      }

      // Stream document in chunks
      const docChunks = generatedDocument.match(/.{1,100}/g) || []
      for (const chunk of docChunks) {
        yield {
          type: 'chunk',
          data: { text: chunk },
        }
        // Small delay for visual streaming effect
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      // Yield completion
      yield {
        type: 'done',
        data: {
          coverLetter: generatedDocument,
          generatedDocument: generatedDocument,
        },
      }
    } catch (error) {
      // Handle and yield error
      const errorMessage = error instanceof Error ? error.message : String(error)

      let userMessage = 'An error occurred while generating content. Please try again.'

      if (errorMessage.includes('API key')) {
        userMessage = 'API configuration error. Please try again later.'
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        userMessage = 'Service temporarily unavailable. Please try again later.'
      } else if (errorMessage.includes('parse')) {
        userMessage = 'AI returned invalid format. Please try again.'
      } else if (errorMessage.includes('empty')) {
        userMessage = 'AI generation failed. Please try again.'
      }

      yield {
        type: 'error',
        data: { error: userMessage },
      }
    }
  }
}

/**
 * Factory function to create CoverLetterGenerator with API key
 */
export function createCoverLetterGenerator(apiKey: string): CoverLetterGenerator {
  const aiClient = new GoogleGenAI({ apiKey })
  return new CoverLetterGenerator(aiClient)
}
