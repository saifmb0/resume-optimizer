'use client'

/**
 * LivePreview component - shows a live-updating visual preview
 * that mimics the PDF output styling without requiring react-pdf
 */

import { parseCvMarkdown, type CvNode, type TextSpan } from '@/utils/cvParser'

interface LivePreviewProps {
  content: string
}

// Render text spans with inline styles
function renderSpans(spans: TextSpan[]) {
  return spans.map((span, idx) => {
    if (span.bold) {
      return <strong key={idx} className="font-semibold">{span.text}</strong>
    }
    return <span key={idx}>{span.text}</span>
  })
}

// Render a single AST node to HTML
function renderNode(node: CvNode, index: number): React.ReactNode {
  switch (node.type) {
    case 'name':
      return (
        <h1 key={index} className="text-lg font-bold text-center text-gray-900 font-sans mb-2">
          {node.content}
        </h1>
      )

    case 'section':
      return (
        <h2 key={index} className="text-xs font-bold text-gray-900 uppercase tracking-wide mt-3 mb-1 border-b border-gray-300 pb-0.5 font-sans">
          {node.content}
        </h2>
      )

    case 'contact':
      return (
        <p key={index} className="text-center text-gray-600 text-xs mb-3">
          {node.content}
        </p>
      )

    case 'bullet_list':
      return (
        <ul key={index} className="list-disc ml-4 space-y-0.5 mb-2">
          {node.children?.map((child, childIdx) => renderNode(child, childIdx))}
        </ul>
      )

    case 'bullet_item':
      return (
        <li key={index} className="text-gray-700 text-xs leading-snug">
          {node.spans ? renderSpans(node.spans) : node.content}
        </li>
      )

    case 'job_title':
      return (
        <p key={index} className="font-semibold text-gray-800 text-xs mt-2 mb-0.5">
          {node.spans ? renderSpans(node.spans) : node.content}
        </p>
      )

    case 'mixed':
      return (
        <p key={index} className="text-gray-700 text-xs">
          {node.spans && renderSpans(node.spans)}
        </p>
      )

    case 'paragraph':
      return (
        <p key={index} className="text-gray-700 text-xs mb-0.5">
          {node.content}
        </p>
      )

    default:
      return null
  }
}

export default function LivePreview({ content }: LivePreviewProps) {
  const nodes = parseCvMarkdown(content)
  
  return (
    <div className="bg-white rounded shadow-lg p-4 sm:p-6 max-h-[600px] lg:max-h-[800px] overflow-y-auto">
      {/* Paper-like styling to match PDF output - compact for one-page fit */}
      <div className="font-serif text-gray-900 text-sm leading-tight">
        {nodes.map((node, index) => renderNode(node, index))}
      </div>
    </div>
  )
}
