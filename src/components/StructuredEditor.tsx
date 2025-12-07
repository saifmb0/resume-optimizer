'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

/**
 * Structured content model for safe editing
 */
export interface StructuredContent {
  name: string
  contactInfo: string[]
  sections: ContentSection[]
}

interface ContentSection {
  id: string
  title: string
  items: SectionItem[]
}

interface SectionItem {
  id: string
  type: 'job' | 'bullet' | 'paragraph'
  title?: string // For job entries
  subtitle?: string // Company | Date
  bullets?: string[] // Bullet points under a job
  text?: string // For paragraphs
}

interface StructuredEditorProps {
  content: string
  onChange: (newContent: string) => void
}

/**
 * Parse markdown content into structured format for safe editing
 */
function parseToStructured(content: string): StructuredContent {
  const lines = content.split('\n')
  const result: StructuredContent = {
    name: '',
    contactInfo: [],
    sections: []
  }
  
  let currentSection: ContentSection | null = null
  let currentItem: SectionItem | null = null
  let lineIndex = 0

  for (const line of lines) {
    const trimmed = line.trim()
    lineIndex++
    
    if (trimmed === '') continue
    
    // Name (first bold line)
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && result.name === '') {
      result.name = trimmed.replace(/\*\*/g, '')
      continue
    }
    
    // Contact info (lines with pipes near the top)
    if (trimmed.includes('|') && result.sections.length === 0) {
      result.contactInfo.push(trimmed)
      continue
    }
    
    // Section header (bold text)
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      if (currentSection) {
        if (currentItem) {
          currentSection.items.push(currentItem)
          currentItem = null
        }
        result.sections.push(currentSection)
      }
      currentSection = {
        id: `section_${Date.now()}_${lineIndex}`,
        title: trimmed.replace(/\*\*/g, ''),
        items: []
      }
      continue
    }
    
    // Job title with date (contains ' | ' but not at start of document)
    if (trimmed.includes(' | ') && currentSection && !trimmed.startsWith('*')) {
      if (currentItem) {
        currentSection.items.push(currentItem)
      }
      currentItem = {
        id: `item_${Date.now()}_${lineIndex}`,
        type: 'job',
        subtitle: trimmed,
        bullets: []
      }
      continue
    }
    
    // Bold job title (like **Software Engineer**)
    if (trimmed.startsWith('**') && !trimmed.endsWith('**') && currentSection) {
      if (currentItem) {
        currentSection.items.push(currentItem)
      }
      // Extract title from **Title**
      const titleMatch = trimmed.match(/^\*\*([^*]+)\*\*(.*)$/)
      if (titleMatch) {
        currentItem = {
          id: `item_${Date.now()}_${lineIndex}`,
          type: 'job',
          title: titleMatch[1],
          subtitle: titleMatch[2].trim(),
          bullets: []
        }
      }
      continue
    }
    
    // Bullet point
    if (trimmed.startsWith('*   ') && currentSection) {
      const bulletText = trimmed.replace('*   ', '')
      if (currentItem && currentItem.bullets) {
        currentItem.bullets.push(bulletText)
      } else {
        // Standalone bullet
        if (currentItem) {
          currentSection.items.push(currentItem)
        }
        currentItem = {
          id: `item_${Date.now()}_${lineIndex}`,
          type: 'bullet',
          text: bulletText
        }
      }
      continue
    }
    
    // Regular paragraph
    if (currentSection) {
      if (currentItem) {
        currentSection.items.push(currentItem)
      }
      currentItem = {
        id: `item_${Date.now()}_${lineIndex}`,
        type: 'paragraph',
        text: trimmed
      }
    }
  }
  
  // Push final item and section
  if (currentItem && currentSection) {
    currentSection.items.push(currentItem)
  }
  if (currentSection) {
    result.sections.push(currentSection)
  }
  
  return result
}

/**
 * Convert structured content back to markdown
 */
