'use client'

/**
 * LivePreview component - shows a live-updating visual preview
 * that mimics the PDF output styling without requiring react-pdf
 */

interface LivePreviewProps {
  content: string
}

export default function LivePreview({ content }: LivePreviewProps) {
  let isFirstNonEmpty = true
  
  return (
    <div className="bg-white rounded shadow-lg p-4 sm:p-6 max-h-[600px] lg:max-h-[800px] overflow-y-auto">
      {/* Paper-like styling to match PDF output - compact for one-page fit */}
      <div className="font-serif text-gray-900 text-sm leading-tight space-y-1">
        {content.split('\n').map((line, index) => {
          const trimmed = line.trim()
          
          if (trimmed === '') {
            return <div key={index} className="h-1"></div>
          }
          
          // Standard markdown headers (### or ##)
          if (trimmed.startsWith('#')) {
            const text = trimmed.replace(/^#+\s*/, '')
            if (isFirstNonEmpty) {
              isFirstNonEmpty = false
              return (
                <h1 key={index} className="text-lg font-bold text-center text-gray-900 font-sans">
                  {text}
                </h1>
              )
            } else {
              return (
                <h2 key={index} className="text-xs font-bold text-gray-900 uppercase tracking-wide mt-3 mb-0.5 border-b border-gray-300 pb-0.5 font-sans">
                  {text}
                </h2>
              )
            }
          }
          
          // Bold headers (legacy format)
          if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            const text = trimmed.replace(/\*\*/g, '')
            if (isFirstNonEmpty) {
              isFirstNonEmpty = false
              return (
                <h1 key={index} className="text-lg font-bold text-center text-gray-900 font-sans">
                  {text}
                </h1>
              )
            } else {
              return (
                <h2 key={index} className="text-xs font-bold text-gray-900 uppercase tracking-wide mt-3 mb-0.5 border-b border-gray-300 pb-0.5 font-sans">
                  {text}
                </h2>
              )
            }
          }
          
          isFirstNonEmpty = false
          
          // Contact info with pipes
          if (trimmed.includes('|') && !trimmed.startsWith('*') && !trimmed.startsWith('-')) {
            return (
              <p key={index} className="text-center text-gray-600 text-xs">
                {trimmed.split('|').map((part, i) => (
                  <span key={i}>
                    {part.trim()}
                    {i < trimmed.split('|').length - 1 && <span className="mx-1">•</span>}
                  </span>
                ))}
              </p>
            )
          }
          
          // Bullet points: standard markdown (- ) or legacy (*   )
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('*   ')) {
            const bulletText = trimmed.replace(/^[-*]\s+/, '')
            return (
              <li key={index} className="ml-3 text-gray-700 text-xs list-disc leading-snug">
                {bulletText.split('**').map((part, i) => {
                  if (i % 2 === 1) {
                    return <strong key={i} className="font-semibold">{part}</strong>
                  }
                  return <span key={i}>{part}</span>
                })}
              </li>
            )
          }
          
          // Mixed bold content
          if (trimmed.includes('**')) {
            return (
              <p key={index} className="text-gray-700 text-xs">
                {trimmed.split('**').map((part, i) => {
                  if (i % 2 === 1) {
                    return <strong key={i} className="font-semibold">{part}</strong>
                  }
                  return <span key={i}>{part}</span>
                })}
              </p>
            )
          }
          
          // Job titles with dates
          if (trimmed.includes(' | ')) {
            return (
              <p key={index} className="font-semibold text-gray-800 text-xs mt-2">
                {trimmed}
              </p>
            )
          }
          
          // Regular paragraphs
          return (
            <p key={index} className="text-gray-700 text-xs">
              {trimmed}
            </p>
          )
        })}
      </div>
    </div>
  )
}
