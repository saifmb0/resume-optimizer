import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { sanitizeInput, detectPromptInjectionWithContext, containsMaliciousContent } from '@/utils/validation'
import { checkRateLimit, getClientIP } from '@/utils/rateLimit'
import { SecurityLogger } from '@/utils/securityLogger'
import { z } from 'zod'

// Input validation schema
const optimizeResumeSchema = z.object({
  resume: z.string().min(10, 'Resume must be at least 10 characters').max(15000, 'Resume too long'),
  missingKeywords: z.array(z.string()).min(1, 'At least one keyword required').max(20, 'Too many keywords'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters').max(10000, 'Job description too long'),
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
    
    const systemInstruction = `You are an expert Resume Layout Engineer. Your job is to enhance a resume by naturally incorporating missing keywords while ensuring clean, professional formatting.

CRITICAL CONTENT RULES:
- ONLY enhance existing content - NEVER invent new experiences, skills, or qualifications
- Keywords must be incorporated naturally into existing bullet points and descriptions
- Maintain the original structure and format of the resume
- Keep the same truthful information, just optimized for ATS
- If a keyword cannot be naturally incorporated without lying, skip it

STRICT FORMATTING RULES (MUST FOLLOW):
1. Use "### Section Name" for ALL section headers (e.g., "### Experience", "### Education")
2. NEVER use "**Section Name**" for headers - this causes rendering issues
3. Use "- " (dash space) for ALL bullet points
4. Keep bullet points concise: 1-2 lines maximum each
5. Do NOT add excessive blank lines between sections or bullets
6. Use "**bold text**" ONLY for inline emphasis within sentences (e.g., company names, job titles)

PAGE LENGTH CONSTRAINT (CRITICAL):
- The output MUST fit on exactly ONE A4 page
- Be extremely concise - remove all fluff words and unnecessary adjectives
- Group related achievements into single impactful bullets
- Prioritize quantifiable achievements over generic descriptions
- If content is too long, cut the least impactful bullets first

OUTPUT FORMAT:
Return ONLY the optimized resume text with clean markdown formatting. No explanations, commentary, or markdown code blocks.`

    const userPrompt = `Here is the resume to optimize:

${sanitizedResume}

Here is the job description for context:
${sanitizedJobDesc}

Missing keywords to naturally incorporate where truthful:
${sanitizedKeywords.join(', ')}

Return the optimized resume with these keywords naturally woven into existing content where appropriate.`

    const model = process.env.PRIMARY_MODEL || 'gemini-2.0-flash'
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Gemini] Resume optimization using model: ${model}`)
    }

    const response = await ai.models.generateContent({
      model,
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
