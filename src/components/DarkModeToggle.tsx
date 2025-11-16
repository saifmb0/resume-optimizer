'use client'

import { useDarkMode } from '@/contexts/DarkModeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export default function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const handleClick = () => {
    toggleDarkMode()
  }

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[32px]">
        {isDarkMode ? 'Dark' : 'Light'}
      </span>
      
      <button
        onClick={handleClick}
        className="relative inline-flex items-center w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-200 focus:outline-none hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Toggle dark mode"
      >
        {/* Toggle slider */}
        <span
          className={`
            absolute inline-block w-6 h-7 bg-white dark:bg-gray-100 rounded-full shadow-md transform transition-transform duration-200 ease-in-out
            ${isDarkMode ? 'translate-x-13' : 'translate-x-1'}
          `}
        />
        
        {/* Sun icon */}
        <SunIcon 
          className={`
            absolute left-1.5 w-5 h-6 text-yellow-500 transition-opacity duration-200 z-10
            ${isDarkMode ? 'opacity-0' : 'opacity-100'}
          `}
        />
        
        {/* Moon icon */}
        <MoonIcon 
          className={`
            absolute right-1.5 w-4 h-5 text-blue-400 transition-opacity duration-200 z-10
            ${isDarkMode ? 'opacity-100' : 'opacity-0'}
          `}
        />
      </button>
    </div>
  )
}
