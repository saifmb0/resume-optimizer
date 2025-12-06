import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { inputSchema, sanitizeInput, detectPromptInjectionWithContext, containsMaliciousContent } from '@/utils/validation'
import { checkRateLimit, getClientIP } from '@/utils/rateLimit'
import { SecurityLogger } from '@/utils/securityLogger'
import { 
  ANALYSIS_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  TONE_DESCRIPTIONS, 
  ANALYSIS_ONLY_SCHEMA,
  GENERATION_ONLY_SCHEMA,
  constructAnalysisPrompt,
  constructGenerationPrompt,
  type ToneType 
} from '@/lib/prompts'
import { z } from 'zod'

interface GenerateRequest {
  jobDescription: string
  resume: string
  tone: ToneType
  continueFrom?: string
}

// Phase 1: Analysis response schema
const analysisSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  missingKeywords: z.array(z.string()),
  strengths: z.array(z.string()),
})

// Phase 2: Generation response schema
const generationSchema = z.object({
  generatedDocument: z.string(),
})

type AnalysisResult = z.infer<typeof analysisSchema>

// Helper to create SSE-formatted data
function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  try {
    // Rate limiting check (Redis-backed, works in serverless)
    if (await checkRateLimit(clientIP)) {
      SecurityLogger.logRateLimitExceeded(clientIP, '/api/generate-cover-letter')
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // CORS and content type validation
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/json.' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate input with Zod schema
    let validatedInput: GenerateRequest
    try {
      validatedInput = inputSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Log validation failures with details
        error.errors.forEach(err => {
          const field = err.path[0] as string
          const fieldContent = body && typeof body === 'object' ? (body as Record<string, unknown>)[field] : undefined
          const contentStr = typeof fieldContent === 'string' ? fieldContent : undefined
          SecurityLogger.logValidationFailure(clientIP, field, err.message, contentStr)
        })
        
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
        return NextResponse.json(
          { error: `Validation failed: ${errorMessages}` },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const jobDescription = sanitizeInput(validatedInput.jobDescription)
    const resume = sanitizeInput(validatedInput.resume)
    const { tone, continueFrom } = validatedInput
    // Sanitize continuation text if provided
    const sanitizedContinueFrom = continueFrom ? sanitizeInput(continueFrom) : undefined

    // Check for malicious content first
    const maliciousContentCheck = containsMaliciousContent(jobDescription)
    if (maliciousContentCheck.isDetected) {
      SecurityLogger.logMaliciousContent(clientIP, jobDescription, maliciousContentCheck)
      return NextResponse.json(
        { error: `Invalid content detected in job description: ${maliciousContentCheck.pattern}` },
        { status: 400 }
      )
    }

    const resumeMaliciousCheck = containsMaliciousContent(resume)
    if (resumeMaliciousCheck.isDetected) {
      SecurityLogger.logMaliciousContent(clientIP, resume, resumeMaliciousCheck)
      return NextResponse.json(
        { error: `Invalid content detected in resume: ${resumeMaliciousCheck.pattern}` },
        { status: 400 }
      )
    }

    // Check for prompt injection attempts (context-aware)
    const promptInjectionCheck = detectPromptInjectionWithContext(jobDescription)
    if (promptInjectionCheck.isDetected) {
      SecurityLogger.logPromptInjectionAttempt(clientIP, jobDescription, promptInjectionCheck)
      return NextResponse.json(
        { error: `Prompt injection detected in job description: ${promptInjectionCheck.pattern}` },
        { status: 400 }
      )
    }

    const resumeInjectionCheck = detectPromptInjectionWithContext(resume)
    if (resumeInjectionCheck.isDetected) {
      SecurityLogger.logPromptInjectionAttempt(clientIP, resume, resumeInjectionCheck)
      return NextResponse.json(
        { error: `Prompt injection detected in resume: ${resumeInjectionCheck.pattern}` },
        { status: 400 }
      )
    }

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable not found')
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Get document type description
    const documentType = TONE_DESCRIPTIONS[tone]

    // Initialize Gemini API client
    const ai = new GoogleGenAI({
      apiKey
    })

    // Two-Phase Prompt Chaining for improved quality
    console.log('Starting two-phase prompt chain...')
    
    // Create a readable stream for SSE response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ============================================
          // PHASE 1: Analysis (Let the model "think")
          // ============================================
          console.log('Phase 1: Running ATS analysis...')
          
          const analysisPrompt = constructAnalysisPrompt(jobDescription, resume)
          
          const analysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
              systemInstruction: ANALYSIS_SYSTEM_PROMPT,
              responseMimeType: "application/json",
              responseSchema: ANALYSIS_ONLY_SCHEMA,
            },
            contents: analysisPrompt,
          })
          
          const analysisText = analysisResponse.text
          if (!analysisText) {
            controller.enqueue(encoder.encode(formatSSE('error', { error: 'Analysis phase failed. Please try again.' })))
            controller.close()
            return
          }
          
          // Parse and validate analysis
          let analysis: AnalysisResult
          try {
            const jsonAnalysis = JSON.parse(analysisText)
            analysis = analysisSchema.parse(jsonAnalysis)
          } catch (parseError) {
            console.error('Failed to parse analysis response:', parseError)
            controller.enqueue(encoder.encode(formatSSE('error', { error: 'AI analysis returned invalid format. Please try again.' })))
            controller.close()
            return
          }
          
          console.log('Phase 1 complete. Score:', analysis.score)
          
          // Send analysis immediately (fast feedback)
          controller.enqueue(encoder.encode(formatSSE('analysis', {
            score: analysis.score,
            reasoning: analysis.reasoning,
            missingKeywords: analysis.missingKeywords,
          })))
          
          // ============================================
          // PHASE 2: Generation (Use analysis context)
          // ============================================
          console.log('Phase 2: Generating document with analysis context...', 
            sanitizedContinueFrom ? '(continuation mode)' : '(fresh generation)')
          
          const generationPrompt = constructGenerationPrompt(
            jobDescription,
            resume,
            documentType,
            analysis,
            sanitizedContinueFrom // Pass continuation text if present
          )
          
          // Stream the generation for progressive rendering
          const generationStream = await ai.models.generateContentStream({
            model: "gemini-2.5-pro",
            config: {
              systemInstruction: GENERATION_SYSTEM_PROMPT,
              responseMimeType: "application/json",
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
            controller.enqueue(encoder.encode(formatSSE('error', { error: 'Document generation failed. Please try again.' })))
            controller.close()
            return
          }
          
          // Parse generation response
          let generatedDocument: string
          try {
            const jsonGeneration = JSON.parse(generationText)
            const parsed = generationSchema.parse(jsonGeneration)
            generatedDocument = parsed.generatedDocument
          } catch (parseError) {
            console.error('Failed to parse generation response:', parseError)
            controller.enqueue(encoder.encode(formatSSE('error', { error: 'AI generation returned invalid format. Please try again.' })))
            controller.close()
            return
          }
          
          // Validate output quality
          if (generatedDocument.length < 50) {
            console.error('Generated document too short:', generatedDocument.length, 'characters')
            controller.enqueue(encoder.encode(formatSSE('error', { error: 'Generated content appears incomplete. Please try again.' })))
            controller.close()
            return
          }
          
          console.log('Phase 2 complete. Document length:', generatedDocument.length)
          
          // Stream the document in chunks for progressive rendering
          const docChunks = generatedDocument.match(/.{1,100}/g) || []
          for (const chunk of docChunks) {
            controller.enqueue(encoder.encode(formatSSE('chunk', { text: chunk })))
            // Small delay for visual streaming effect
            await new Promise(resolve => setTimeout(resolve, 10))
          }
          
          // Send completion event
          controller.enqueue(encoder.encode(formatSSE('done', { 
            coverLetter: generatedDocument,
            generatedDocument: generatedDocument
          })))
          
          controller.close()
        } catch (error: unknown) {
          console.error('Prompt chain error:', error)
          const errorMessage = error instanceof Error ? error.message : String(error)
          
          if (errorMessage.includes('API key')) {
            controller.enqueue(encoder.encode(formatSSE('error', { error: 'API configuration error. Please try again later.' })))
          } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
            controller.enqueue(encoder.encode(formatSSE('error', { error: 'Service temporarily unavailable. Please try again later.' })))
          } else {
            controller.enqueue(encoder.encode(formatSSE('error', { error: 'An error occurred while generating content. Please try again.' })))
          }
          controller.close()
        }
      }
    })
    
    // Return SSE stream response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: unknown) {
    // Log error details for debugging (but don't expose to client)
    console.error('Error generating content:', error)
    
    // Handle specific API errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'API configuration error. Please try again later.' },
        { status: 500 }
      )
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // Generic error response (don't expose internal details)
    return NextResponse.json(
      { error: 'An error occurred while generating content. Please try again.' },
      { status: 500 }
    )
  }
}
