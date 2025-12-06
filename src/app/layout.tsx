import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Free AI Cover Letter Generator | Gemini AI Powered | No Login Required",
  description: "Create personalized, professional cover letters in seconds using Google Gemini AI. Paste your job description and resume, choose your tone, and get a tailored cover letter instantly. 100% free with no registration required.",
  keywords: "cover letter generator, AI cover letter, Gemini AI, free cover letter, job application, resume, career tools, CV generator",
  authors: [{ name: "AI Cover Letter Generator" }],
  openGraph: {
    title: "Free AI Cover Letter Generator",
    description: "Generate professional cover letters instantly with AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Cover Letter Generator",
    description: "Generate professional cover letters instantly with AI",
  },
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
