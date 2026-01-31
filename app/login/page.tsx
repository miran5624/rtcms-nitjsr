'use client'

import React from "react"

// login page with role-based routing
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { isValidNITJSREmail, getRedirectPath } from '@/lib/auth'
import { api } from '@/lib/services/api'

function parseJwtPayload(token: string): { userId?: number; sub?: string; email?: string; role?: string } {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return {}
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return {}
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isValidNITJSREmail(email)) {
      setError('Please use your NIT Jamshedpur email address (@nitjsr.ac.in)')
      setLoading(false)
      return
    }

    try {
      const { data } = await api.post<{ token: string }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })

      const token = data.token
      const payload = parseJwtPayload(token)
      const role = payload.role || 'student'
      const user = {
        id: String(payload.userId ?? payload.sub ?? ''),
        email: payload.email ?? email.toLowerCase(),
        name: email.split('@')[0],
        role,
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      const redirectPath = getRedirectPath(role as 'student' | 'admin' | 'super_admin')
      router.push(redirectPath)
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string }; status?: number } }).response
        : null
      const msg = res?.data?.error ?? (res?.status === 403 ? 'Domain not allowed' : 'Invalid credentials. Please try again.')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-secondary">
      <Header showAuthButtons={false} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* left side - welcome content */}
          <div className="flex-1 rounded-lg bg-muted p-8">
            <h2 className="mb-4 font-serif text-2xl font-bold text-primary">
              Welcome to the Complaint Management Portal
            </h2>
            <p className="mb-6 text-muted-foreground">
              This portal allows students, faculty, and staff to raise and track 
              complaints related to hostel facilities, mess services, academic issues, 
              and campus infrastructure.
            </p>
            
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p>Students can raise new complaints and track their status in real-time</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p>Administrators can claim and resolve complaints efficiently</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p>Super Admins have complete oversight with analytics and escalation tracking</p>
              </div>
            </div>
            
            {/* insert welcome text, carousel, or university announcements here */}
          </div>
          
          {/* right side - login card */}
          <div className="w-full lg:w-[400px]">
            <Card className="border-t-4 border-t-primary shadow-md">
              <CardHeader className="space-y-1">
                <CardTitle className="font-serif text-xl text-primary">Sign In</CardTitle>
                <CardDescription>
                  Use your NIT Jamshedpur email to access the portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="yourname@nitjsr.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  <p>Use your institute email to determine access level</p>
                  <p className="mt-1">Students: 202XXXXXXXX@nitjsr.ac.in</p>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {"Don't have an account? "}
                    <Link 
                      href="/signup" 
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
