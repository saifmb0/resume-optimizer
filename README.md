# 🚀 AI CV & Cover Letter Generator

[![GitHub stars](https://img.shields.io/github/stars/saifmb0/cvmaker.svg?style=social&label=Star)](https://github.com/saifmb0/cvmaker)
[![GitHub forks](https://img.shields.io/github/forks/saifmb0/cvmaker.svg?style=social&label=Fork)](https://github.com/saifmb0/cvmaker/fork)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://your-deployed-url.com)

A modern, production-ready web application that generates personalized CVs, cover letters, and "why do you want to work here" statements using Google's Gemini AI. Users can paste a job description and their background, select their desired output type, and get professionally crafted content in seconds - completely free with no login required!

> **⭐ If this project helps you, please consider giving it a star!** ⭐

## ✨ Key Features

- **🤖 AI-Powered**: Uses Google Gemini 2.5 Flash for intelligent, personalized content generation
- **📄 Multiple Output Types**: Generate CVs, Cover Letters, or "Why Work Here" statements  
- **⚡ Lightning Fast**: Generate professional content in under 30 seconds
- **🔒 100% Private**: No data storage, completely stateless processing
- **🌙 Dark Mode**: Beautiful dark/light theme toggle with smooth transitions and persistent preferences
- **📱 Mobile-Friendly**: Fully responsive design that works perfectly on all devices
- **💰 AdSense Ready**: Integrated Google AdSense with full dark mode support
- **📄 PDF Export**: Download generated content as PDF using jsPDF
- **📊 Analytics**: Google Analytics integration for comprehensive traffic tracking
- **🎨 Modern UI**: Clean, professional design with Tailwind CSS and high text contrast
- **🎭 Interactive Backgrounds**: Animated floating shapes, gradients, and ripple effects
- **♿ Accessible**: High contrast text, keyboard navigation, and screen reader friendly

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS v4, Custom CSS, Heroicons
- **AI**: Google Gemini 2.5 Flash API
- **PDF Export**: jsPDF with custom formatting
- **Analytics**: Google Analytics (gtag.js)
- **State Management**: React Context API for dark mode
- **Deployment**: Vercel (recommended)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/saifmb0/cvmaker.git
   cd cvmaker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate-cover-letter/
│   │       └── route.ts          # Gemini AI integration & prompt logic
│   ├── favicon.ico
│   ├── globals.css               # Dark mode, text contrast, animations
│   ├── layout.tsx                # SEO metadata, Analytics & global layout
│   └── page.tsx                  # Main application with FAQ & features
├── components/
│   ├── AdSense.tsx               # Google AdSense with dark mode support
│   ├── CoverLetterForm.tsx       # Input form with validation
│   ├── CoverLetterResult.tsx     # Results display with formatting
│   └── DarkModeToggle.tsx        # Dark/light mode toggle button
└── contexts/
    └── DarkModeContext.tsx       # Dark mode state management & persistence
```

## 🎯 Core Functionality

### 1. Output Types
- **CV**: Complete curriculum vitae with sections (About, Education, Experience, Projects, Contact)
- **Cover Letter**: Traditional cover letter format
- **Why Work Here**: Brief explanation of interest in the position

### 2. Input Form
- **Job Description**: Textarea for pasting job requirements
- **Resume/Background**: Textarea for user's experience and skills
- **Output Type**: Dropdown selection for desired content type

### 3. AI Processing
- Validates and sanitizes user input
- Creates optimized prompts for Gemini AI
- Handles API responses and error states
- Ensures AI doesn't hallucinate non-existent experience

### 4. Results Display
- Professionally formatted output with proper styling
- Dark mode compatible text and backgrounds
- Copy to clipboard functionality
- PDF download feature with proper formatting
- Regenerate option for different variations

### 5. Dark Mode & UI
- **System Preference Detection**: Automatically detects user's OS theme preference
- **Smooth Transitions**: Beautiful CSS transitions between light and dark themes
- **Persistent Storage**: Remembers user's theme choice across sessions
- **Enhanced Contrast**: High contrast text in both modes for better accessibility
- **Interactive Backgrounds**: Animated floating shapes and gradient effects
- **Ripple Effects**: Smooth button interactions and hover states

## 🔧 API Routes

### POST `/api/generate-cover-letter`

**Request Body:**
```json
{
  "jobDescription": "string",
  "resume": "string", 
  "tone": "CV" | "CoverLetter" | "Wdywtwh"
}
```

**Response:**
```json
{
  "coverLetter": "Generated content text..."
}
```

**Error Responses:**
```json
{
  "error": "Error message"
}
```

## 💰 Monetization & Marketing

The app includes comprehensive monetization features:

### Google AdSense Integration
- **Responsive Design**: Auto-sizing ad units optimized for mobile and desktop
- **Dark Mode Compatible**: AdSense placeholders seamlessly adapt to theme changes
- **Strategic Placement**: Top banner, bottom banner, and sidebar positions
- **Non-Intrusive**: Ads enhance rather than interfere with user experience
- **Revenue Optimized**: Placed in high-engagement areas for maximum CTR

### SEO & Growth Features
- **Keyword Optimized**: Targeted for "CV generator", "cover letter", "job application" searches
- **Social Sharing**: Open Graph meta tags for enhanced social media sharing
- **Fast Loading**: Optimized for Core Web Vitals and search engine ranking
- **Mobile-First**: Responsive design prioritizes mobile user experience

## 📊 Analytics & SEO

### Google Analytics
- Page view tracking
- User engagement metrics
- Traffic source analysis
- Real-time visitor data

### SEO Optimization
- Optimized meta tags for CV and cover letter keywords
- Open Graph social media sharing
- Mobile-first responsive design
- Fast loading performance

## 🔒 Security & Privacy

- **Zero Data Storage**: All processing is completely stateless - no user data retained
- **Input Validation & Sanitization**: Comprehensive Zod validation and XSS protection 
- **Rate Limiting**: Built-in protection against API abuse and spam (10 requests/minute)
- **Prompt Injection Protection**: Advanced detection and prevention of AI prompt manipulation
- **Security Headers**: CSP, XSS protection, and frame options for browser-level security
- **HTTPS Enforced**: Secure data transmission required for all communications
- **Privacy Compliant**: GDPR and CCPA compliant with no personal data retention
- **API Security**: Environment variables and API keys properly protected server-side
- **Content Filtering**: AI prompts designed to prevent harmful or inappropriate content
- **Error Handling**: Secure error responses that don't expose internal system details

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit
```

## 🤝 Contributing

We welcome contributions from the community! This project helps job seekers worldwide, and your contributions can make a real difference.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** (add features, fix bugs, improve documentation)
4. **Test thoroughly** in both light and dark modes
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Contribution Ideas

- 🌍 **Multi-language support** (Spanish, French, German, etc.)
- 🎨 **New CV/cover letter templates**
- 🏭 **Industry-specific prompts** (tech, healthcare, finance, etc.)
- 📱 **Mobile app development**
- 🔧 **Performance optimizations**
- 📚 **Documentation improvements**
- 🐛 **Bug fixes and testing**

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/cvmaker.git
cd cvmaker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting (Prettier/ESLint)
- Add proper TypeScript types
- Test in both light and dark modes
- Ensure mobile responsiveness

**All contributors will be acknowledged in our README! 🎉**

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For issues and questions:
- Create an [Issue](../../issues)
- Check the FAQ section in the app
- Review the [DEPLOYMENT.md](DEPLOYMENT.md) guide

## 🔮 Future Enhancements

- [ ] **Multi-language Support**: Expand to Spanish, French, German, and other languages
- [ ] **LinkedIn Integration**: Import profile data directly from LinkedIn
- [ ] **Advanced Templates**: Multiple CV and cover letter design templates
- [ ] **Industry Customization**: Specialized prompts for different industries
- [ ] **Bulk Generation**: Generate multiple variations for A/B testing
- [ ] **Enhanced PDF Styling**: Professional formatting with custom fonts and layouts
- [ ] **Real-time Collaboration**: Share and edit documents with others
- [ ] **Mobile App**: Native iOS and Android applications

---

**Made with ❤️ for job seekers worldwide**

*Powered by Google Gemini AI • Dark Mode Ready • 100% Free • Production Ready*


