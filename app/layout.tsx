import React from "react"
import type { Metadata } from 'next'
import { Inter, Roboto_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const robotoSerif = Roboto_Serif({ subsets: ['latin'], variable: '--font-roboto-serif' })

export const metadata: Metadata = {
  title: "NIT Jamshedpur - RTCMS",
  description: "Campus Complaint Management System",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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
