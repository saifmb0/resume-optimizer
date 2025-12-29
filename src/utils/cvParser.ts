/**
 * AST-based CV Markdown Parser
 * 
 * Converts markdown-like CV content into a structured Abstract Syntax Tree
 * for consistent rendering across PDF and web preview components.
 */

export type CvNodeType = 
  | 'name' 
  | 'contact' 
  | 'section' 
  | 'subsection' 
  | 'bullet_list' 
  | 'bullet_item'
  | 'paragraph' 
  | 'job_title'
  | 'mixed'

export interface TextSpan {
  text: string
  bold?: boolean
  italic?: boolean
}

export interface CvNode {
  type: CvNodeType
  content?: string // Raw text content for simple nodes
  spans?: TextSpan[] // For inline styled text (bold, italic)
  children?: CvNode[] // For nested structures like bullet_list
}

/**
 * Parse inline styles (**bold** and *italic*) into TextSpans
 */
function parseInlineStyles(text: string): TextSpan[] {
  const spans: TextSpan[] = []
  
  // Split by ** for bold markers
  const segments = text.split(/(\*\*[^*]+\*\*)/g)
  
  for (const segment of segments) {
    if (!segment) continue
    
    if (segment.startsWith('**') && segment.endsWith('**')) {
      // Bold text - strip the markers
      const boldText = segment.slice(2, -2)
      if (boldText) {
        spans.push({ text: boldText, bold: true })
      }
    } else {
      // Regular text
      spans.push({ text: segment })
    }
  }
  
  return spans
}

/**
 * Check if text contains inline styles that need parsing
 */
function hasInlineStyles(text: string): boolean {
  return text.includes('**')
}

/**
 * Parse CV markdown content into an AST
 */
export function parseCvMarkdown(content: string): CvNode[] {
  const lines = content.split('\n')
  const nodes: CvNode[] = []
  let isFirstNonEmpty = true
  let currentBulletList: CvNode | null = null

  const flushBulletList = () => {
    if (currentBulletList && currentBulletList.children?.length) {
      nodes.push(currentBulletList)
      currentBulletList = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines - don't create nodes for them
    // Spacing is handled by CSS/StyleSheet margins
    if (trimmed === '') {
      // Empty line breaks the current bullet list
      flushBulletList()
      continue
    }

    // Standard markdown headers (### or ## or #)
    if (trimmed.startsWith('#')) {
      flushBulletList()
      const text = trimmed.replace(/^#+\s*/, '').trim()
      
      if (isFirstNonEmpty) {
        nodes.push({ type: 'name', content: text })
      } else {
        nodes.push({ type: 'section', content: text })
      }
      isFirstNonEmpty = false
      continue
    }

    // Bold-wrapped headers (legacy format: **Section Name**)
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
      flushBulletList()
      const text = trimmed.slice(2, -2).trim()
      
      if (isFirstNonEmpty) {
        nodes.push({ type: 'name', content: text })
      } else {
        nodes.push({ type: 'section', content: text })
      }
      isFirstNonEmpty = false
      continue
    }

    isFirstNonEmpty = false

    // Contact info with pipes (e.g., "email@example.com | (555) 123-4567 | City, State")
    if (trimmed.includes('|') && !trimmed.startsWith('*') && !trimmed.startsWith('-')) {
      flushBulletList()
      const text = trimmed.split('|').map(p => p.trim()).join(' • ')
      nodes.push({ type: 'contact', content: text })
      continue
    }

    // Bullet points: -, *, or • prefix
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (bulletMatch) {
      const bulletText = bulletMatch[1]
      
      // Start a new bullet list if needed
      if (!currentBulletList) {
        currentBulletList = { type: 'bullet_list', children: [] }
      }
      
      // Create bullet item with optional inline styles
      const bulletNode: CvNode = { type: 'bullet_item' }
      if (hasInlineStyles(bulletText)) {
        bulletNode.spans = parseInlineStyles(bulletText)
      } else {
        bulletNode.content = bulletText
      }
      
      currentBulletList.children!.push(bulletNode)
      continue
    }

    // Flush any pending bullet list before other content
    flushBulletList()

    // Job titles with dates (contains ' | ' in the middle, not as a list separator)
    // This is different from contact info - typically "Company Name | Role | Date"
    const pipeCount = (trimmed.match(/\|/g) || []).length
    if (pipeCount === 1 || pipeCount === 2) {
      // Could be a job title line
      const parts = trimmed.split('|').map(p => p.trim())
      const looksLikeJobTitle = parts.some(p => 
        /\d{4}/.test(p) || // Has a year
        /present|current/i.test(p) || // Has "present" or "current"
        /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(p) // Has month name
      )
      
      if (looksLikeJobTitle) {
        if (hasInlineStyles(trimmed)) {
          nodes.push({ type: 'job_title', spans: parseInlineStyles(trimmed) })
        } else {
          nodes.push({ type: 'job_title', content: trimmed })
        }
        continue
      }
    }

    // Mixed content with bold (not a header, not a bullet)
    if (hasInlineStyles(trimmed)) {
      nodes.push({ type: 'mixed', spans: parseInlineStyles(trimmed) })
      continue
    }

    // Regular paragraph
    nodes.push({ type: 'paragraph', content: trimmed })
  }

  // Flush any remaining bullet list
  flushBulletList()

  return nodes
}

/**
 * Render text spans to a simple string (for debugging/testing)
 */
export function spansToText(spans: TextSpan[]): string {
  return spans.map(s => s.text).join('')
}
