import { SecurityDetection } from './validation'

interface SecurityEvent {
  timestamp: string
  event: string
  details: Record<string, unknown>
  ip?: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export class SecurityLogger {
  static logSuspiciousActivity(
    event: string, 
    details: Record<string, unknown>, 
    ip?: string, 
    severity: SecurityEvent['severity'] = 'MEDIUM'
  ) {
    const logData: SecurityEvent = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip,
      severity
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 SECURITY_EVENT:', logData)
    }
    
    // In production, you would send this to your monitoring service
    // Examples: Sentry, DataDog, CloudWatch, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external monitoring service
      // await fetch('/api/security-log', { method: 'POST', body: JSON.stringify(logData) })
    }
  }

  static logRateLimitExceeded(ip: string, endpoint: string) {
    this.logSuspiciousActivity(
      'RATE_LIMIT_EXCEEDED',
      { endpoint, requestsExceeded: true },
      ip,
      'HIGH'
    )
  }

  static logPromptInjectionAttempt(ip: string, content: string, detection?: SecurityDetection) {
    this.logSuspiciousActivity(
      'PROMPT_INJECTION_ATTEMPT',
      { 
        contentSnippet: content.substring(0, 100),
        contentLength: content.length,
        detectedPattern: detection?.pattern,
        matchedContent: detection?.match,
        detectionType: detection?.type
      },
      ip,
      'HIGH'
    )
  }

  static logMaliciousContent(ip: string, content: string, detection?: SecurityDetection) {
    this.logSuspiciousActivity(
      'MALICIOUS_CONTENT_DETECTED',
      { 
        contentSnippet: content.substring(0, 100),
        contentLength: content.length,
        detectedPattern: detection?.pattern,
        matchedContent: detection?.match,
        detectionType: detection?.type
      },
      ip,
      'HIGH'
    )
  }

  static logValidationFailure(ip: string, field: string, error: string, content?: string) {
    this.logSuspiciousActivity(
      'VALIDATION_FAILURE',
      {
        field,
        error,
        contentSnippet: content?.substring(0, 50),
        contentLength: content?.length
      },
      ip,
      'MEDIUM'
    )
  }
}
