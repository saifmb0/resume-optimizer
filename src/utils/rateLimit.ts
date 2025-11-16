import { NextRequest } from 'next/server'

// Simple in-memory rate limiting for basic protection
// For production, consider using Redis with @upstash/ratelimit
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function isRateLimited(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  const requestData = requestCounts.get(ip)!
  
  if (now > requestData.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (requestData.count >= maxRequests) {
    return true
  }
  
  requestData.count++
  return false
}

export function getClientIP(request: NextRequest): string {
  // Get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || cfConnectingIP || '127.0.0.1'
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip)
    }
  }
}, 60000) // Cleanup every minute
