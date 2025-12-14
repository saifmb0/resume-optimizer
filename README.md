# 🚀 AI CV & Cover Letter Generator

[![GitHub stars](https://img.shields.io/github/stars/saifmb0/cvmaker.svg?style=social&label=Star)](https://github.com/saifmb0/cvmaker)
[![GitHub forks](https://img.shields.io/github/forks/saifmb0/cvmaker.svg?style=social&label=Fork)](https://github.com/saifmb0/cvmaker/fork)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A modern web application that generates personalized CVs, cover letters, and "why do you want to work here" statements using Google's Gemini AI. Paste a job description and your background, select your desired output type, and get professionally crafted content in seconds - completely free with no login required!

## ✨ Features

- **🤖 AI-Powered** - Google Gemini 2.5 Flash for intelligent content generation
- **📄 Multiple Output Types** - Generate CVs, Cover Letters, or "Why Work Here" statements  
- **⚡ Fast** - Professional content in under 30 seconds
- **🔒 Private** - No data storage, completely stateless
- **🌙 Dark Mode** - Beautiful dark/light theme toggle
- **📱 Responsive** - Works perfectly on all devices
- **📄 PDF Export** - Download generated content as PDF
- **♿ Accessible** - High contrast, keyboard navigation, screen reader friendly

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: Google Gemini 2.5 Flash API
- **PDF**: jsPDF

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Google Gemini API key ([get one free](https://makersuite.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/saifmb0/cvmaker.git
cd cvmaker

# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# GEMINI_API_KEY=your_gemini_api_key_here

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/generate-cover-letter/  # Gemini AI integration
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Main page
├── components/
│   ├── CoverLetterForm.tsx         # Input form
│   ├── CoverLetterResult.tsx       # Results display
│   └── DarkModeToggle.tsx          # Theme toggle
├── contexts/
│   └── DarkModeContext.tsx         # Theme state
└── utils/
    ├── rateLimit.ts                # Rate limiting
    ├── securityLogger.ts           # Security logging
    └── validation.ts               # Input validation
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | No |

## 🚀 Deployment

Deploy easily to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saifmb0/cvmaker)

Remember to add your `GEMINI_API_KEY` in the Vercel environment variables.

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source under the [MIT License](LICENSE).

## 🆘 Support

- Create an [Issue](../../issues) for bugs or feature requests
- Check the FAQ section in the app

---

**Made with ❤️ for job seekers worldwide**

*Powered by Google Gemini AI*


