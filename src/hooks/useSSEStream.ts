'use client'

import { createParser, type EventSourceMessage } from 'eventsource-parser'
import { BenchmarkTimer, type SSEBenchmark } from '@/utils/benchmarkTimer'

export type { SSEBenchmark }

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
  onBenchmark?: (benchmark: SSEBenchmark) => void // Called with benchmark metrics
}

export interface SSEResult {
  completed: boolean
  partialText: string
  benchmark: SSEBenchmark
}

/**
 * Parses an SSE stream using eventsource-parser for robust handling
 * of network fragmentation, multi-byte characters, and edge cases.
 * 
 * Returns result indicating if stream completed successfully,
 * partial text for continuation capability, and benchmark metrics.
 */
export async function parseSSEStream(
  response: Response,
  callbacks: SSECallbacks,
  startTime?: number
): Promise<SSEResult> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  // Pass the startTime (or undefined) to the timer
  const benchmark = new BenchmarkTimer(startTime)
  const decoder = new TextDecoder()
  let documentText = ''
  let streamCompleted = false
  let firstChunkReceived = false
  let firstChunkDisplayed = false

  const parser = createParser({
    onEvent: (event: EventSourceMessage) => {
      // Record first byte received
      if (!firstChunkReceived) {
        benchmark.recordFirstResponseReceived()
        firstChunkReceived = true
      }

      const eventType = event.event || ''
      
      if (event.data) {
        try {
          const data = JSON.parse(event.data)
          
          switch (eventType) {
            case 'analysis':
              benchmark.recordAnalysisReceived()
              // Record analysis as first meaningful paint interaction
              if (!firstChunkDisplayed) {
                benchmark.recordFirstResponseDisplayed()
                firstChunkDisplayed = true
              }
              callbacks.onAnalysis?.(data)
              break
            case 'chunk':
              documentText += data.text
              benchmark.recordChunk(data.text?.length || 0)
              // Record first display when first chunk arrives (if not already set by analysis)
              if (!firstChunkDisplayed && documentText.length > 0) {
                benchmark.recordFirstResponseDisplayed()
                firstChunkDisplayed = true
              }
              callbacks.onChunk?.(documentText)
              break
            case 'done':
              streamCompleted = true
              benchmark.recordLastResponseReceived()
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

  // Record final display timing
  benchmark.recordLastResponseDisplayed()

  // Detect incomplete stream (no 'done' event received)
  if (!streamCompleted && documentText.length > 0) {
    callbacks.onIncomplete?.(documentText)
  }

  // Finalize and report benchmarks
  const benchmarkMetrics = benchmark.finalize()
  callbacks.onBenchmark?.(benchmarkMetrics)

  // Log benchmark report for debugging
  console.log(benchmark.getReport())

  return {
    completed: streamCompleted,
    partialText: documentText,
    benchmark: benchmarkMetrics,
  }
}
