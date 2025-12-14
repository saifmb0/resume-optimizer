import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CoverLetterGenerator, createCoverLetterGenerator, type AnalysisResult } from './CoverLetterGenerator'
import type { GoogleGenAI } from '@google/genai'

// Mock GoogleGenAI
const createMockAIClient = () => {
  return {
    models: {
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
    },
  } as unknown as GoogleGenAI
}

describe('CoverLetterGenerator', () => {
  let mockClient: GoogleGenAI
  let generator: CoverLetterGenerator

  beforeEach(() => {
    mockClient = createMockAIClient()
    generator = new CoverLetterGenerator(mockClient)
  })

  describe('analyzeResume', () => {
    it('should successfully analyze resume and return parsed result', async () => {
      const mockResponse = {
        text: JSON.stringify({
          score: 85,
          reasoning: 'Strong match with required skills',
          missingKeywords: ['kubernetes'],
          strengths: ['React', 'TypeScript', 'Node.js'],
        }),
      }

      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockResponse)

      const result = await generator.analyzeResume(
        'Software Engineer position requiring React and TypeScript',
        'Experienced developer with React, TypeScript, and Node.js'
      )

      expect(result.score).toBe(85)
      expect(result.reasoning).toBe('Strong match with required skills')
      expect(result.missingKeywords).toContain('kubernetes')
      expect(result.strengths).toHaveLength(3)
    })

    it('should throw error when analysis returns empty text', async () => {
      const mockResponse = { text: '' }
      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockResponse)

      await expect(
        generator.analyzeResume('Job description', 'Resume')
      ).rejects.toThrow('Analysis phase returned empty response')
    })

    it('should throw error when analysis returns invalid JSON', async () => {
      const mockResponse = { text: 'not valid json' }
      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockResponse)

      await expect(
        generator.analyzeResume('Job description', 'Resume')
      ).rejects.toThrow('Failed to parse analysis response')
    })

    it('should throw error when analysis response fails schema validation', async () => {
      const mockResponse = {
        text: JSON.stringify({
          score: 'invalid', // Should be number
          reasoning: 'Test',
        }),
      }
      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockResponse)

      await expect(
        generator.analyzeResume('Job description', 'Resume')
      ).rejects.toThrow('Failed to parse analysis response')
    })

    it('should validate score is within 0-100 range', async () => {
      const mockResponse = {
        text: JSON.stringify({
          score: 150, // Invalid score
          reasoning: 'Test',
          missingKeywords: [],
          strengths: [],
        }),
      }
      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockResponse)

      await expect(
        generator.analyzeResume('Job description', 'Resume')
      ).rejects.toThrow()
    })

    it('should handle API errors gracefully', async () => {
      vi.spyOn(mockClient.models, 'generateContent').mockRejectedValue(
        new Error('API quota exceeded')
      )

      await expect(
        generator.analyzeResume('Job description', 'Resume')
      ).rejects.toThrow('API quota exceeded')
    })
  })

  describe('generateDocument', () => {
    it('should successfully generate document from analysis', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '{"generatedDocument": "Dear Hiring Manager,\\n\\nI am writing to apply for' }
          yield { text: ' the Software Engineer position.\\n\\nSincerely,\\nJohn Doe"}' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockStream as any)

      const analysis: AnalysisResult = {
        score: 85,
        reasoning: 'Good match',
        missingKeywords: [],
        strengths: ['React', 'TypeScript'],
      }

      const result = await generator.generateDocument(
        'Job description',
        'Resume',
        'CoverLetter',
        analysis
      )

      expect(result).toContain('Dear Hiring Manager')
      expect(result).toContain('Sincerely')
    })

    it('should throw error when generation returns empty text', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockStream as any)

      const analysis: AnalysisResult = {
        score: 85,
        reasoning: 'Good',
        missingKeywords: [],
        strengths: [],
      }

      await expect(
        generator.generateDocument('Job', 'Resume', 'CV', analysis)
      ).rejects.toThrow('Generation phase returned empty response')
    })

    it('should throw error when generation returns invalid JSON', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: 'not valid json response' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockStream as any)

      const analysis: AnalysisResult = {
        score: 85,
        reasoning: 'Good',
        missingKeywords: [],
        strengths: [],
      }

      await expect(
        generator.generateDocument('Job', 'Resume', 'CV', analysis)
      ).rejects.toThrow('Failed to parse generation response')
    })

    it('should handle continuation text when provided', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '{"generatedDocument": "Continuing from previous text, I have extensive experience..."}' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockStream as any)

      const analysis: AnalysisResult = {
        score: 85,
        reasoning: 'Good',
        missingKeywords: [],
        strengths: [],
      }

      const result = await generator.generateDocument(
        'Job',
        'Resume',
        'CV',
        analysis,
        'Previous partial text'
      )

      expect(result).toContain('Continuing from previous text')
    })

    it('should accumulate multiple chunks from stream', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '{"gen' }
          yield { text: 'erat' }
          yield { text: 'edDo' }
          yield { text: 'cument": "Full document text"}' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockStream as any)

      const analysis: AnalysisResult = {
        score: 85,
        reasoning: 'Good',
        missingKeywords: [],
        strengths: [],
      }

      const result = await generator.generateDocument('Job', 'Resume', 'CV', analysis)
      expect(result).toBe('Full document text')
    })
  })

  describe('generateStream', () => {
    it('should yield analysis event first', async () => {
      const mockAnalysisResponse = {
        text: JSON.stringify({
          score: 75,
          reasoning: 'Decent match',
          missingKeywords: ['AWS'],
          strengths: ['React'],
        }),
      }

      const mockGenStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '{"generatedDocument": "Dear Hiring Manager,\\n\\nI am applying for the position."}' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockAnalysisResponse)
      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockGenStream as any)

      const events = []
      for await (const event of generator.generateStream({
        jobDescription: 'Job',
        resume: 'Resume',
        tone: 'CV',
      })) {
        events.push(event)
      }

      expect(events[0].type).toBe('analysis')
      expect(events[0].data).toHaveProperty('score', 75)
    })

    it('should yield chunk events during generation', async () => {
      const mockAnalysisResponse = {
        text: JSON.stringify({
          score: 80,
          reasoning: 'Good',
          missingKeywords: [],
          strengths: [],
        }),
      }

      const mockGenStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '{"generatedDocument": "' + 'A'.repeat(250) + '"}' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockAnalysisResponse)
      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockGenStream as any)

      const events = []
      for await (const event of generator.generateStream({
        jobDescription: 'Job',
        resume: 'Resume',
        tone: 'CV',
      })) {
        events.push(event)
      }

      const chunkEvents = events.filter((e) => e.type === 'chunk')
      expect(chunkEvents.length).toBeGreaterThan(0)
    })

    it('should yield done event with complete document', async () => {
      const mockAnalysisResponse = {
        text: JSON.stringify({
          score: 90,
          reasoning: 'Excellent',
          missingKeywords: [],
          strengths: ['React', 'Node'],
        }),
      }

      const generatedDoc = 'Dear Hiring Manager, I am excited to apply for this position. My experience with React and Node.js makes me an ideal candidate for your team. Sincerely, John Doe'
      const mockGenStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: JSON.stringify({ generatedDocument: generatedDoc }) }
        },
      }

      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockAnalysisResponse)
      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockGenStream as any)

      const events = []
      for await (const event of generator.generateStream({
        jobDescription: 'Job',
        resume: 'Resume',
        tone: 'CoverLetter',
      })) {
        events.push(event)
      }

      const doneEvent = events.find((e) => e.type === 'done')
      expect(doneEvent).toBeDefined()
      expect(doneEvent?.data.generatedDocument).toBe(generatedDoc)
    })

    it('should yield error event when document is too short', async () => {
      const mockAnalysisResponse = {
        text: JSON.stringify({
          score: 80,
          reasoning: 'Good',
          missingKeywords: [],
          strengths: [],
        }),
      }

      const mockGenStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: '{"generatedDocument": "Too short"}' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockAnalysisResponse)
      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockGenStream as any)

      const events = []
      for await (const event of generator.generateStream({
        jobDescription: 'Job',
        resume: 'Resume',
        tone: 'CV',
      })) {
        events.push(event)
      }

      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeDefined()
      expect(errorEvent?.data.error).toContain('generating content')
    })

    it('should yield error event on API key error', async () => {
      vi.spyOn(mockClient.models, 'generateContent').mockRejectedValue(
        new Error('Invalid API key provided')
      )

      const events = []
      for await (const event of generator.generateStream({
        jobDescription: 'Job',
        resume: 'Resume',
        tone: 'CV',
      })) {
        events.push(event)
      }

      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeDefined()
      expect(errorEvent?.data.error).toContain('API configuration error')
    })

    it('should yield error event on quota exceeded', async () => {
      vi.spyOn(mockClient.models, 'generateContent').mockRejectedValue(
        new Error('API quota exceeded')
      )

      const events = []
      for await (const event of generator.generateStream({
        jobDescription: 'Job',
        resume: 'Resume',
        tone: 'CV',
      })) {
        events.push(event)
      }

      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeDefined()
      expect(errorEvent?.data.error).toContain('temporarily unavailable')
    })

    it('should yield error event on parse error', async () => {
      const mockAnalysisResponse = {
        text: JSON.stringify({
          score: 80,
          reasoning: 'Good',
          missingKeywords: [],
          strengths: [],
        }),
      }

      const mockGenStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: 'invalid json' }
        },
      }

      vi.spyOn(mockClient.models, 'generateContent').mockResolvedValue(mockAnalysisResponse)
      vi.spyOn(mockClient.models, 'generateContentStream').mockResolvedValue(mockGenStream as any)

      const events = []
      for await (const event of generator.generateStream({
        jobDescription: 'Job',
        resume: 'Resume',
        tone: 'CV',
      })) {
        events.push(event)
      }

      const errorEvent = events.find((e) => e.type === 'error')
      expect(errorEvent).toBeDefined()
      expect(errorEvent?.data.error).toContain('invalid format')
    })
  })
})

describe('createCoverLetterGenerator', () => {
  it('should create generator with API key', () => {
    const generator = createCoverLetterGenerator('test-api-key')
    expect(generator).toBeInstanceOf(CoverLetterGenerator)
  })

  it('should inject GoogleGenAI client correctly', () => {
    const generator = createCoverLetterGenerator('test-api-key')
    expect(generator).toBeDefined()
    expect(typeof generator.analyzeResume).toBe('function')
    expect(typeof generator.generateDocument).toBe('function')
    expect(typeof generator.generateStream).toBe('function')
  })
})
