import { Document, Page, Text, View } from '@react-pdf/renderer'
import { getThemeStyles, type ThemeId, type ThemeStyles } from './themes'
import { parseCvMarkdown, type CvNode, type TextSpan } from '@/utils/cvParser'

interface CvDocumentProps {
  content: string
  theme?: ThemeId
}

// Render text spans with inline styles (bold, italic)
interface StyledTextProps {
  spans: TextSpan[]
  styles: ThemeStyles
}

function StyledText({ spans, styles }: StyledTextProps) {
  return (
    <Text style={styles.inlineText}>
      {spans.map((span, idx) => (
        <Text key={idx} style={span.bold ? styles.boldText : undefined}>
          {span.text}
        </Text>
      ))}
    </Text>
  )
}

// Render a single AST node
function renderNode(node: CvNode, index: number, styles: ThemeStyles): React.ReactNode {
  switch (node.type) {
    case 'name':
      return <Text key={index} style={styles.name}>{node.content}</Text>

    case 'section':
      return <Text key={index} style={styles.sectionHeader}>{node.content}</Text>

    case 'contact':
      return <Text key={index} style={styles.contactInfo}>{node.content}</Text>

    case 'bullet_list':
      // Render bullet list as a container View for better spacing control
      return (
        <View key={index} style={styles.bulletList}>
          {node.children?.map((child, childIdx) => renderNode(child, childIdx, styles))}
        </View>
      )

    case 'bullet_item':
      return (
        <View key={index} style={styles.bulletPoint}>
          <Text style={styles.bullet}>•</Text>
          <View style={styles.bulletText}>
            {node.spans ? (
              <StyledText spans={node.spans} styles={styles} />
            ) : (
              <Text>{node.content}</Text>
            )}
          </View>
        </View>
      )

    case 'job_title':
      if (node.spans) {
        return (
          <View key={index} style={styles.jobTitle}>
            <StyledText spans={node.spans} styles={styles} />
          </View>
        )
      }
      return <Text key={index} style={styles.jobTitle}>{node.content}</Text>

    case 'mixed':
      return (
        <View key={index} style={styles.paragraph}>
          {node.spans && <StyledText spans={node.spans} styles={styles} />}
        </View>
      )

    case 'paragraph':
      return <Text key={index} style={styles.paragraph}>{node.content}</Text>

    default:
      return null
  }
}

export function CvDocument({ content, theme = 'modern' }: CvDocumentProps) {
  const styles = getThemeStyles(theme)
  const nodes = parseCvMarkdown(content)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {nodes.map((node, index) => renderNode(node, index, styles))}
      </Page>
    </Document>
  )
}

export default CvDocument
