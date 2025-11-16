# AI CV & Cover Letter Generator - Production Deployment Script (PowerShell)
# This script helps prepare and deploy your application to production

Write-Host "🚀 AI CV & Cover Letter Generator - Production Deployment" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if environment file exists
if (!(Test-Path ".env.local")) {
    Write-Host "⚠️  Warning: .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.production.example" ".env.local"
    Write-Host "✅ Created .env.local from template" -ForegroundColor Green
    Write-Host "📝 Please edit .env.local with your actual API keys before deployment" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Run linting
Write-Host "🔍 Running ESLint..." -ForegroundColor Blue
$lintResult = npm run lint
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Linting passed" -ForegroundColor Green
} else {
    Write-Host "❌ Linting failed. Please fix errors before deployment." -ForegroundColor Red
    exit 1
}

# Run build test
Write-Host "🏗️  Testing production build..." -ForegroundColor Blue
$buildResult = npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix errors before deployment." -ForegroundColor Red
    exit 1
}

# Check for required environment variables
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Blue
$envContent = Get-Content ".env.local" -ErrorAction SilentlyContinue
if (!$envContent -or !($envContent -match "GEMINI_API_KEY=")) {
    Write-Host "⚠️  Warning: GEMINI_API_KEY not set. This is required for production." -ForegroundColor Yellow
}

if (!$envContent -or !($envContent -match "NEXT_PUBLIC_GA_ID=")) {
    Write-Host "💡 Optional: NEXT_PUBLIC_GA_ID not set. Add for Google Analytics tracking." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Production readiness check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Deployment Options:" -ForegroundColor Cyan
Write-Host "1. Vercel: https://vercel.com (Recommended)"
Write-Host "2. Railway: https://railway.app"
Write-Host "3. Netlify: https://netlify.com"
Write-Host ""
Write-Host "📚 See DEPLOYMENT.md for detailed deployment instructions"
Write-Host "📋 See PRODUCTION_CHECKLIST.md for complete checklist"
Write-Host ""
Write-Host "🎉 Your app is ready for production deployment!" -ForegroundColor Green
