import type { NextConfig } from "next";

// Only include localhost in CSP during development
const isDev = process.env.NODE_ENV !== 'production';
const devFrameAncestors = isDev ? 'http://localhost:3000' : '';

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // WebGPU/SharedArrayBuffer requirements for WebLLM
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            // Use 'credentialless' instead of 'require-corp' to allow WebLLM model downloads
            // credentialless still enables SharedArrayBuffer while allowing no-cors fetches
            value: 'credentialless'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // Content Security Policy for enhanced security
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://vercel.com blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              // WebLLM requires access to Hugging Face for model downloads
              "connect-src 'self' data: blob: https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://vercel.live https://vercel.com https://huggingface.co https://*.huggingface.co https://raw.githubusercontent.com",
              // WebLLM uses Web Workers
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              `frame-ancestors 'self' ${devFrameAncestors} https://seifeldin-mahmoud.vercel.app https://*.saifmb.com https://saifmb.com`.trim().replace(/\s+/g, ' '),
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  },

  // Performance and security optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
