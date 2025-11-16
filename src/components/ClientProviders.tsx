'use client'

import { DarkModeProvider } from '@/contexts/DarkModeContext'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <DarkModeProvider>
      {children}
    </DarkModeProvider>
  )
}
