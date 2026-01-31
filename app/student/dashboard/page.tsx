'use client'

// student dashboard - view complaints and status
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { useSocketComplaints } from '@/hooks/use-socket-complaints'
import { api } from '@/lib/services/api'
import {
  categoryLabels,
  statusConfig,
  getTimeElapsed,
  mapApiComplaintToFrontend,
  type ApiComplaint
} from '@/lib/types'
import type { Complaint } from '@/lib/types'
import {
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  RefreshCw,
  Activity
} from 'lucide-react'
import { TimelineModal } from '@/components/modals/timeline-modal'

export default function StudentDashboard() {
  const { user, loading } = useAuth('student')
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null)
  const [history, setHistory] = useState<Complaint[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [timelineId, setTimelineId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get<ApiComplaint[]>('/complaints')
      const list = Array.isArray(data) ? data : []
      console.log('[Student Dashboard] getComplaints response:', data, 'array length:', list.length)
      const mapped = list.map((c) => mapApiComplaintToFrontend(c, user.email))
      const active = mapped.find((c) => ['pending', 'open', 'in_progress'].includes(c.status)) ?? null
      setActiveComplaint(active ?? null)
      setHistory(mapped.filter((c) => ['resolved', 'closed'].includes(c.status)))
    } catch (err) {
      console.log('[Student Dashboard] getComplaints error:', err)
      setActiveComplaint(null)
      setHistory([])
    }
  }, [user])

  useSocketComplaints(loadData)

  useEffect(() => {
    loadData()
  }, [loadData])

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
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary">Student Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              View and track your complaints
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {!activeComplaint && (
              <Link href="/student/new-complaint">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  New Complaint
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* active complaint warning */}
        {activeComplaint && (
          <Alert className="mb-6 border-primary/30 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              You have an active complaint in progress. You cannot file a new complaint until this one is resolved.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* current complaint */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Current Complaint
                </CardTitle>
                <CardDescription>
                  {activeComplaint
                    ? 'Your complaint is being tracked below'
                    : 'No active complaint at the moment'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeComplaint ? (
                  <div className="space-y-4">
                    {/* complaint details */}
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground break-all whitespace-normal">
                            {activeComplaint.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {categoryLabels[activeComplaint.category]}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={statusConfig[activeComplaint.status].color}
                        >
                          {statusConfig[activeComplaint.status].label}
                        </Badge>
                      </div>

                      <p className="mb-3 text-sm text-muted-foreground break-all whitespace-normal">
                        {activeComplaint.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Filed {getTimeElapsed(new Date(activeComplaint.createdAt)).text}
                        </span>
                        {activeComplaint.claimedByEmail && (
                          <span>
                            Assigned to: {activeComplaint.claimedByEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* status */}
                    <div className="flex items-center justify-between">
                      {activeComplaint.claimedByEmail ? (
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {activeComplaint.claimedByEmail}
                        </p>
                      ) : <div />}

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setTimelineId(activeComplaint.id)}
                      >
                        <Activity className="h-4 w-4 text-primary" />
                        Track Status
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="mb-4 text-muted-foreground">
                      You have no active complaints.
                    </p>
                    <Link href="/student/new-complaint">
                      <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                        File a New Complaint
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* sidebar - history */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Complaint History
                </CardTitle>
                <CardDescription>
                  Previously resolved complaints
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map(complaint => (
                      <div
                        key={complaint.id}
                        className="rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          // Optional: View timeline for history
                          window.dispatchEvent(new CustomEvent('open-timeline', { detail: complaint.id }))
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {complaint.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {categoryLabels[complaint.category]}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={statusConfig[complaint.status].color}
                          >
                            {statusConfig[complaint.status].label}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Resolved {complaint.resolvedAt
                            ? new Date(complaint.resolvedAt).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No resolved complaints yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <TimelineModal
          complaintId={timelineId}
          open={!!timelineId}
          onOpenChange={(open) => !open && setTimelineId(null)}
        />
      </main>
    </div>
  )
}
