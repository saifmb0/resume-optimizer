import { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Distributed rate limiting using Redis (works in serverless)
// Sliding window: 10 requests per 60 seconds with burst allowance
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: 'cvmaker:ratelimit',
})

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually client IP)
 * @returns true if rate limited, false if allowed
 */
export async function checkRateLimit(identifier: string): Promise<boolean> {
  const { success } = await ratelimit.limit(identifier)
  return !success // Return true if limited (request denied)
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
