'use client'

// institutional header for nit jamshedpur
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

interface HeaderProps {
  showAuthButtons?: boolean
}

export function Header({ showAuthButtons = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm">
      {/* main header with logo and title */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center">
          {/* logo - left aligned */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          
          {/* institute name - centered */}
          <div className="flex flex-1 flex-col items-center text-center">
            <h1 className="font-serif text-xl font-bold text-primary md:text-2xl">
              National Institute of Technology Jamshedpur
            </h1>
            <p className="text-sm text-muted-foreground">
              Smart Complaint Management System
            </p>
          </div>
          
          {/* spacer to balance layout */}
          <div className="hidden w-14 shrink-0 md:block" />
        </div>
      </div>
      
      {/* navigation bar */}
      <nav className="bg-primary">
        <div className="container mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm text-primary-foreground hover:text-primary-foreground/80"
            >
              Home
            </Link>
            <Link 
              href="/#faqs" 
              className="text-sm text-primary-foreground hover:text-primary-foreground/80"
            >
              FAQs
            </Link>
            <Link 
              href="/#contacts" 
              className="text-sm text-primary-foreground hover:text-primary-foreground/80"
            >
              Important Contacts
            </Link>
          </div>
          
          {showAuthButtons && (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-primary-foreground hover:text-primary-foreground/80"
              >
                Login
              </Link>
              <span className="text-primary-foreground/50">|</span>
              <Link
                href="/signup"
                className="text-sm font-medium text-primary-foreground hover:text-primary-foreground/80"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
