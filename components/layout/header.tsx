'use client'

// institutional header for nit jamshedpur
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap } from 'lucide-react'

interface HeaderProps {
  showAuthButtons?: boolean
}

export function Header({ showAuthButtons = true }: HeaderProps) {
  const router = useRouter()

  const handleLogoClick = () => {
    const userStr = sessionStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role === 'student') router.push('/student/dashboard')
        else if (user.role === 'admin') router.push('/admin/dashboard')
        else if (user.role === 'super_admin') router.push('/super-admin/dashboard')
        else router.push('/')
      } catch (e) {
        router.push('/')
      }
    } else {
      router.push('/')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm">
      {/* main header with logo and title */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center">
          {/* logo - left aligned */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center cursor-pointer"
            onClick={handleLogoClick}
          >
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
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
          {/* additional logos - right aligned */}
          <div className="hidden shrink-0 items-center justify-end gap-2 md:flex">
            <img src="/logo2.png" alt="Logo 2" className="h-12 w-auto object-contain" />
            <img src="/logo3.png" alt="Logo 3" className="h-12 w-auto object-contain" />
          </div>
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
