'use client'

import { useState } from 'react'
import { ClipboardIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'

interface CoverLetterResultProps {
  coverLetter: string
  onRegenerate: () => void
  isLoading: boolean
}

export default function CoverLetterResult({ coverLetter, onRegenerate, isLoading }: CoverLetterResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const textWidth = pageWidth - 2 * margin
    let yPosition = margin
    
    // Set explicit colors for PDF - always black text on white background
    doc.setTextColor(0, 0, 0) // Black text
    doc.setFillColor(255, 255, 255) // White background
    
    // Fill the entire page with white background
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    
    // Process each line with the same logic as the website display
    const lines = coverLetter.split('\n')
    
    for (let index = 0; index < lines.length; index++) {
      const trimmedLine = lines[index].trim()
      
      // Empty lines - add space (reduced from 3 to 2)
      if (trimmedLine === '') {
        yPosition += 2
        continue
      }
      
      // Check if we need a new page before processing
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        doc.setTextColor(0, 0, 0)
        doc.setFillColor(255, 255, 255)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
        yPosition = margin
      }
      
      // Bold headers (name, section headers) - same as website logic
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const text = trimmedLine.replace(/\*\*/g, '')
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        
        if (index === 0) {
          // Name at the top - centered, larger font (reduced spacing)
          doc.setFontSize(18)
          doc.text(text, pageWidth / 2, yPosition, { align: 'center' })
          yPosition += 8 // Reduced from 12
        } else {
          // Section headers (reduced spacing)
          doc.setFontSize(14)
          doc.text(text, margin, yPosition)
          yPosition += 6 // Reduced from 8
          // Add underline to match border-b - extend to end of page
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(0.5)
          doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
          yPosition += 4 // Reduced from 8
        }
        continue
      }
      
      // Mixed bold text with following content (like **Job Title**Content)
      if (trimmedLine.includes('**') && !trimmedLine.startsWith('*   ')) {
        doc.setFontSize(10) // text-sm
        const parts = trimmedLine.split('**')
        let xPosition = margin
        const lineHeight = 5 // Reduced from 6
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          
          if (part.trim() !== '') {
            // Check if this appears to be a new entry (same logic as website)
            const isNewEntry = i > 0 && 
                             i % 2 === 1 && 
                             part.match(/^[A-Z]/) && 
                             !part.includes('•') &&
                             i > 1
            
            if (isNewEntry) {
              // Break to new line for new entries
              yPosition += lineHeight
              xPosition = margin
              if (yPosition > pageHeight - 40) {
                doc.addPage()
                doc.setTextColor(0, 0, 0)
                doc.setFillColor(255, 255, 255)
                doc.rect(0, 0, pageWidth, pageHeight, 'F')
                yPosition = margin
              }
            }
            
            if (i % 2 === 1) {
              // Odd indices are bold text (font-semibold)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(0, 0, 0)
            } else {
              // Even indices are normal text
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(0, 0, 0)
            }
            
            // Check if text fits on current line
            const partWidth = doc.getTextWidth(part)
            if (xPosition + partWidth > pageWidth - margin && xPosition > margin) {
              yPosition += lineHeight
              xPosition = margin
              if (yPosition > pageHeight - 40) {
                doc.addPage()
                doc.setTextColor(0, 0, 0)
                doc.setFillColor(255, 255, 255)
                doc.rect(0, 0, pageWidth, pageHeight, 'F')
                yPosition = margin
              }
            }
            
            doc.text(part, xPosition, yPosition)
            xPosition += partWidth
          }
        }
        yPosition += lineHeight + 1 // Reduced spacing between entries
        continue
      }
      
      // Contact info or job details with pipes - centered
      if (trimmedLine.includes('|')) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10) // text-sm
        const text = trimmedLine.split('|').map(part => part.trim()).join(' • ')
        doc.text(text, pageWidth / 2, yPosition, { align: 'center' })
        yPosition += 6 // Reduced spacing
        continue
      }
      
      // Bullet points
      if (trimmedLine.startsWith('*   ')) {
        const bulletText = trimmedLine.replace('*   ', '')
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10) // text-sm
        const bulletIndent = 15 // ml-4
        const lineHeight = 5 // Reduced from 6
        
        // Add bullet point
        doc.text('•', margin + 5, yPosition)
        
        // Handle bold formatting in bullet text (same as website)
        if (bulletText.includes('**')) {
          const parts = bulletText.split('**')
          let xPosition = margin + bulletIndent
          
          for (let partIndex = 0; partIndex < parts.length; partIndex++) {
            const part = parts[partIndex]
            if (partIndex % 2 === 1) {
              doc.setFont('helvetica', 'bold') // font-semibold
              doc.setTextColor(0, 0, 0)
            } else {
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(0, 0, 0)
            }
            
            // Check if we need to wrap to next line
            const partWidth = doc.getTextWidth(part)
            if (xPosition + partWidth > pageWidth - margin && xPosition > margin + bulletIndent) {
              yPosition += lineHeight
              xPosition = margin + bulletIndent
              if (yPosition > pageHeight - 40) {
                doc.addPage()
                doc.setTextColor(0, 0, 0)
                doc.setFillColor(255, 255, 255)
                doc.rect(0, 0, pageWidth, pageHeight, 'F')
                yPosition = margin
              }
            }
            
            doc.text(part, xPosition, yPosition)
            xPosition += partWidth
          }
        } else {
          // Simple bullet text without bold formatting
          const availableWidth = textWidth - bulletIndent
          const wrappedLines = doc.splitTextToSize(bulletText, availableWidth)
          
          for (let i = 0; i < wrappedLines.length; i++) {
            if (i > 0) {
              yPosition += lineHeight
              if (yPosition > pageHeight - 40) {
                doc.addPage()
                doc.setTextColor(0, 0, 0)
                doc.setFillColor(255, 255, 255)
                doc.rect(0, 0, pageWidth, pageHeight, 'F')
                yPosition = margin
              }
            }
            doc.text(wrappedLines[i], margin + bulletIndent, yPosition)
          }
        }
        
        yPosition += lineHeight + 1 // Reduced spacing after bullet
        continue
      }
      
      // Job titles or positions (text with pipe and dates) - font-semibold
      if (trimmedLine.includes(' | ') && !trimmedLine.startsWith('*')) {
        doc.setFont('helvetica', 'bold') // font-semibold
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10) // text-sm
        const jobLineHeight = 5 // Consistent with other sections
        const wrappedLines = doc.splitTextToSize(trimmedLine, textWidth)
        
        for (const wrappedLine of wrappedLines) {
          if (yPosition > pageHeight - 40) {
            doc.addPage()
            doc.setTextColor(0, 0, 0)
            doc.setFillColor(255, 255, 255)
            doc.rect(0, 0, pageWidth, pageHeight, 'F')
            yPosition = margin
          }
          doc.text(wrappedLine, margin, yPosition)
          yPosition += jobLineHeight
        }
        yPosition += 1 // Reduced spacing after job titles
        continue
      }
      
      // Regular paragraphs with single asterisk bold handling (*text*)
      // First handle single asterisks for inline bold
      if (trimmedLine.includes('*') && !trimmedLine.includes('**') && !trimmedLine.startsWith('*   ')) {
        doc.setFontSize(10) // text-sm
        const parts = trimmedLine.split('*')
        let xPosition = margin
        const lineHeight = 5 // Reduced spacing
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          
          if (part.trim() !== '' || i === 0 || i === parts.length - 1) {
            if (i % 2 === 1 && part.trim() !== '') {
              // Odd indices are bold text (between single *)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(0, 0, 0)
            } else {
              // Even indices are normal text
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(0, 0, 0)
            }
            
            // Check if text fits on current line
            const partWidth = doc.getTextWidth(part)
            if (xPosition + partWidth > pageWidth - margin && xPosition > margin) {
              yPosition += lineHeight
              xPosition = margin
              if (yPosition > pageHeight - 40) {
                doc.addPage()
                doc.setTextColor(0, 0, 0)
                doc.setFillColor(255, 255, 255)
                doc.rect(0, 0, pageWidth, pageHeight, 'F')
                yPosition = margin
              }
            }
            
            doc.text(part, xPosition, yPosition)
            xPosition += partWidth
          }
        }
        yPosition += lineHeight + 1 // Reduced spacing after paragraph
        continue
      }
      
      // Regular paragraphs - leading-relaxed
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10) // text-sm
      const lineHeight = 5 // Reduced from 6
      
      // Split text into lines that fit the page width
      const splitLines = doc.splitTextToSize(trimmedLine, textWidth)
      
      for (const splitLine of splitLines) {
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          doc.setTextColor(0, 0, 0)
          doc.setFillColor(255, 255, 255)
          doc.rect(0, 0, pageWidth, pageHeight, 'F')
          yPosition = margin
        }
        doc.text(splitLine, margin, yPosition)
        yPosition += lineHeight
      }
      yPosition += 1 // Reduced spacing after paragraphs
    }
    
    doc.save('resume.pdf')
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Results</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex items-center px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <ClipboardIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-3 sm:px-4 py-2 bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Export PDF
            </button>
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="flex items-center px-3 sm:px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 text-white rounded-md transition-colors duration-200 text-sm sm:text-base"
            >
              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {isLoading ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800 p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-zinc-700">
          <div className="text-gray-900 dark:text-gray-100 leading-relaxed space-y-3 sm:space-y-4 text-sm sm:text-base">
            {coverLetter.split('\n').map((line, index) => {
              const trimmedLine = line.trim()
              
              if (trimmedLine === '') {
                return <div key={index} className="h-1 sm:h-2"></div>
              }
              
              // Bold headers (name, section headers)
              if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                const text = trimmedLine.replace(/\*\*/g, '')
                if (index === 0) {
                  // Name at the top
                  return (
                    <h1 key={index} className="text-lg sm:text-xl lg:text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                      {text}
                    </h1>
                  )
                } else {
                  // Section headers
                  return (
                    <h2 key={index} className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mt-4 sm:mt-6 mb-2 border-b border-gray-300 dark:border-zinc-600 pb-1">
                      {text}
                    </h2>
                  )
                }
              }
              
              // Mixed bold text with following content (like **Job Title**Content)
              if (trimmedLine.includes('**') && !trimmedLine.startsWith('*   ')) {
                // Handle cases where multiple entries might be concatenated
                const parts = trimmedLine.split('**')
                const elements = []
                
                for (let i = 0; i < parts.length; i++) {
                  const part = parts[i]
                  
                  if (part.trim() !== '') {
                    // Check if this appears to be a new entry (bold text starting with capital letter)
                    const isNewEntry = i > 0 && 
                                     i % 2 === 1 && 
                                     part.match(/^[A-Z]/) && 
                                     !part.includes('•') &&
                                     i > 1
                    
                    if (isNewEntry) {
                      // Break to new line for new entries
                      elements.push(<br key={`br-${i}`} />)
                    }
                    
                    if (i % 2 === 1) {
                      // Odd indices are bold text
                      elements.push(
                        <strong key={i} className="font-semibold text-gray-900 dark:text-gray-200">
                          {part}
                        </strong>
                      )
                    } else {
                      // Even indices are normal text
                      elements.push(<span key={i} className="text-gray-800 dark:text-gray-300">{part}</span>)
                    }
                  }
                }
                
                return (
                  <div key={index} className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                    {elements}
                  </div>
                )
              }
              
              // Contact info or job details with pipes
              if (trimmedLine.includes('|')) {
                return (
                  <p key={index} className="text-center text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                    {trimmedLine.split('|').map((part, i) => (
                      <span key={i}>
                        {part.trim()}
                        {i < trimmedLine.split('|').length - 1 && <span className="mx-1 sm:mx-2">•</span>}
                      </span>
                    ))}
                  </p>
                )
              }
              
              // Bullet points
              if (trimmedLine.startsWith('*   ')) {
                const bulletText = trimmedLine.replace('*   ', '')
                return (
                  <li key={index} className="ml-3 sm:ml-4 text-gray-800 dark:text-gray-300 text-xs sm:text-sm">
                    {bulletText.split('**').map((part, i) => {
                      if (i % 2 === 1) {
                        // Odd indices are bold text (between **)
                        return <strong key={i} className="font-semibold text-gray-900 dark:text-gray-200">{part}</strong>
                      }
                      return <span key={i} className="text-gray-800 dark:text-gray-300">{part}</span>
                    })}
                  </li>
                )
              }
              
              // Job titles or positions (text with pipe and dates)
              if (trimmedLine.includes(' | ') && !trimmedLine.startsWith('*')) {
                return (
                  <p key={index} className="font-semibold text-gray-900 dark:text-gray-200 text-xs sm:text-sm">
                    {trimmedLine}
                  </p>
                )
              }
              
              // Handle single asterisks for inline bold (*text*)
              if (trimmedLine.includes('*') && !trimmedLine.includes('**') && !trimmedLine.startsWith('*   ')) {
                return (
                  <p key={index} className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                    {trimmedLine.split('*').map((part, i) => {
                      if (i % 2 === 1 && part.trim() !== '') {
                        // Odd indices are bold text (between single *)
                        return <strong key={i} className="font-semibold text-gray-900 dark:text-gray-200">{part}</strong>
                      }
                      return <span key={i} className="text-gray-800 dark:text-gray-300">{part}</span>
                    })}
                  </p>
                )
              }
              
              // Regular paragraphs
              return (
                <p key={index} className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                  {trimmedLine}
                </p>
              )
            })}
          </div>
        </div>

        {/* AdSense Placeholder */}
        <div className="mt-6 sm:mt-8 p-4 bg-gray-100 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Google AdSense Ad Placement</p>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">728x90 or 300x250 responsive ad unit</p>
        </div>
      </div>
    </div>
  )
}
