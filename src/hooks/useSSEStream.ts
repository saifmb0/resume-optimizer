'use client'

import { createParser, type EventSourceMessage } from 'eventsource-parser'

export interface SSEEvent {
  event: string
  data: unknown
}

export interface SSECallbacks {
  onAnalysis?: (data: { score: number; reasoning: string; missingKeywords: string[] }) => void
  onChunk?: (text: string) => void
  onDone?: (coverLetter: string) => void
  onError?: (error: string) => void
  onIncomplete?: (partialText: string) => void // Called when stream ends without 'done' event
}

export interface SSEResult {
  completed: boolean
  partialText: string
}

/**
 * Parses an SSE stream using eventsource-parser for robust handling
 * of network fragmentation, multi-byte characters, and edge cases.
 * 
 * Returns result indicating if stream completed successfully,
 * and any partial text for continuation capability.
 */
export async function parseSSEStream(
  response: Response,
  callbacks: SSECallbacks
): Promise<SSEResult> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let documentText = ''
  let streamCompleted = false

  const parser = createParser({
    onEvent: (event: EventSourceMessage) => {
      const eventType = event.event || ''
      
      if (event.data) {
        try {
          const data = JSON.parse(event.data)
          
          switch (eventType) {
            case 'analysis':
              callbacks.onAnalysis?.(data)
              break
            case 'chunk':
              documentText += data.text
              callbacks.onChunk?.(documentText)
              break
            case 'done':
              streamCompleted = true
              callbacks.onDone?.(data.coverLetter)
              break
            case 'error':
              callbacks.onError?.(data.error)
              break
          }
        } catch {
          console.error('Failed to parse SSE data:', event.data)
        }
      }
    }
  })

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      // Feed the raw bytes to the parser - it handles buffering and fragmentation
      const chunk = decoder.decode(value, { stream: true })
      parser.feed(chunk)
    }
    
    // Flush any remaining data
    const remaining = decoder.decode()
    if (remaining) {
      parser.feed(remaining)
    }
  } finally {
    reader.releaseLock()
  }

  // Detect incomplete stream (no 'done' event received)
  if (!streamCompleted && documentText.length > 0) {
    callbacks.onIncomplete?.(documentText)
  }

  return {
    completed: streamCompleted,
    partialText: documentText,
  }
}
