'use client'

// super admin escalations page - complaints older than 24 hours
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { 
  getEscalatedComplaints,
  subscribe,
  seedDemoData 
} from '@/lib/store'
import { 
  categoryLabels, 
  statusConfig, 
  getTimeElapsed 
} from '@/lib/types'
import type { Complaint } from '@/lib/types'
import { 
  ArrowLeft,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
  CheckCircle
} from 'lucide-react'

export default function EscalationsPage() {
  const { user, loading } = useAuth('super_admin')
  const [escalated, setEscalated] = useState<Complaint[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  const loadData = () => {
    seedDemoData()
    setEscalated(getEscalatedComplaints())
  }
  
  useEffect(() => {
    loadData()
    
    const unsubscribe = subscribe(() => {
      loadData()
    })
    
    return () => unsubscribe()
  }, [])
  
  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
    setTimeout(() => setRefreshing(false), 500)
  }
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-secondary">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/super-admin/dashboard">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary">Escalated Complaints</h2>
              <p className="text-sm text-muted-foreground">
                Complaints pending for more than 24 hours
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* warning banner */}
        {escalated.length > 0 && (
          <Alert className="mb-6 border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>{escalated.length} complaint{escalated.length !== 1 ? 's' : ''}</strong> {escalated.length !== 1 ? 'have' : 'has'} been 
              pending for more than 24 hours and require{escalated.length === 1 ? 's' : ''} immediate attention.
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Time-Based Escalations
            </CardTitle>
            <CardDescription>
              These complaints have exceeded the 24-hour threshold
            </CardDescription>
          </CardHeader>
          <CardContent>
            {escalated.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 pr-4">ID</th>
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 pr-4">Category</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Student</th>
                      <th className="pb-3 pr-4">Assigned To</th>
                      <th className="pb-3 pr-4">Time Pending</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escalated.map(complaint => (
                      <tr 
                        key={complaint.id} 
                        className="border-b border-destructive/20 bg-destructive/5 last:border-0"
                      >
                        <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">
                          {complaint.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <p className="font-medium text-foreground">{complaint.title}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm">
                          {categoryLabels[complaint.category]}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge 
                            variant="outline" 
                            className={statusConfig[complaint.status].color}
                          >
                            {statusConfig[complaint.status].label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">
                          {complaint.studentEmail}
                        </td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">
                          {complaint.claimedByEmail || (
                            <span className="text-destructive">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1 font-medium text-destructive">
                            <Clock className="h-4 w-4" />
                            {getTimeElapsed(new Date(complaint.createdAt)).text}
                          </div>
                        </td>
                        <td className="py-3">
                          <Link href={`/super-admin/complaint/${complaint.id}`}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-1 border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  No Escalated Complaints
                </h3>
                <p className="text-muted-foreground">
                  All complaints are being addressed within the 24-hour window.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* info card */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-primary" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Escalation Policy</p>
                <p className="mt-1">
                  Complaints are automatically flagged as escalated when they remain unresolved 
                  for more than 24 hours. This helps ensure timely resolution and accountability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
