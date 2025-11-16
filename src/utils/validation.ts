import { z } from 'zod'

export interface SecurityDetection {
  isDetected: boolean
  type?: 'malicious_content' | 'prompt_injection'
  pattern?: string
  match?: string
}

export const inputSchema = z.object({
  jobDescription: z.string()
    .min(10, 'Job description must be at least 10 characters')
    .max(5000, 'Job description cannot exceed 5000 characters')
    .refine(val => !containsMaliciousContent(val).isDetected, 'Invalid content detected'),
  resume: z.string()
    .min(10, 'Resume must be at least 10 characters') 
    .max(10000, 'Resume cannot exceed 10000 characters')
    .refine(val => !containsMaliciousContent(val).isDetected, 'Invalid content detected'),
  tone: z.enum(['CV', 'CoverLetter', 'Wdywtwh'])
})

export function containsMaliciousContent(text: string): SecurityDetection {
  const suspiciousPatterns = [
    { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, name: 'script_tag' },
    { pattern: /javascript:/gi, name: 'javascript_protocol' },
    { pattern: /on\w+\s*=/gi, name: 'event_handler' },
    { pattern: /data:text\/html/gi, name: 'data_url_html' },
    { pattern: /vbscript:/gi, name: 'vbscript_protocol' },
    { pattern: /eval\s*\(/gi, name: 'eval_function' },
    { pattern: /expression\s*\(/gi, name: 'css_expression' }
  ]
  
  for (const { pattern, name } of suspiciousPatterns) {
    const match = text.match(pattern)
    if (match) {
      return {
        isDetected: true,
        type: 'malicious_content',
        pattern: name,
        match: match[0]
      }
    }
  }
  
  return { isDetected: false }
}

export function sanitizeInput(input: string): string {
  // Remove potential HTML/JS content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim()
}

export function detectPromptInjection(text: string): SecurityDetection {
  const injectionPatterns = [
    // More specific patterns that are less likely to match legitimate CV content
    { pattern: /ignore\s+(all\s+)?(previous|above|system|prior)\s+(instructions?|prompts?|rules)/gi, name: 'ignore_instructions' },
    { pattern: /you\s+are\s+(now|actually)\s+(a|an|the)\s+(?!developer|admin|engineer|manager|lead|analyst|specialist)/gi, name: 'role_override' },
    { pattern: /(pretend|act|behave)\s+(like|as|to\s+be)\s+(?!a\s+(developer|admin|engineer|manager|lead|analyst|specialist))/gi, name: 'pretend_command' },
    { pattern: /(?:access|reveal|show)\s+(system|original|initial)\s+(prompt|message|instruction)/gi, name: 'system_access' },
    { pattern: /(jailbreak|developer\s+mode|admin\s+mode|god\s+mode|unrestricted\s+mode)/gi, name: 'privilege_escalation' },
    { pattern: /forget\s+(everything|all|previous)\s+(instructions?|prompts?|rules)/gi, name: 'memory_wipe' },
    { pattern: /switch\s+to\s+(new|different)\s+(role|character|persona|mode)/gi, name: 'role_switch' },
    { pattern: /override\s+(previous|system|original|all)\s+(instructions?|prompts?|rules)/gi, name: 'override_command' },
    { pattern: /disregard\s+(previous|above|system|all)\s+(instructions?|prompts?|rules)/gi, name: 'disregard_command' },
    { pattern: /show\s+me\s+(system|original|initial)\s+(prompt|instructions?)/gi, name: 'prompt_extraction' },
    // Additional specific jailbreak attempts
    { pattern: /do\s+anything\s+now/gi, name: 'dan_mode' },
    { pattern: /break\s+out\s+of\s+(character|role)/gi, name: 'character_break' },
    { pattern: /stop\s+being\s+(assistant|ai|bot)/gi, name: 'role_denial' }
  ]
  
  for (const { pattern, name } of injectionPatterns) {
    const match = text.match(pattern)
    if (match) {
      return {
        isDetected: true,
        type: 'prompt_injection',
        pattern: name,
        match: match[0]
      }
    }
  }
  
  return { isDetected: false }
}

// Helper function to check if content appears to be legitimate CV/job content
function isLegitimateCareerContent(text: string): boolean {
  const careerKeywords = [
    // Job titles and roles
    'developer', 'engineer', 'manager', 'analyst', 'specialist', 'coordinator',
    'administrator', 'admin', 'lead', 'senior', 'junior', 'principal', 'architect',
    'consultant', 'director', 'supervisor', 'technician', 'designer', 'intern',
    'associate', 'executive', 'officer', 'representative', 'assistant',
    
    // Technical skills and technologies
    'javascript', 'python', 'react', 'node', 'sql', 'aws', 'azure', 'java',
    'kubernetes', 'docker', 'git', 'api', 'database', 'frontend', 'backend',
    'html', 'css', 'typescript', 'angular', 'vue', 'php', 'ruby', 'golang',
    'devops', 'ci/cd', 'agile', 'scrum', 'microservices', 'mongodb', 'mysql',
    'system', 'network', 'server', 'cloud', 'platform', 'framework', 'library',
    
    // Career and business terms
    'experience', 'skills', 'education', 'university', 'degree', 'certification',
    'project', 'responsibility', 'achievement', 'team', 'leadership', 'management',
    'requirements', 'qualifications', 'salary', 'benefits', 'remote', 'onsite',
    'portfolio', 'resume', 'cv', 'interview', 'hiring', 'recruitment', 'company',
    'organization', 'department', 'collaboration', 'communication', 'problem-solving',
    
    // Industry terms
    'software', 'technology', 'development', 'programming', 'coding', 'testing',
    'deployment', 'infrastructure', 'security', 'networking', 'support', 'maintenance',
    'innovation', 'strategy', 'business', 'marketing', 'sales', 'finance', 'operations'
  ]
  
  const lowerText = text.toLowerCase()
  const keywordMatches = careerKeywords.filter(keyword => lowerText.includes(keyword))
  
  // Check for CV structure patterns
  const cvStructurePatterns = [
    /\b\d+\+?\s+years?\s+of\s+experience\b/i,
    /\b(bachelor|master|phd|b\.?s\.?|m\.?s\.?|m\.?b\.?a\.?)\b/i,
    /\b(university|college|institute)\b/i,
    /\b(worked\s+at|employed\s+at|position\s+at)\b/i,
    /\b(responsible\s+for|managed|led\s+team|developed|implemented)\b/i,
    /\b(skills?\s*:|\bexperience\s*:|\beducation\s*:|\bqualifications?\s*:)\b/i,
    /\b(proficient\s+in|expertise\s+in|knowledgeable\s+in)\b/i
  ]
  
  const hasStructureIndicators = cvStructurePatterns.some(pattern => pattern.test(text))
  const hasCareerKeywords = keywordMatches.length >= 2
  
  // Additional check for job posting language
  const jobPostingPatterns = [
    /\b(we\s+are\s+looking\s+for|seeking|candidate|applicant)\b/i,
    /\b(join\s+our\s+team|opportunity|position\s+available)\b/i,
    /\b(requirements?\s*:|qualifications?\s*:|responsibilities?\s*:)\b/i
  ]
  
  const hasJobPostingLanguage = jobPostingPatterns.some(pattern => pattern.test(text))
  
  return hasCareerKeywords || hasStructureIndicators || hasJobPostingLanguage
}

// Enhanced detection that considers context
export function detectPromptInjectionWithContext(text: string): SecurityDetection {
  // First check if this appears to be legitimate career content
  if (isLegitimateCareerContent(text)) {
    // Use very strict patterns that are extremely unlikely to appear in legitimate CV content
    const strictInjectionPatterns = [
      { pattern: /ignore\s+all\s+previous\s+(instructions?|prompts?|rules)\s+(and|then|now)/gi, name: 'explicit_ignore' },
      { pattern: /you\s+are\s+(now|actually)\s+(a|an|the)\s+(?!developer|engineer|manager|analyst|admin|lead|senior|specialist|coordinator|consultant|director|supervisor|designer|architect|technician|assistant|representative|associate|executive|officer)\b/gi, name: 'explicit_role_override' },
      { pattern: /(jailbreak|dan\s+mode|unrestricted\s+mode|god\s+mode|admin\s+mode|developer\s+mode|debug\s+mode)\b/gi, name: 'explicit_jailbreak' },
      { pattern: /(show|reveal|display)\s+me\s+(your\s+)?(system\s+|original\s+|initial\s+)?(prompt|instructions?|rules)/gi, name: 'explicit_prompt_extraction' },
      { pattern: /forget\s+(everything|all)\s+(and|then|now)\s+/gi, name: 'explicit_memory_wipe' },
      { pattern: /override\s+(all\s+)?(previous|system|original)\s+(instructions?|prompts?|rules)/gi, name: 'explicit_override' },
      { pattern: /pretend\s+(to\s+be|you\s+are)\s+(?!a\s+(developer|engineer|manager|analyst|admin|lead|senior|specialist|coordinator|consultant|director|supervisor|designer|architect|technician|assistant|representative|associate|executive|officer))\b/gi, name: 'explicit_pretend' },
      { pattern: /disregard\s+(all\s+)?(previous|above|system)\s+(instructions?|prompts?|rules)/gi, name: 'explicit_disregard' }
    ]
    
    for (const { pattern, name } of strictInjectionPatterns) {
      const match = text.match(pattern)
      if (match) {
        return {
          isDetected: true,
          type: 'prompt_injection',
          pattern: name,
          match: match[0]
        }
      }
    }
    
    return { isDetected: false }
  }
  
  // For non-career content, use the standard detection
  return detectPromptInjection(text)
}

// Backward compatibility function
export function isPromptInjection(text: string): boolean {
  return detectPromptInjection(text).isDetected
}
