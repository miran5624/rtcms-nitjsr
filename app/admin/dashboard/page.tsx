'use client'

// admin dashboard - view and claim complaints
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useSocketComplaints } from '@/hooks/use-socket-complaints'
import { api } from '@/lib/services/api'
import {
  categoryLabels,
  statusConfig,
  getTimeElapsed,
  getUrgencyLevel,
  mapApiComplaintToFrontend,
  type ApiComplaint
} from '@/lib/types'
import type { Complaint } from '@/lib/types'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  Loader2,
  Lock
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading } = useAuth('admin')
  const [unclaimed, setUnclaimed] = useState<Complaint[]>([])
  const [myClaims, setMyClaims] = useState<Complaint[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get<ApiComplaint[]>('/complaints')
      const list = Array.isArray(data) ? data : []
      const mapped = list.map((c) => mapApiComplaintToFrontend(c))
      setUnclaimed(mapped.filter((c) => (c.status === 'pending' || c.status === 'open') && !c.claimedBy))
      setMyClaims(mapped.filter((c) => c.claimedBy === user.id))
    } catch {
      setUnclaimed([])
      setMyClaims([])
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

  const handleClaim = async (complaintId: string) => {
    if (!user) return
    if (myClaims.length > 0) {
      alert('You already have a claimed complaint. Please resolve it first.')
      return
    }
    setClaiming(complaintId)
    try {
      await api.patch(`/complaints/${complaintId}/claim`)
      await loadData()
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string }; status?: number } }).response
        : null
      alert(res?.data?.error ?? 'Failed to claim complaint')
    } finally {
      setClaiming(null)
    }
  }

  const getUrgencyStyles = (createdAt: Date) => {
    const level = getUrgencyLevel(createdAt)
    switch (level) {
      case 'critical':
        return 'border-l-4 border-l-destructive bg-destructive/5'
      case 'warning':
        return 'border-l-4 border-l-warning bg-warning/5'
      default:
        return 'border-l-4 border-l-transparent'
    }
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
            <h2 className="font-serif text-2xl font-bold text-primary">Admin Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Manage and resolve student complaints
            </p>
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

        {/* stats cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{unclaimed.length}</p>
                <p className="text-sm text-muted-foreground">Unclaimed Complaints</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{myClaims.length}</p>
                <p className="text-sm text-muted-foreground">My Claims</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {unclaimed.filter(c => getUrgencyLevel(new Date(c.createdAt)) !== 'normal').length}
                </p>
                <p className="text-sm text-muted-foreground">Urgent Cases</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* unclaimed complaints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Unclaimed Complaints
              </CardTitle>
              <CardDescription>
                Available complaints waiting to be claimed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unclaimed.length > 0 ? (
                <div className="space-y-3">
                  {unclaimed.map(complaint => {
                    const elapsed = getTimeElapsed(new Date(complaint.createdAt))
                    const urgency = getUrgencyLevel(new Date(complaint.createdAt))

                    return (
                      <div
                        key={complaint.id}
                        className={`rounded-lg border border-border p-4 ${getUrgencyStyles(new Date(complaint.createdAt))}`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">
                                {complaint.title}
                              </h4>
                              {urgency === 'critical' && (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              )}
                              {urgency === 'warning' && (
                                <Clock className="h-4 w-4 text-warning" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {categoryLabels[complaint.category]} • {complaint.studentEmail || `Student #${complaint.studentId}`}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={urgency === 'critical'
                              ? 'border-destructive bg-destructive/10 text-destructive'
                              : urgency === 'warning'
                                ? 'border-warning bg-warning/10 text-warning'
                                : 'border-muted-foreground'
                            }
                          >
                            {elapsed.text}
                          </Badge>
                        </div>

                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                          {complaint.description}
                        </p>

                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleClaim(complaint.id)}
                          disabled={claiming === complaint.id || myClaims.length > 0}
                        >
                          {claiming === complaint.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Claiming...
                            </>
                          ) : myClaims.length > 0 ? (
                            'Resolve current claim first'
                          ) : (
                            'Claim This Complaint'
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p className="text-muted-foreground">
                    No unclaimed complaints at the moment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* my claims */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-primary" />
                My Claimed Complaints
              </CardTitle>
              <CardDescription>
                Complaints you have claimed and are working on
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myClaims.length > 0 ? (
                <div className="space-y-3">
                  {myClaims.map(complaint => (
                    <Link
                      key={complaint.id}
                      href={`/admin/complaint/${complaint.id}`}
                    >
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {complaint.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
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

                        <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                          {complaint.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Claimed {complaint.claimedAt
                              ? getTimeElapsed(new Date(complaint.claimedAt)).text
                              : 'N/A'
                            }
                          </p>
                          <span className="text-xs font-medium text-primary">
                            Locked by You
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    You have not claimed any complaints yet.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Claim a complaint from the list to start working on it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* time-based urgency legend */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-l-4 border-l-transparent bg-muted" />
                <span className="text-muted-foreground">Normal (≤30 min)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-l-4 border-l-warning bg-warning/10" />
                <span className="text-muted-foreground">Warning ({'>'} 30 min)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-l-4 border-l-destructive bg-destructive/10" />
                <span className="text-muted-foreground">Critical ({'>'} 24 hours)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
