import React from "react"
import type { Metadata } from 'next'
import { Inter, Roboto_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const robotoSerif = Roboto_Serif({ subsets: ['latin'], variable: '--font-roboto-serif' })

export const metadata: Metadata = {
  title: 'NIT Jamshedpur - Smart Complaint Management System',
  description: 'Official complaint management portal for National Institute of Technology Jamshedpur students and staff',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoSerif.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {/* Polyfill for 'global' error */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if (typeof window !== 'undefined' && typeof global === 'undefined') { window.global = window; }`
          }}
        />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
