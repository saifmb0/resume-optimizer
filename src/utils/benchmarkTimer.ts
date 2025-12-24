/**
 * Benchmark Timer for SSE performance monitoring
 * Tracks critical performance metrics for streaming responses:
 * - First response received (first byte)
 * - First response displayed (rendered in UI)
 * - Last response received (stream complete)
 * - Last response displayed (final render complete)
 */

'use client'

import React from 'react'

export interface SSEBenchmark {
  // Timing measurements (in milliseconds, relative to start)
  firstResponseReceivedAt: number
  firstResponseDisplayedAt: number
  lastResponseReceivedAt: number
  lastResponseDisplayedAt: number
  analysisReceivedAt: number
  
  // Calculated metrics
  timeToFirstByte: number // TTFB - time until first byte received
  timeToFirstDisplay: number // Time until first chunk rendered
  totalStreamTime: number // Time until stream completes
  totalDisplayTime: number // Time until final render completes
  timeToAnalysis: number // Time until analysis event received
  
  // Additional metrics
  chunkCount: number
  totalDataSize: number
  averageChunkSize: number
}

export class BenchmarkTimer {
  private startTime: number
  private metrics: Partial<SSEBenchmark> = {
    chunkCount: 0,
    totalDataSize: 0,
  }

  constructor() {
    this.startTime = performance.now()
  }

  recordFirstResponseReceived(): void {
    if (this.metrics.firstResponseReceivedAt === undefined) {
      this.metrics.firstResponseReceivedAt = performance.now() - this.startTime
    }
  }

  recordFirstResponseDisplayed(): void {
    if (this.metrics.firstResponseDisplayedAt === undefined) {
      this.metrics.firstResponseDisplayedAt = performance.now() - this.startTime
    }
  }

  recordAnalysisReceived(): void {
    if (this.metrics.analysisReceivedAt === undefined) {
      this.metrics.analysisReceivedAt = performance.now() - this.startTime
    }
  }

  recordChunk(chunkSize: number): void {
    this.metrics.chunkCount = (this.metrics.chunkCount || 0) + 1
    this.metrics.totalDataSize = (this.metrics.totalDataSize || 0) + chunkSize
  }

  recordLastResponseReceived(): void {
    if (this.metrics.lastResponseReceivedAt === undefined) {
      this.metrics.lastResponseReceivedAt = performance.now() - this.startTime
    }
  }

  recordLastResponseDisplayed(): void {
    if (this.metrics.lastResponseDisplayedAt === undefined) {
      this.metrics.lastResponseDisplayedAt = performance.now() - this.startTime
    }
  }

  finalize(): SSEBenchmark {
    const metrics = {
      firstResponseReceivedAt: this.metrics.firstResponseReceivedAt || 0,
      firstResponseDisplayedAt: this.metrics.firstResponseDisplayedAt || 0,
      lastResponseReceivedAt: this.metrics.lastResponseReceivedAt || 0,
      lastResponseDisplayedAt: this.metrics.lastResponseDisplayedAt || 0,
      analysisReceivedAt: this.metrics.analysisReceivedAt || 0,
      chunkCount: this.metrics.chunkCount || 0,
      totalDataSize: this.metrics.totalDataSize || 0,
      averageChunkSize: (this.metrics.chunkCount || 0) > 0 
        ? (this.metrics.totalDataSize || 0) / (this.metrics.chunkCount || 1) 
        : 0,
    }

    return {
      ...metrics,
      timeToFirstByte: metrics.firstResponseReceivedAt,
      timeToFirstDisplay: metrics.firstResponseDisplayedAt,
      totalStreamTime: metrics.lastResponseReceivedAt,
      totalDisplayTime: metrics.lastResponseDisplayedAt,
      timeToAnalysis: metrics.analysisReceivedAt,
    }
  }

  /**
   * Get formatted benchmark report for logging or UI display
   */
  getReport(): string {
    const benchmark = this.finalize()
    const formatTime = (ms: number) => {
      if (ms < 1000) return `${ms.toFixed(0)}ms`
      return `${(ms / 1000).toFixed(2)}s`
    }

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes}B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
      return `${(bytes / 1024 / 1024).toFixed(2)}MB`
    }

    return `
===== SSE BENCHMARK REPORT =====
⏱️  Time to First Byte (TTFB):     ${formatTime(benchmark.timeToFirstByte)}
📊 Time to First Display:         ${formatTime(benchmark.timeToFirstDisplay)}
⏳ Time to Last Byte:             ${formatTime(benchmark.totalStreamTime)}
✅ Total Display Time:            ${formatTime(benchmark.totalDisplayTime)}
📈 Chunks Received:               ${benchmark.chunkCount}
💾 Total Data Size:               ${formatBytes(benchmark.totalDataSize)}
📦 Average Chunk Size:            ${formatBytes(benchmark.averageChunkSize)}
================================
    `.trim()
  }

  /**
   * Get compact benchmark metrics object for JSON serialization
   */
  getMetrics(): SSEBenchmark {
    return this.finalize()
  }
}

/**
 * Hook for managing benchmark timer in React components
 */
export function useBenchmarkTimer() {
  const timerRef = React.useRef<BenchmarkTimer | null>(null)

  const init = () => {
    timerRef.current = new BenchmarkTimer()
  }

  const recordFirstResponseReceived = () => {
    timerRef.current?.recordFirstResponseReceived()
  }

  const recordFirstResponseDisplayed = () => {
    timerRef.current?.recordFirstResponseDisplayed()
  }

  const recordChunk = (chunkSize: number) => {
    timerRef.current?.recordChunk(chunkSize)
  }

  const recordLastResponseReceived = () => {
    timerRef.current?.recordLastResponseReceived()
  }

  const recordLastResponseDisplayed = () => {
    timerRef.current?.recordLastResponseDisplayed()
  }

  const getMetrics = (): SSEBenchmark | null => {
    return timerRef.current?.getMetrics() || null
  }

  const getReport = (): string => {
    return timerRef.current?.getReport() || ''
  }

  return {
    init,
    recordFirstResponseReceived,
    recordFirstResponseDisplayed,
    recordChunk,
    recordLastResponseReceived,
    recordLastResponseDisplayed,
    getMetrics,
    getReport,
  }
}
