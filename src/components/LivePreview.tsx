'use client'

/**
 * LivePreview component - shows a live-updating visual preview
 * that mimics the PDF output styling without requiring react-pdf
 */

interface LivePreviewProps {
  content: string
}

export default function LivePreview({ content }: LivePreviewProps) {
  return (
    <div className="bg-white rounded shadow-lg p-6 sm:p-8 max-h-[600px] lg:max-h-[800px] overflow-y-auto">
      {/* Paper-like styling to match PDF output */}
      <div className="font-serif text-gray-900 text-sm leading-relaxed space-y-2">
        {content.split('\n').map((line, index) => {
          const trimmed = line.trim()
          
          if (trimmed === '') {
            return <div key={index} className="h-2"></div>
          }
          
          // Bold headers (name, section headers)
          if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            const text = trimmed.replace(/\*\*/g, '')
            if (index === 0) {
              // Name at the top
              return (
                <h1 key={index} className="text-xl font-bold text-center text-gray-900 font-sans">
                  {text}
                </h1>
              )
            } else {
              // Section headers
              return (
                <h2 key={index} className="text-sm font-bold text-gray-900 uppercase tracking-wide mt-4 mb-1 border-b border-gray-300 pb-0.5 font-sans">
                  {text}
                </h2>
              )
            }
          }
          
          // Contact info with pipes
          if (trimmed.includes('|') && index < 5) {
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
          
          // Bullet points
          if (trimmed.startsWith('*   ')) {
            const bulletText = trimmed.replace('*   ', '')
            return (
              <li key={index} className="ml-4 text-gray-700 text-xs list-disc">
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
