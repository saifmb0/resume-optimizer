'use client'

import { THEMES, type ThemeId } from '@/documents/themes'

interface ThemeSelectorProps {
  selectedTheme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

export default function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        PDF Style
      </label>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onThemeChange(theme.id)}
            className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedTheme === theme.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
            }`}
          >
            {/* Theme Preview */}
            <div className="mb-2">
              <div 
                className="h-2 w-full rounded mb-1"
                style={{ backgroundColor: theme.preview.accentColor }}
              />
              <div className="space-y-1">
                <div className="h-1.5 bg-gray-300 dark:bg-zinc-600 rounded w-3/4" />
                <div className="h-1 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
                <div className="h-1 bg-gray-200 dark:bg-zinc-700 rounded w-5/6" />
              </div>
            </div>
            
            {/* Theme Name */}
            <p className={`text-sm font-medium ${
              selectedTheme === theme.id
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {theme.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {theme.description}
            </p>

            {/* Selected Indicator */}
            {selectedTheme === theme.id && (
              <div className="absolute top-2 right-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
