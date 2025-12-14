'use client'

import { useCallback, useMemo } from 'react'
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useDocumentEditor } from '../hooks/useDocumentEditor'

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
 * Extract text from AST node
 */
function extractText(node: any): string {
  if (node.type === 'text') return node.value || ''
  if (node.children) {
    return node.children.map((child: any) => extractText(child)).join('')
  }
  return ''
}

/**
 * Parse AST into structured format for rendering (AST is source of truth)
 */
function parseToStructured(ast: any): StructuredContent {
  const result: StructuredContent = {
    name: '',
    contactInfo: [],
    sections: []
  }
  
  const children = ast.children || []
  
  // Find name (first strong/bold or heading)
  const nameNode = children.find((node: any) => 
    node.type === 'strong' || 
    (node.type === 'paragraph' && node.children?.some((c: any) => c.type === 'strong'))
  )
  result.name = nameNode ? extractText(nameNode) : ''
  
  // Find contact info (paragraphs with pipes before first heading)
  const firstHeadingIndex = children.findIndex((node: any) => node.type === 'heading')
  const contactNodes = children.slice(1, firstHeadingIndex > 0 ? firstHeadingIndex : children.length)
    .filter((node: any) => node.type === 'paragraph' && extractText(node).includes('|'))
  result.contactInfo = contactNodes.map((node: any) => extractText(node))
  
  // Parse sections (headings + their content)
  for (let i = 0; i < children.length; i++) {
    const node = children[i] as any
    
    if (node.type === 'heading') {
      const section: ContentSection = {
        id: `section_${i}`,
        title: extractText(node),
        items: []
      }
      
      // Collect items until next heading
      for (let j = i + 1; j < children.length; j++) {
        const itemNode = children[j] as any
        
        if (itemNode.type === 'heading') break
        
        if (itemNode.type === 'list') {
          // Parse list items
          itemNode.children?.forEach((listItem: any, idx: number) => {
            const firstChild = listItem.children?.[0] as any
            if (!firstChild) return
            
            const text = extractText(firstChild)
            
            // Check if it's a job entry (has strong/bold)
            const hasStrong = firstChild.children?.some((c: any) => c.type === 'strong')
            
            if (hasStrong && text.includes('|')) {
              // Job entry
              const strongNode = firstChild.children?.find((c: any) => c.type === 'strong')
              const jobTitle = strongNode ? extractText(strongNode) : ''
              const subtitle = text.replace(jobTitle, '').trim()
              
              // Find nested bullets (remaining list items in this group)
              const bullets: string[] = []
              for (let k = 1; k < listItem.children.length; k++) {
                const bulletNode = listItem.children[k]
                bullets.push(extractText(bulletNode))
              }
              
              section.items.push({
                id: `item_${j}_${idx}`,
                type: 'job',
                title: jobTitle,
                subtitle,
                bullets,
              })
            } else {
              // Simple bullet
              section.items.push({
                id: `item_${j}_${idx}`,
                type: 'bullet',
                text,
              })
            }
          })
        } else if (itemNode.type === 'paragraph') {
          section.items.push({
            id: `item_${j}`,
            type: 'paragraph',
            text: extractText(itemNode),
          })
        }
      }
      
      result.sections.push(section)
    }
  }
  
  return result
}

export default function StructuredEditor({ content, onChange }: StructuredEditorProps) {
  // Use AST-backed document editor hook (single source of truth, no useEffect syncing)
  const { state, updateNode, addBullet, removeBullet, moveBullet } = useDocumentEditor(content)
  
  // Parse structured view from AST for rendering
  const structured = useMemo(() => parseToStructured(state.ast), [state.ast])
  
  // Emit markdown changes to parent
  const emitChange = useCallback(() => {
    onChange(state.markdown)
  }, [state.markdown, onChange])
  
  // Update name
  const updateName = useCallback((name: string) => {
    updateNode([0, 0, 0], name)
    emitChange()
  }, [updateNode, emitChange])
  
  // Update contact info
  const updateContact = useCallback((index: number, value: string) => {
    updateNode([index + 1, 0], value)
    emitChange()
  }, [updateNode, emitChange])
  
  // Update section title
  const updateSectionTitle = useCallback((sectionId: string, title: string) => {
    const section = structured.sections.find(s => s.id === sectionId)
    if (section) {
      const sectionIndex = parseInt(sectionId.split('_')[1])
      updateNode([sectionIndex, 0], title)
      emitChange()
    }
  }, [structured.sections, updateNode, emitChange])
  
  // Update item (simplified for AST-backed state)
  const updateItem = useCallback((_sectionId: string, _itemId: string, _updates: Partial<SectionItem>) => {
    // Items are now read-only from AST; use raw markdown editing for complex changes
    emitChange()
  }, [emitChange])
  
  // Update bullet in a job
  const updateBullet = useCallback((_sectionId: string, _itemId: string, _bulletIndex: number, _value: string) => {
    // Bullet content updates handled through raw markdown mode
    emitChange()
  }, [emitChange])
  
  // Add bullet to a section
  const handleAddBullet = useCallback((sectionId: string, _itemId: string) => {
    const sectionIndex = parseInt(sectionId.split('_')[1])
    addBullet(sectionIndex)
    emitChange()
  }, [addBullet, emitChange])
  
  // Remove bullet
  const handleRemoveBullet = useCallback((sectionId: string, _itemId: string, bulletIndex: number) => {
    const sectionIndex = parseInt(sectionId.split('_')[1])
    removeBullet(sectionIndex, bulletIndex)
    emitChange()
  }, [removeBullet, emitChange])
  
  // Move bullet up/down
  const handleMoveBullet = useCallback((sectionId: string, _itemId: string, bulletIndex: number, direction: 'up' | 'down') => {
    const sectionIndex = parseInt(sectionId.split('_')[1])
    const toIndex = direction === 'up' ? bulletIndex - 1 : bulletIndex + 1
    moveBullet(sectionIndex, bulletIndex, toIndex)
    emitChange()
  }, [moveBullet, emitChange])

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
                              onClick={() => handleMoveBullet(section.id, item.id, bIdx, 'up')}
                              disabled={bIdx === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="Move up"
                            >
                              <ChevronUpIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveBullet(section.id, item.id, bIdx, 'down')}
                              disabled={bIdx === (item.bullets?.length || 0) - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="Move down"
                            >
                              <ChevronDownIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveBullet(section.id, item.id, bIdx)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Remove bullet"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddBullet(section.id, item.id)}
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
