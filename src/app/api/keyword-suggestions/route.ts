import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type } from '@google/genai'
import { sanitizeInput, detectPromptInjectionWithContext, containsMaliciousContent } from '@/utils/validation'
import { checkRateLimit, getClientIP } from '@/utils/rateLimit'
import { SecurityLogger } from '@/utils/securityLogger'
import { z } from 'zod'

// Input validation schema
const suggestKeywordSchema = z.object({
  keyword: z.string().min(1, 'Keyword required').max(100, 'Keyword too long'),
  resume: z.string().min(50, 'Resume must be at least 50 characters').max(15000, 'Resume too long'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters').max(10000, 'Job description too long'),
})

// Response schema for structured output
const SUGGESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: 'A specific suggestion for how to incorporate the keyword'
      },
      description: 'List of 2-4 specific suggestions'
    }
  },
  required: ['suggestions']
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  
  try {
    // Rate limiting
    const isRateLimited = await checkRateLimit(ip)
    if (isRateLimited) {
      SecurityLogger.logRateLimitExceeded(ip, '/api/keyword-suggestions')
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const parseResult = suggestKeywordSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { keyword, resume, jobDescription } = parseResult.data
    
    // Sanitize inputs
    const sanitizedKeyword = sanitizeInput(keyword)
    const sanitizedResume = sanitizeInput(resume)
    const sanitizedJobDesc = sanitizeInput(jobDescription)
    
    // Security checks
    const resumeInjection = detectPromptInjectionWithContext(sanitizedResume)
    if (resumeInjection.isDetected) {
      SecurityLogger.logPromptInjectionAttempt(ip, sanitizedResume, resumeInjection)
      return NextResponse.json({ error: 'Invalid content detected' }, { status: 400 })
    }
    
    const maliciousCheck = containsMaliciousContent(sanitizedResume)
    if (maliciousCheck.isDetected) {
      SecurityLogger.logMaliciousContent(ip, sanitizedResume, maliciousCheck)
      return NextResponse.json({ error: 'Invalid content detected' }, { status: 400 })
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })
    
    const systemInstruction = `You are an expert Resume Writing Consultant. Given a keyword from a job description and a candidate's resume, suggest 2-4 SPECIFIC ways to naturally incorporate that keyword.

RULES:
- Each suggestion must reference a SPECIFIC bullet point or section from the resume
- Only suggest changes that are TRUTHFUL based on the resume content
- Provide the exact rewording or addition
- Be concise and actionable
- If the keyword cannot be naturally added truthfully, suggest the closest alternative

FORMAT: Provide specific, actionable suggestions like:
- "In your [Company] experience, change 'Managed team projects' to 'Led agile team projects using [keyword] methodology'"
- "Add '[keyword]' to your Skills section under Technical Skills"
- "In your Summary, mention your experience with [keyword]"`

    const userPrompt = `Keyword to incorporate: "${sanitizedKeyword}"

Job Description Context:
${sanitizedJobDesc}

Candidate's Resume:
${sanitizedResume}

Provide 2-4 specific suggestions for how to naturally and truthfully incorporate "${sanitizedKeyword}" into this resume.`

    const model = process.env.PRIMARY_MODEL || 'gemini-2.0-flash'
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Gemini] Keyword suggestions using model: ${model}`)
    }

    const response = await ai.models.generateContent({
      model,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: SUGGESTION_SCHEMA,
      },
      contents: userPrompt,
    })

    const responseText = response.text || '{}'
    let suggestions: string[] = []
    
    try {
      const parsed = JSON.parse(responseText)
      suggestions = parsed.suggestions || []
    } catch {
      // If JSON parsing fails, try to extract suggestions from text
      suggestions = ['Consider adding this keyword to relevant experience bullet points']
    }

    return NextResponse.json({ suggestions })
    
  } catch (error) {
    console.error('Keyword suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
