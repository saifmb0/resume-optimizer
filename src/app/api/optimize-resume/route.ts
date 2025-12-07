import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { sanitizeInput, detectPromptInjectionWithContext, containsMaliciousContent } from '@/utils/validation'
import { checkRateLimit, getClientIP } from '@/utils/rateLimit'
import { SecurityLogger } from '@/utils/securityLogger'
import { z } from 'zod'

// Input validation schema
const optimizeResumeSchema = z.object({
  resume: z.string().min(50, 'Resume must be at least 50 characters').max(15000, 'Resume too long'),
  missingKeywords: z.array(z.string()).min(1, 'At least one keyword required').max(20, 'Too many keywords'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters').max(10000, 'Job description too long'),
})

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)
  
  try {
    // Rate limiting - returns true if rate limited (denied)
    const isRateLimited = await checkRateLimit(ip)
    if (isRateLimited) {
      SecurityLogger.logRateLimitExceeded(ip, '/api/optimize-resume')
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const parseResult = optimizeResumeSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { resume, missingKeywords, jobDescription } = parseResult.data
    
    // Sanitize inputs
    const sanitizedResume = sanitizeInput(resume)
    const sanitizedJobDesc = sanitizeInput(jobDescription)
    const sanitizedKeywords = missingKeywords.map(k => sanitizeInput(k))
    
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
    
    const systemInstruction = `You are an expert Resume Optimization Specialist. Your job is to enhance a resume by naturally incorporating missing keywords that are relevant to a target job.

CRITICAL RULES:
- ONLY enhance existing content - NEVER invent new experiences, skills, or qualifications
- Keywords must be incorporated naturally into existing bullet points and descriptions
- Maintain the original structure and format of the resume
- Keep the same truthful information, just optimized for ATS
- If a keyword cannot be naturally incorporated without lying, skip it
- Preserve all markdown formatting from the original

OUTPUT: Return ONLY the optimized resume text with markdown formatting. No explanations or commentary.`

    const userPrompt = `Here is the resume to optimize:

${sanitizedResume}

Here is the job description for context:
${sanitizedJobDesc}

Missing keywords to naturally incorporate where truthful:
${sanitizedKeywords.join(', ')}

Return the optimized resume with these keywords naturally woven into existing content where appropriate.`

    const response = await ai.models.generateContent({
      model: process.env.PRIMARY_MODEL || "gemini-2.0-flash",
      config: {
        systemInstruction,
      },
      contents: userPrompt,
    })

    const optimizedResume = response.text || ''

    return NextResponse.json({ optimizedResume })
    
  } catch (error) {
    console.error('Resume optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize resume' },
      { status: 500 }
    )
  }
}
