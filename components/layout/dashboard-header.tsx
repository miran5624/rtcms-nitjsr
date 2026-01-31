'use client'

// dashboard header with user info and logout
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User as UserType } from '@/lib/types'

interface DashboardHeaderProps {
  user: UserType | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    // clear session storage
    sessionStorage.removeItem('user')
    router.push('/login')
  }

  const handleLogoClick = () => {
    if (user?.role === 'student') router.push('/student/dashboard')
    else if (user?.role === 'admin') router.push('/admin/dashboard')
    else if (user?.role === 'super_admin') router.push('/super-admin/dashboard')
    else router.push('/')
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return 'Student'
      case 'admin': return 'Admin'
      case 'super_admin': return 'Super Admin'
      default: return role
    }
  }

  return (
    <header className="w-full border-b border-border bg-background">
      {/* main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* logo */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center cursor-pointer"
              onClick={handleLogoClick}
            >
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>

            {/* title */}
            <div className="flex flex-col">
              <h1 className="font-serif text-lg font-bold text-primary md:text-xl">
                NIT Jamshedpur
              </h1>
              <p className="text-xs text-muted-foreground">
                Complaint Management System
              </p>
            </div>

            {/* additional logos */}
            <div className="flex items-center gap-2">
              <img src="/logo2.png" alt="Logo 2" className="h-10 w-auto object-contain" />
              <img src="/logo3.png" alt="Logo 3" className="h-10 w-auto object-contain" />
            </div>
          </div>

          {/* user info */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 text-sm md:flex">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user.email}</span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* nav bar */}
      <nav className="bg-primary">
        <div className="container mx-auto flex items-center gap-6 px-4 py-2">
          {user?.role === 'student' && (
            <>
              <Link href="/student/dashboard" className="text-sm text-primary-foreground hover:text-primary-foreground/80">
                Dashboard
              </Link>
              <Link href="/student/new-complaint" className="text-sm text-primary-foreground hover:text-primary-foreground/80">
                New Complaint
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link href="/admin/dashboard" className="text-sm text-primary-foreground hover:text-primary-foreground/80">
                Dashboard
              </Link>
              <Link href="/admin/my-claims" className="text-sm text-primary-foreground hover:text-primary-foreground/80">
                My Claims
              </Link>
            </>
          )}

          {user?.role === 'super_admin' && (
            <>
              <Link href="/super-admin/dashboard" className="text-sm text-primary-foreground hover:text-primary-foreground/80">
                Dashboard
              </Link>
              <Link href="/super-admin/analytics" className="text-sm text-primary-foreground hover:text-primary-foreground/80">
                Analytics
              </Link>
              <Link href="/super-admin/escalations" className="text-sm text-primary-foreground hover:text-primary-foreground/80">
                Escalations
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