function structuredToMarkdown(structured: StructuredContent): string {
  const lines: string[] = []
  
  // Name
  if (structured.name) {
    lines.push(`**${structured.name}**`)
  }
  
  // Contact info
  structured.contactInfo.forEach(contact => {
    lines.push(contact)
  })
  
  if (lines.length > 0) {
    lines.push('')
  }
  
  // Sections
  structured.sections.forEach((section, sIdx) => {
    lines.push(`**${section.title}**`)
    
    section.items.forEach(item => {
      if (item.type === 'job') {
        if (item.title) {
          lines.push(`**${item.title}**${item.subtitle ? ' ' + item.subtitle : ''}`)
        } else if (item.subtitle) {
          lines.push(item.subtitle)
        }
        item.bullets?.forEach(bullet => {
          lines.push(`*   ${bullet}`)
        })
      } else if (item.type === 'bullet') {
        lines.push(`*   ${item.text || ''}`)
      } else if (item.type === 'paragraph') {
        lines.push(item.text || '')
      }
    })
    
    if (sIdx < structured.sections.length - 1) {
      lines.push('')
    }
  })
  
  return lines.join('\n')
}

export default function StructuredEditor({ content, onChange }: StructuredEditorProps) {
  const [structured, setStructured] = useState<StructuredContent>(() => parseToStructured(content))
  
  // Re-parse when external content changes significantly
  useEffect(() => {
    const newStructured = parseToStructured(content)
    // Only update if the source content is different (prevents infinite loops)
    if (content !== structuredToMarkdown(structured)) {
      setStructured(newStructured)
    }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Emit changes
  const emitChange = useCallback((newStructured: StructuredContent) => {
    setStructured(newStructured)
    onChange(structuredToMarkdown(newStructured))
  }, [onChange])
  
  // Update name
  const updateName = (name: string) => {
    emitChange({ ...structured, name })
  }
  
  // Update contact info
  const updateContact = (index: number, value: string) => {
    const newContacts = [...structured.contactInfo]
    newContacts[index] = value
    emitChange({ ...structured, contactInfo: newContacts })
  }
  
  // Update section title
  const updateSectionTitle = (sectionId: string, title: string) => {
    emitChange({
      ...structured,
      sections: structured.sections.map(s =>
        s.id === sectionId ? { ...s, title } : s
      )
    })
  }
  
  // Update item
  const updateItem = (sectionId: string, itemId: string, updates: Partial<SectionItem>) => {
    emitChange({
      ...structured,
      sections: structured.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              )
            }
          : s
      )
    })
  }
  
  // Update bullet in a job
  const updateBullet = (sectionId: string, itemId: string, bulletIndex: number, value: string) => {
    emitChange({
      ...structured,
      sections: structured.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map(item =>
                item.id === itemId && item.bullets
                  ? { ...item, bullets: item.bullets.map((b, i) => i === bulletIndex ? value : b) }
                  : item
              )
            }
          : s
      )
    })
  }
  
  // Add bullet to a job
  const addBullet = (sectionId: string, itemId: string) => {
    emitChange({
      ...structured,
      sections: structured.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map(item =>
                item.id === itemId && item.bullets
                  ? { ...item, bullets: [...item.bullets, ''] }
                  : item
              )
            }
          : s
      )
    })
  }
  
  // Remove bullet
  const removeBullet = (sectionId: string, itemId: string, bulletIndex: number) => {
    emitChange({
      ...structured,
      sections: structured.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map(item =>
                item.id === itemId && item.bullets
                  ? { ...item, bullets: item.bullets.filter((_, i) => i !== bulletIndex) }
                  : item
              )
            }
          : s
      )
    })
  }
  
  // Move bullet up/down
  const moveBullet = (sectionId: string, itemId: string, bulletIndex: number, direction: 'up' | 'down') => {
    emitChange({
      ...structured,
      sections: structured.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map(item => {
                if (item.id === itemId && item.bullets) {
                  const newBullets = [...item.bullets]
                  const newIndex = direction === 'up' ? bulletIndex - 1 : bulletIndex + 1
                  if (newIndex >= 0 && newIndex < newBullets.length) {
                    [newBullets[bulletIndex], newBullets[newIndex]] = [newBullets[newIndex], newBullets[bulletIndex]]
                  }
                  return { ...item, bullets: newBullets }
                }
                return item
              })
            }
          : s
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Header: Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Name
        </label>
        <input
          type="text"
          value={structured.name}
          onChange={(e) => updateName(e.target.value)}
          className="w-full px-3 py-2 text-lg font-bold text-center border border-gray-300 dark:border-zinc-600 rounded-lg 
                     bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Your Name"
        />
      </div>
      
      {/* Contact Info */}
      {structured.contactInfo.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Contact Information
          </label>
          {structured.contactInfo.map((contact, idx) => (
            <input
              key={idx}
              type="text"
              value={contact}
              onChange={(e) => updateContact(idx, e.target.value)}
              className="w-full px-3 py-2 text-sm text-center border border-gray-300 dark:border-zinc-600 rounded-lg 
                         bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 mb-2
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@example.com | (555) 123-4567 | linkedin.com/in/yourname"
            />
          ))}
        </div>
      )}
      
      {/* Sections */}
      {structured.sections.map((section) => (
        <div key={section.id} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
          {/* Section Header */}
          <div className="bg-gray-100 dark:bg-zinc-800 px-4 py-2">
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSectionTitle(section.id, e.target.value)}
              className="w-full px-2 py-1 font-semibold text-gray-900 dark:text-gray-100 
                         bg-transparent border-b-2 border-transparent
                         focus:border-blue-500 focus:outline-none"
              placeholder="Section Title"
            />
          </div>
          
          {/* Section Items */}
          <div className="p-4 space-y-4">
            {section.items.map((item) => (
              <div key={item.id} className="space-y-2">
                {item.type === 'job' && (
                  <>
                    {/* Job Title */}
                    {item.title !== undefined && (
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
                        className="w-full px-3 py-1.5 font-semibold text-gray-900 dark:text-gray-100
                                   border border-gray-200 dark:border-zinc-600 rounded
                                   bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500"
                        placeholder="Job Title"
                      />
                    )}
                    {/* Job Subtitle (Company | Date) */}
                    <input
                      type="text"
                      value={item.subtitle || ''}
                      onChange={(e) => updateItem(section.id, item.id, { subtitle: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                                 border border-gray-200 dark:border-zinc-600 rounded
                                 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="Company | Location | Date Range"
                    />
                    {/* Bullets */}
                    <div className="ml-4 space-y-2">
                      {item.bullets?.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 group">
                          <span className="text-gray-400 mt-2">•</span>
                          <textarea
                            value={bullet}
                            onChange={(e) => updateBullet(section.id, item.id, bIdx, e.target.value)}
                            rows={2}
                            className="flex-1 px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200
                                       border border-gray-200 dark:border-zinc-600 rounded
                                       bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Describe your achievement or responsibility..."
                          />
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => moveBullet(section.id, item.id, bIdx, 'up')}
                              disabled={bIdx === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="Move up"
                            >
                              <ChevronUpIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveBullet(section.id, item.id, bIdx, 'down')}
                              disabled={bIdx === (item.bullets?.length || 0) - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="Move down"
                            >
                              <ChevronDownIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeBullet(section.id, item.id, bIdx)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Remove bullet"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addBullet(section.id, item.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 ml-4"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        Add bullet point
                      </button>
                    </div>
                  </>
                )}
                
                {item.type === 'bullet' && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 mt-2">•</span>
                    <textarea
                      value={item.text || ''}
                      onChange={(e) => updateItem(section.id, item.id, { text: e.target.value })}
                      rows={2}
                      className="flex-1 px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200
                                 border border-gray-200 dark:border-zinc-600 rounded
                                 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}
                
                {item.type === 'paragraph' && (
                  <textarea
                    value={item.text || ''}
                    onChange={(e) => updateItem(section.id, item.id, { text: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm text-gray-800 dark:text-gray-200
                               border border-gray-200 dark:border-zinc-600 rounded
                               bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        ✓ Structured editing prevents formatting errors in your PDF
      </p>
    </div>
  )
}
