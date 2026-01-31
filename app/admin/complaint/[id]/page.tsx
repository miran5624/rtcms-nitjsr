'use client'

// admin complaint detail with status updates
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { 
  getComplaintById, 
  getActivityLogs,
  updateComplaint,
  subscribe 
} from '@/lib/store'
import { 
  categoryLabels, 
  statusConfig, 
  getTimeElapsed 
} from '@/lib/types'
import type { Complaint, ActivityLog, ComplaintStatus } from '@/lib/types'
import { 
  ArrowLeft, 
  Clock, 
  User,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ComplaintDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading } = useAuth('admin')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [remarks, setRemarks] = useState('')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  
  // load complaint data
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
  
  const handleStatusUpdate = async (newStatus: ComplaintStatus) => {
    if (!user || !complaint) return
    
    // verify admin owns this complaint
    if (complaint.claimedBy !== user.id) {
      setError('You cannot modify a complaint that is not claimed by you.')
      return
    }
    
    setUpdating(true)
    setError('')
    
    // simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const updates: Partial<Complaint> = {
      status: newStatus
    }
    
    if (newStatus === 'resolved') {
      updates.resolvedAt = new Date()
    }
    
    updateComplaint(complaint.id, updates, user, remarks || undefined)
    setRemarks('')
    setUpdating(false)
    
    // if resolved, redirect back
    if (newStatus === 'resolved' || newStatus === 'closed') {
      setTimeout(() => {
        router.push('/admin/dashboard')
      }, 1000)
    }
  }
  
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
              Complaint not found or you do not have access to view it.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <Link href="/admin/dashboard">
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
  
  const isOwner = complaint.claimedBy === user?.id
  const canModify = isOwner && !['resolved', 'closed'].includes(complaint.status)
  
  return (
    <div className="min-h-screen bg-secondary">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* back button */}
        <Link href="/admin/dashboard" className="mb-6 inline-block">
          <Button variant="outline" className="gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* complaint details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{complaint.title}</CardTitle>
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
                </div>
                
                {/* description */}
                <div>
                  <h4 className="mb-2 font-medium text-foreground">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {complaint.description}
                  </p>
                </div>
                
                {/* timestamps */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Filed: {new Date(complaint.createdAt).toLocaleString()}
                  </div>
                  {complaint.claimedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Claimed: {new Date(complaint.claimedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                
                {/* ownership warning */}
                {!isOwner && complaint.claimedBy && (
                  <Alert className="border-primary/30 bg-primary/5">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary">
                      This complaint is claimed by {complaint.claimedByEmail}. 
                      You cannot modify it.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* status update section */}
                {canModify && (
                  <div className="space-y-4 border-t border-border pt-6">
                    <h4 className="font-medium text-foreground">Update Status</h4>
                    
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks (optional)</Label>
                      <Textarea
                        id="remarks"
                        placeholder="Add notes or remarks about this update..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {complaint.status === 'claimed' && (
                        <Button
                          onClick={() => handleStatusUpdate('in_progress')}
                          disabled={updating}
                          className="bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Mark In Progress
                        </Button>
                      )}
                      
                      {['claimed', 'in_progress'].includes(complaint.status) && (
                        <Button
                          onClick={() => handleStatusUpdate('resolved')}
                          disabled={updating}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Mark Resolved
                        </Button>
                      )}
                      
                      {['claimed', 'in_progress'].includes(complaint.status) && (
                        <Button
                          variant="outline"
                          onClick={() => handleStatusUpdate('escalated')}
                          disabled={updating}
                          className="border-destructive text-destructive hover:bg-destructive/10"
                        >
                          Escalate
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
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
                          by {log.performedByEmail}
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
