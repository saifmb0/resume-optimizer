import { StyleSheet, Font } from '@react-pdf/renderer'

// Register fonts locally for privacy and performance
// Fonts are served from /public/fonts to avoid CDN latency and IP leakage
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: '/fonts/OpenSans-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/OpenSans-Bold.ttf', fontWeight: 'bold' },
  ],
})

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
})

Font.register({
  family: 'Lora',
  fonts: [
    { src: '/fonts/Lora-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Lora-Bold.ttf', fontWeight: 'bold' },
  ],
})

export type ThemeId = 'modern' | 'classic' | 'minimal'

export interface ThemeConfig {
  id: ThemeId
  name: string
  description: string
  preview: {
    fontFamily: string
    accentColor: string
  }
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean sans-serif with blue accents',
    preview: { fontFamily: 'Open Sans', accentColor: '#2563eb' },
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Elegant serif font, traditional layout',
    preview: { fontFamily: 'Lora', accentColor: '#1f2937' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean with subtle styling',
    preview: { fontFamily: 'Roboto', accentColor: '#6b7280' },
  },
]

// Modern Theme - Clean sans-serif with blue accents (compact for one-page fit)
const modernStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Open Sans',
    fontSize: 9,
    lineHeight: 1.25,
    color: '#1f2937',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#2563eb',
  },
  contactInfo: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 10,
    color: '#4b5563',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 3,
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    paddingBottom: 2,
    color: '#1f2937',
  },
  paragraph: {
    fontSize: 9,
    marginBottom: 2,
    textAlign: 'justify',
    color: '#374151',
  },
  bulletList: {
    marginBottom: 2,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 1,
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 8,
    fontSize: 9,
    color: '#2563eb',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
  },
  jobTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
    color: '#1f2937',
  },
  inlineText: {
    fontSize: 9,
  },
  boldText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

// Classic Theme - Elegant serif with traditional styling (compact for one-page fit)
const classicStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Lora',
    fontSize: 9.5,
    lineHeight: 1.3,
    color: '#000000',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#1f2937',
    letterSpacing: 0.5,
  },
  contactInfo: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 12,
    color: '#4b5563',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    paddingBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 9.5,
    marginBottom: 2,
    textAlign: 'justify',
    color: '#1f2937',
  },
  bulletList: {
    marginBottom: 2,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 1,
    marginLeft: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 10,
    fontSize: 9.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: '#1f2937',
  },
  jobTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  inlineText: {
    fontSize: 9.5,
  },
  boldText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

// Minimal Theme - Ultra-clean design (compact for one-page fit)
const minimalStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 9,
    lineHeight: 1.3,
    color: '#374151',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 3,
    color: '#111827',
  },
  contactInfo: {
    fontSize: 8,
    textAlign: 'left',
    marginBottom: 12,
    color: '#6b7280',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 9,
    marginBottom: 2,
    color: '#374151',
  },
  bulletList: {
    marginBottom: 2,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 1,
    marginLeft: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    fontSize: 9,
    color: '#9ca3af',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
  },
  jobTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
    color: '#111827',
  },
  inlineText: {
    fontSize: 9,
  },
  boldText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

export const themeStyles: Record<ThemeId, ReturnType<typeof StyleSheet.create>> = {
  modern: modernStyles,
  classic: classicStyles,
  minimal: minimalStyles,
}

// Export type for use in components
export type ThemeStyles = ReturnType<typeof StyleSheet.create>

export function getThemeStyles(themeId: ThemeId): ThemeStyles {
  return themeStyles[themeId] || modernStyles
}
