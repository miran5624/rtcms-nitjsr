'use client'

// super admin complaint detail view - read only
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { 
  getComplaintById, 
  getActivityLogs,
  subscribe 
} from '@/lib/store'
import { 
  categoryLabels, 
  statusConfig, 
  getTimeElapsed,
  getUrgencyLevel 
} from '@/lib/types'
import type { Complaint, ActivityLog } from '@/lib/types'
import { 
  ArrowLeft, 
  Clock, 
  User,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SuperAdminComplaintPage({ params }: PageProps) {
  const { id } = use(params)
  const { user, loading } = useAuth('super_admin')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  
  const loadData = () => {
    const data = getComplaintById(id)
    setComplaint(data)
    
    if (data) {
      setActivityLogs(getActivityLogs(data.id))
    }
  }
  
  useEffect(() => {
    loadData()
    
    const unsubscribe = subscribe(() => {
      loadData()
    })
    
    return () => unsubscribe()
  }, [id])
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!complaint) {
    return (
      <div className="min-h-screen bg-secondary">
        <DashboardHeader user={user} />
        
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Complaint not found.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <Link href="/super-admin/dashboard">
              <Button variant="outline" className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }
  
  const urgency = getUrgencyLevel(new Date(complaint.createdAt))
  
  return (
    <div className="min-h-screen bg-secondary">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* back button */}
        <Link href="/super-admin/dashboard" className="mb-6 inline-block">
          <Button variant="outline" className="gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        {/* urgency warning */}
        {urgency === 'critical' && (
          <Alert className="mb-6 border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              This complaint has been pending for more than 24 hours and is flagged as escalated.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* complaint details */}
          <div className="lg:col-span-2">
            <Card className={urgency === 'critical' ? 'border-destructive/50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{complaint.title}</CardTitle>
                      {urgency === 'critical' && (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <CardDescription>
                      {categoryLabels[complaint.category]} • ID: {complaint.id.slice(0, 8)}...
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={statusConfig[complaint.status].color}
                  >
                    {statusConfig[complaint.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* student info */}
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <User className="h-4 w-4" />
                    Student Information
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Email: {complaint.studentEmail}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Name: {complaint.studentName}
                  </p>
                </div>
                
                {/* assigned admin */}
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <User className="h-4 w-4" />
                    Assigned Admin
                  </div>
                  {complaint.claimedByEmail ? (
                    <p className="text-sm text-muted-foreground">
                      {complaint.claimedByEmail}
                    </p>
                  ) : (
                    <p className="text-sm text-destructive">
                      Not yet assigned
                    </p>
                  )}
                </div>
                
                {/* description */}
                <div>
                  <h4 className="mb-2 font-medium text-foreground">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {complaint.description}
                  </p>
                </div>
                
                {/* timestamps */}
                <div className="rounded-lg border border-border p-4">
                  <h4 className="mb-3 font-medium text-foreground">Timeline</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Created:</span>
                      <span>{new Date(complaint.createdAt).toLocaleString()}</span>
                    </div>
                    {complaint.claimedAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Claimed:</span>
                        <span>{new Date(complaint.claimedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {complaint.resolvedAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Resolved:</span>
                        <span>{new Date(complaint.resolvedAt).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Age:</span>
                      <span className={urgency === 'critical' ? 'font-medium text-destructive' : ''}>
                        {getTimeElapsed(new Date(complaint.createdAt)).text}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* resolved message */}
                {['resolved', 'closed'].includes(complaint.status) && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span>This complaint has been {complaint.status}.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* activity timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Timeline</CardTitle>
                <CardDescription>
                  Complete history of this complaint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.map((log, index) => (
                    <div 
                      key={log.id} 
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${
                          index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`} />
                        {index < activityLogs.length - 1 && (
                          <div className="h-full w-px bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-foreground">
                          {log.action}
                        </p>
                        {log.remarks && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            "{log.remarks}"
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {log.performedByEmail} ({log.performedByRole})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
