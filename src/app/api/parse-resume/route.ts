import { NextRequest, NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
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
    const bytes = await file.arrayBuffer()
    const uint8Array = new Uint8Array(bytes)

    // Parse PDF and extract text using PDFParse
    const parser = new PDFParse({ data: uint8Array })
    const textResult = await parser.getText()
    
    // Concatenate text from all pages
    const extractedText = textResult.pages
      .map((page: { text: string }) => page.text)
      .join('\n\n')
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
      .trim()
    
    // Cleanup parser resources
    await parser.destroy()

    if (!extractedText || extractedText.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. The file may be scanned/image-based or protected.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      text: extractedText,
      pageCount: textResult.total,
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
