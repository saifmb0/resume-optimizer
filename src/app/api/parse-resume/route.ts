import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIP } from '@/utils/rateLimit'
import { SecurityLogger } from '@/utils/securityLogger'

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)

  try {
    // Rate limiting
    if (await checkRateLimit(clientIP)) {
      SecurityLogger.logRateLimitExceeded(clientIP, '/api/parse-resume')
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Get form data with file
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Dynamic import to avoid pdf-parse test file issue during build
    // pdf-parse v1.1.1 tries to load a test PDF at import time
    const pdf = (await import('pdf-parse')).default
    
    // Parse PDF using pdf-parse v1.1.1 functional API
    const data = await pdf(buffer)
    
    // Normalize text
    const extractedText = data.text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
      .trim()

    // Check for scanned/image-based PDFs
    // If we have pages but very little text, it's likely a scanned document
    if (data.numpages > 0 && extractedText.length < 200) {
      return NextResponse.json(
        { error: 'This PDF appears to be scanned or image-based. Please upload a text-based PDF, or copy/paste your resume content directly.' },
        { status: 400 }
      )
    }

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. The file may be empty or corrupted.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      text: extractedText,
      pageCount: data.numpages,
      characterCount: extractedText.length,
    })

  } catch (error) {
    console.error('Error parsing PDF:', error)
    
    // Handle specific pdf-parse errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      return NextResponse.json(
        { error: 'This PDF is password-protected and cannot be parsed.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to parse PDF. Please try a different file.' },
      { status: 500 }
    )
  }
}

// Handle accidental GET requests gracefully
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Please use POST with a PDF file.' },
    { status: 405 }
  )
}
