'use client'

import React from "react"

// new complaint form for students
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { getActiveComplaint, createComplaint } from '@/lib/store'
import { categoryLabels } from '@/lib/types'
import type { ComplaintCategory } from '@/lib/types'
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader2,
  Building2,
  UtensilsCrossed,
  GraduationCap,
  Wifi,
  Wrench,
  HelpCircle,
  CheckCircle
} from 'lucide-react'

const categoryIcons: Record<ComplaintCategory, React.ReactNode> = {
  hostel: <Building2 className="h-5 w-5" />,
  mess: <UtensilsCrossed className="h-5 w-5" />,
  academic: <GraduationCap className="h-5 w-5" />,
  internet: <Wifi className="h-5 w-5" />,
  infrastructure: <Wrench className="h-5 w-5" />,
  others: <HelpCircle className="h-5 w-5" />
}

export default function NewComplaintPage() {
  const router = useRouter()
  const { user, loading } = useAuth('student')
  const [hasActive, setHasActive] = useState(false)
  const [category, setCategory] = useState<ComplaintCategory | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // check for existing active complaint
  useEffect(() => {
    if (user) {
      const active = getActiveComplaint(user.id)
      if (active) {
        setHasActive(true)
      }
    }
  }, [user])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!category) {
      setError('Please select a category')
      return
    }
    
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    
    if (!description.trim()) {
      setError('Please provide a description')
      return
    }
    
    if (!user) return
    
    setSubmitting(true)
    
    // simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    try {
      createComplaint({
        studentId: user.id,
        studentEmail: user.email,
        studentName: user.name,
        category,
        title: title.trim(),
        description: description.trim(),
        status: 'pending',
        claimedBy: null,
        claimedByEmail: null,
        claimedAt: null,
        resolvedAt: null
      })
      
      setSuccess(true)
      
      // redirect after short delay
      setTimeout(() => {
        router.push('/student/dashboard')
      }, 1500)
    } catch {
      setError('Failed to submit complaint. Please try again.')
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  // block if already has active complaint
  if (hasActive) {
    return (
      <div className="min-h-screen bg-secondary">
        <DashboardHeader user={user} />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>Complaint In Progress</strong>
                <br />
                You already have an active complaint. Please wait for it to be resolved 
                before filing a new one.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <Link href="/student/dashboard">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  // success state
  if (success) {
    return (
      <div className="min-h-screen bg-secondary">
        <DashboardHeader user={user} />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <Card className="border-t-4 border-t-green-500">
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Complaint Submitted Successfully
                </h3>
                <p className="text-muted-foreground">
                  Your complaint has been filed and is now pending review.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-secondary">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* back button */}
          <Link href="/student/dashboard" className="mb-6 inline-block">
            <Button variant="outline" className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          
          <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-primary">
                File a New Complaint
              </CardTitle>
              <CardDescription>
                Please provide details about your complaint. An admin will review and 
                address it as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {/* category selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Select Category <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(Object.keys(categoryLabels) as ComplaintCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors ${
                          category === cat
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        {categoryIcons[cat]}
                        <span className="text-xs font-medium">
                          {categoryLabels[cat]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of your complaint"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/100 characters
                  </p>
                </div>
                
                {/* description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your complaint..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/1000 characters
                  </p>
                </div>
                
                {/* submit */}
                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Complaint'
                    )}
                  </Button>
                  
                  <Link href="/student/dashboard">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
