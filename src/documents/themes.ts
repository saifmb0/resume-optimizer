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

// Modern Theme - Clean sans-serif with blue accents
const modernStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Open Sans',
    fontSize: 9,
    lineHeight: 1.3,
    color: '#1f2937',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2563eb',
  },
  contactInfo: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 16,
    color: '#4b5563',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 3,
    color: '#1f2937',
  },
  paragraph: {
    fontSize: 9,
    marginBottom: 3,
    textAlign: 'justify',
    color: '#374151',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 2,
    marginLeft: 10,
  },
  bullet: {
    width: 10,
    fontSize: 10,
    color: '#2563eb',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 3,
    color: '#1f2937',
  },
  inlineText: {
    fontSize: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

// Classic Theme - Elegant serif with traditional styling
const classicStyles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Lora',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#000000',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#1f2937',
    letterSpacing: 1,
  },
  contactInfo: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4b5563',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'justify',
    color: '#1f2937',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 5,
    marginLeft: 16,
  },
  bullet: {
    width: 12,
    fontSize: 11,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: '#1f2937',
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  inlineText: {
    fontSize: 11,
  },
  boldText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

// Minimal Theme - Ultra-clean, lots of whitespace
const minimalStyles = StyleSheet.create({
  page: {
    padding: 45,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 4,
    color: '#111827',
  },
  contactInfo: {
    fontSize: 9,
    textAlign: 'left',
    marginBottom: 24,
    color: '#6b7280',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    color: '#374151',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 8,
  },
  bullet: {
    width: 8,
    fontSize: 10,
    color: '#9ca3af',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  jobTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#111827',
  },
  inlineText: {
    fontSize: 10,
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
