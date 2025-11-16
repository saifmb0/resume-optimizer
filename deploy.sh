#!/bin/bash

# AI CV & Cover Letter Generator - Production Deployment Script
# This script helps prepare and deploy your application to production

echo "🚀 AI CV & Cover Letter Generator - Production Deployment"
echo "========================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if environment file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Creating from template..."
    cp .env.production.example .env.local
    echo "✅ Created .env.local from template"
    echo "📝 Please edit .env.local with your actual API keys before deployment"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running ESLint..."
if npm run lint; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed. Please fix errors before deployment."
    exit 1
fi

# Run build test
echo "🏗️  Testing production build..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix errors before deployment."
    exit 1
fi

# Check for required environment variables
echo "🔧 Checking environment configuration..."
if [ -z "$GEMINI_API_KEY" ] && ! grep -q "GEMINI_API_KEY=" .env.local; then
    echo "⚠️  Warning: GEMINI_API_KEY not set. This is required for production."
fi

if [ -z "$NEXT_PUBLIC_GA_ID" ] && ! grep -q "NEXT_PUBLIC_GA_ID=" .env.local; then
    echo "💡 Optional: NEXT_PUBLIC_GA_ID not set. Add for Google Analytics tracking."
fi

echo ""
echo "✅ Production readiness check complete!"
echo ""
echo "🌐 Deployment Options:"
echo "1. Vercel: https://vercel.com (Recommended)"
echo "2. Railway: https://railway.app"
echo "3. Netlify: https://netlify.com"
echo ""
echo "📚 See DEPLOYMENT.md for detailed deployment instructions"
echo "📋 See PRODUCTION_CHECKLIST.md for complete checklist"
echo ""
echo "🎉 Your app is ready for production deployment!"
