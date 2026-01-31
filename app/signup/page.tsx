'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Mail, AlertCircle, Loader2, User, CheckCircle2 } from 'lucide-react'
import { determineRole, isValidNITJSREmail, getRedirectPath } from '@/lib/auth'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // validate name
    if (name.trim().length < 2) {
      setError('Please enter your full name')
      setLoading(false)
      return
    }
    
    // validate email domain
    if (!isValidNITJSREmail(email)) {
      setError('Please use your NIT Jamshedpur email address (@nitjsr.ac.in)')
      setLoading(false)
      return
    }
    
    // determine role based on email
    const role = determineRole(email)
    if (!role) {
      setError('Invalid email format. Please use your institute email.')
      setLoading(false)
      return
    }
    
    // validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }
    
    // check password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }
    
    // simulate registration delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // create user session (in real app, this would call backend API)
    const user = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      name: name.trim(),
      role,
      createdAt: new Date().toISOString()
    }
    
    // store in session
    sessionStorage.setItem('user', JSON.stringify(user))
    
    // show success message briefly
    setSuccess(true)
    
    // redirect based on role after short delay
    setTimeout(() => {
      const redirectPath = getRedirectPath(role)
      router.push(redirectPath)
    }, 1500)
  }
  
  // password strength indicator
  const getPasswordStrength = () => {
    if (password.length === 0) return null
    if (password.length < 6) return { label: 'Weak', color: 'bg-destructive' }
    if (password.length < 8) return { label: 'Fair', color: 'bg-warning' }
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { label: 'Strong', color: 'bg-success' }
    }
    return { label: 'Good', color: 'bg-chart-2' }
  }
  
  const passwordStrength = getPasswordStrength()
  
  if (success) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header showAuthButtons={false} />
        <main className="container mx-auto flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md border-t-4 border-t-success shadow-md">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Registration Successful
              </h2>
              <p className="text-center text-muted-foreground">
                Welcome to the NIT Jamshedpur Complaint Portal. Redirecting to your dashboard...
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-secondary">
      <Header showAuthButtons={false} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* left side - information content */}
          <div className="flex-1 rounded-lg bg-muted p-8">
            <h2 className="mb-4 font-serif text-2xl font-bold text-primary">
              Create Your Account
            </h2>
            <p className="mb-6 text-muted-foreground">
              Register with your NIT Jamshedpur email to access the complaint management 
              portal. Your role will be automatically determined based on your email address.
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-semibold text-foreground">Email Format Guide</h3>
                <div className="space-y-3 text-sm">
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="font-medium text-primary">Students</p>
                    <p className="text-muted-foreground">202XXXXXXXX@nitjsr.ac.in</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Example: 2024ugcs001@nitjsr.ac.in
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-background p-3">
                    <p className="font-medium text-primary">Faculty/Staff</p>
                    <p className="text-muted-foreground">name.warden@nitjsr.ac.in</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Wardens, supervisors, and faculty members
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="mb-3 font-semibold text-foreground">Password Requirements</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Minimum 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Include uppercase letters for stronger security
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Include numbers for better protection
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* right side - sign up form */}
          <div className="w-full lg:w-[420px]">
            <Card className="border-t-4 border-t-primary shadow-md">
              <CardHeader className="space-y-1">
                <CardTitle className="font-serif text-xl text-primary">Sign Up</CardTitle>
                <CardDescription>
                  Create your account to get started
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
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
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
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    {passwordStrength && (
                      <div className="flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={`h-full transition-all ${passwordStrength.color}`}
                            style={{ 
                              width: passwordStrength.label === 'Weak' ? '25%' : 
                                     passwordStrength.label === 'Fair' ? '50%' :
                                     passwordStrength.label === 'Good' ? '75%' : '100%'
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {passwordStrength.label}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link 
                      href="/login" 
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Sign in
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
