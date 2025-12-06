import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getThemeStyles, type ThemeId, type ThemeStyles } from './themes'

interface CvDocumentProps {
  content: string
  theme?: ThemeId
}

// Parse markdown-like content into structured elements
function parseContent(content: string) {
  const lines = content.split('\n')
  const elements: Array<{
    type: 'name' | 'section' | 'contact' | 'bullet' | 'jobTitle' | 'paragraph' | 'mixed' | 'empty'
    text: string
    isFirstLine?: boolean
    parts?: Array<{ text: string; bold: boolean }>
  }> = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (trimmed === '') {
      elements.push({ type: 'empty', text: '' })
      return
    }

    // Bold headers (name, section headers)
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      const text = trimmed.replace(/\*\*/g, '')
      if (index === 0) {
        elements.push({ type: 'name', text })
      } else {
        elements.push({ type: 'section', text })
      }
      return
    }

    // Contact info with pipes
    if (trimmed.includes('|') && !trimmed.startsWith('*')) {
      const text = trimmed.split('|').map(p => p.trim()).join(' • ')
      elements.push({ type: 'contact', text })
      return
    }

    // Bullet points
    if (trimmed.startsWith('*   ')) {
      const bulletText = trimmed.replace('*   ', '')
      // Handle bold in bullets
      if (bulletText.includes('**')) {
        const parts = parseMixedBold(bulletText)
        elements.push({ type: 'bullet', text: bulletText, parts })
      } else {
        elements.push({ type: 'bullet', text: bulletText })
      }
      return
    }

    // Mixed bold content
    if (trimmed.includes('**')) {
      const parts = parseMixedBold(trimmed)
      elements.push({ type: 'mixed', text: trimmed, parts })
      return
    }

    // Job titles with dates (contains ' | ')
    if (trimmed.includes(' | ')) {
      elements.push({ type: 'jobTitle', text: trimmed })
      return
    }

    // Regular paragraph
    elements.push({ type: 'paragraph', text: trimmed })
  })

  return elements
}

// Parse text with **bold** markers
function parseMixedBold(text: string): Array<{ text: string; bold: boolean }> {
  const parts: Array<{ text: string; bold: boolean }> = []
  const segments = text.split('**')
  
  segments.forEach((segment, index) => {
    if (segment) {
      parts.push({
        text: segment,
        bold: index % 2 === 1, // Odd indices are between ** markers
      })
    }
  })
  
  return parts
}

// Render mixed bold/normal text - accepts styles as prop
interface MixedTextProps {
  parts: Array<{ text: string; bold: boolean }>
  styles: ThemeStyles
}

function MixedText({ parts, styles }: MixedTextProps) {
  return (
    <Text style={styles.inlineText}>
      {parts.map((part, idx) => (
        <Text key={idx} style={part.bold ? styles.boldText : undefined}>
          {part.text}
        </Text>
      ))}
    </Text>
  )
}

export function CvDocument({ content, theme = 'modern' }: CvDocumentProps) {
  const styles = getThemeStyles(theme)
  const elements = parseContent(content)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {elements.map((element, index) => {
          switch (element.type) {
            case 'name':
              return <Text key={index} style={styles.name}>{element.text}</Text>
            
            case 'section':
              return <Text key={index} style={styles.sectionHeader}>{element.text}</Text>
            
            case 'contact':
              return <Text key={index} style={styles.contactInfo}>{element.text}</Text>
            
            case 'bullet':
              return (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={styles.bulletText}>
                    {element.parts ? (
                      <MixedText parts={element.parts} styles={styles} />
                    ) : (
                      <Text>{element.text}</Text>
                    )}
                  </View>
                </View>
              )
            
            case 'jobTitle':
              return <Text key={index} style={styles.jobTitle}>{element.text}</Text>
            
            case 'mixed':
              return (
                <View key={index} style={styles.paragraph}>
                  {element.parts && <MixedText parts={element.parts} styles={styles} />}
                </View>
              )
            
            case 'paragraph':
              return <Text key={index} style={styles.paragraph}>{element.text}</Text>
            
            case 'empty':
              return <View key={index} style={{ height: 4 }} />
            
            default:
              return null
          }
        })}
      </Page>
    </Document>
  )
}

export default CvDocument
