import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://vercel.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' data: https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://cdn.jsdelivr.net https://vercel.live https://vercel.com",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self' http://localhost:3000 https://seifeldin-mahmoud.vercel.app https://*.saifmb.com https://saifmb.com",
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
