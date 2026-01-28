/**
 * GPU Detection Utility
 * Checks for WebGPU support to determine if client-side AI inference is available
 */

// WebGPU types are not in standard TypeScript yet
declare global {
    interface Navigator {
        gpu?: {
            requestAdapter(): Promise<GPUAdapter | null>
        }
    }
    interface GPUAdapter {
        readonly name: string
    }
}

/**
 * Checks if WebGPU is supported in the current browser environment
 * @returns true if WebGPU is available, false otherwise
 */
export function isWebGPUSupported(): boolean {
    // SSR guard - navigator is not available on server
    if (typeof navigator === 'undefined') {
        return false
    }

    return 'gpu' in navigator && navigator.gpu !== undefined
}

/**
 * Async check that also verifies adapter availability
 * More thorough check - some browsers may have navigator.gpu but no working adapter
 * @returns Promise resolving to true if WebGPU is fully functional
 */
export async function isWebGPUAvailable(): Promise<boolean> {
    if (!isWebGPUSupported()) {
        return false
    }

    try {
        const adapter = await navigator.gpu!.requestAdapter()
        return adapter !== null
    } catch {
        return false
    }
}
