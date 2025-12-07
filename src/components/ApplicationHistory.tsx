'use client'

import { useState } from 'react'
import { 
  ClockIcon, 
  TrashIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import type { SavedApplication } from '@/hooks/useApplicationHistory'

interface ApplicationHistoryProps {
  applications: SavedApplication[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, newName: string) => void
  onNewApplication: () => void
}

export default function ApplicationHistory({
  applications,
  activeId,
  onSelect,
  onDelete,
  onRename,
  onNewApplication
}: ApplicationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleStartEdit = (app: SavedApplication, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(app.id)
    setEditName(app.name)
  }

  const handleSaveEdit = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (editName.trim()) {
      onRename(id, editName.trim())
    }
    setEditingId(null)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Delete this application? This cannot be undone.')) {
      onDelete(id)
    }
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    setIsOpen(false)
  }

  const activeApp = applications.find(app => app.id === activeId)

  if (applications.length === 0) {
    return null // Don't show if no history
  }

  return (
    <div className="relative">
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                   bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg
                   hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ClockIcon className="w-4 h-4" />
        <span className="hidden sm:inline">
          {activeApp ? activeApp.name : 'History'}
        </span>
        <span className="sm:hidden">History</span>
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-1.5 py-0.5 rounded-full">
          {applications.length}
        </span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50
                          bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 
                          rounded-lg shadow-lg">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Application History
                </h3>
                <button
                  onClick={() => { onNewApplication(); setIsOpen(false); }}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 
                             hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  New
                </button>
              </div>
            </div>

            {/* Application list */}
            <div className="py-1">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => editingId !== app.id && handleSelect(app.id)}
                  className={`px-3 py-2.5 cursor-pointer transition-colors
                    ${app.id === activeId 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-700 border-l-2 border-transparent'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Name (editable) */}
                    <div className="flex-1 min-w-0">
                      {editingId === app.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(app.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-sm px-1.5 py-0.5 border border-blue-400 rounded
                                       bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100
                                       focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveEdit(app.id, e)}
                            className="p-0.5 text-green-600 hover:text-green-700"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-0.5 text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <DocumentDuplicateIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {app.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Meta info */}
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(app.updatedAt)}</span>
                        {app.matchAnalysis && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium
                            ${app.matchAnalysis.score >= 75 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                              : app.matchAnalysis.score >= 50
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                            }`}
                          >
                            {app.matchAnalysis.score}%
                          </span>
                        )}
                        <span className="capitalize text-gray-400">{app.tone}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {editingId !== app.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleStartEdit(app, e)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Rename"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(app.id, e)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
