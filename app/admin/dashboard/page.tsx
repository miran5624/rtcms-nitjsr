'use client'

// admin dashboard - view and claim complaints
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useSocketComplaints } from '@/hooks/use-socket-complaints'
import { api } from '@/lib/services/api'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Lock,
  Check
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading } = useAuth('admin')
  const [unclaimed, setUnclaimed] = useState<Complaint[]>([])
  const [myClaims, setMyClaims] = useState<Complaint[]>([])
  const [myResolved, setMyResolved] = useState<Complaint[]>([])
  const [resolved, setResolved] = useState<Complaint[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)

  // Modal state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  // Add Update State
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleAddUpdate = async () => {
    if (!selectedComplaint || !updateMessage.trim()) return
    setIsUpdating(true)
    try {
      await api.post(`/complaints/${selectedComplaint.id}/updates`, {
        message: updateMessage
      })
      alert('Update posted successfully')
      setUpdateDialogOpen(false)
      // Optionally refresh timeline locally if we were showing it, but here we just post
    } catch {
      alert('Failed to post update')
    } finally {
      setIsUpdating(false)
    }
  }



  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get<ApiComplaint[]>('/complaints')
      const list = Array.isArray(data) ? data : []
      const mapped = list.map((c) => mapApiComplaintToFrontend(c))

      setUnclaimed(mapped.filter((c) => (c.status === 'pending' || c.status === 'open') && !c.claimedBy))

      // Active claims only for the main card
      setMyClaims(mapped.filter((c) => c.claimedBy === user.id && !['resolved', 'closed', 'rejected'].includes(c.status)))

      // Resolved history for the bottom section
      setMyResolved(mapped.filter((c) => c.claimedBy === user.id && ['resolved', 'closed', 'rejected'].includes(c.status)))

      // Global resolved (keep for superadmin view logic if needed later, but standard admins use myResolved)
      setResolved(mapped.filter((c) => c.status === 'resolved' || c.status === 'rejected'))
    } catch {
      setUnclaimed([])
      setMyClaims([])
      setMyResolved([])
      setResolved([])
    }
  }, [user])

  useSocketComplaints(loadData)

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset modal loading state when opening
  useEffect(() => {
    if (selectedComplaint) {
      setModalLoading(true)
      const timer = setTimeout(() => setModalLoading(false), 500) // Simulate loading
      return () => clearTimeout(timer)
    }
  }, [selectedComplaint])

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

  const handleQuickResolve = async () => {
    if (!selectedComplaint) return
    setIsResolving(true)
    try {
      await api.patch(`/complaints/${selectedComplaint.id}/status`, {
        status: 'resolved',
        remarks: 'Resolved via Quick Action'
      })
      // Close modal and refresh
      setSelectedComplaint(null)
      await loadData()
    } catch (err: unknown) { // eslint-disable-line @typescript-eslint/no-unused-vars
      alert('Failed to resolve complaint. Please try again.')
    } finally {
      setIsResolving(false)
    }
  }

  const getUrgencyStyles = (createdAt: Date) => {
    const level = getUrgencyLevel(createdAt)
    switch (level) {
      case 'escalated':
        return 'border-l-4 border-l-purple-600 bg-purple-50'
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
            <CardContent className="flex flex-col gap-1 pt-6">
              <p className="text-2xl font-bold text-foreground">{unclaimed.length}</p>
              <p className="text-sm text-muted-foreground">Unclaimed Complaints</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-1 pt-6">
              <p className="text-2xl font-bold text-foreground">{myClaims.length}</p>
              <p className="text-sm text-muted-foreground">My Claims</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-1 pt-6">
              <p className="text-2xl font-bold text-foreground">
                {unclaimed.filter(c => getUrgencyLevel(new Date(c.createdAt)) !== 'normal').length}
              </p>
              <p className="text-sm text-muted-foreground">Urgent Cases</p>
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
                    // calc time elapsed and check if urgent
                    const elapsed = getTimeElapsed(new Date(complaint.createdAt))
                    const urgency = getUrgencyLevel(new Date(complaint.createdAt))

                    return (
                      <div
                        key={complaint.id}
                        className="rounded-lg border border-primary/30 bg-primary/5 p-4"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground break-words break-all">
                                {complaint.title}
                              </h4>
                              {urgency === 'escalated' && (
                                <Badge variant="destructive" className="bg-purple-600 hover:bg-purple-700">
                                  Escalated
                                </Badge>
                              )}
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
                            className={
                              urgency === 'escalated'
                                ? 'border-purple-600 text-purple-700 bg-purple-50'
                                : urgency === 'critical'
                                  ? 'border-destructive bg-destructive/10 text-destructive'
                                  : urgency === 'warning'
                                    ? 'border-warning bg-warning/10 text-warning'
                                    : 'border-muted-foreground'
                            }
                          >
                            {elapsed.text}
                          </Badge>
                        </div>

                        <p className="mb-3 text-sm text-muted-foreground line-clamp-2 break-all whitespace-normal">
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
                    <div
                      key={complaint.id}
                      onClick={() => setSelectedComplaint(complaint)}
                      className="cursor-pointer rounded-lg border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-foreground break-all whitespace-normal">
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
                          {complaint.claimedByEmail
                            ? `Claimed by: ${complaint.claimedByEmail}`
                            : (complaint.status === 'in_progress' ? 'Claimed by: You' : 'Unclaimed')
                          }
                        </p>
                        <span className="text-xs font-medium text-primary">
                          Locked by You
                        </span>
                      </div>
                    </div>
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

        {/* Super Admin / History View */}
        {(user?.department === 'superadmin' || user?.department === 'all') && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Resolved & Closed Complaints
              </CardTitle>
              <CardDescription>
                History of all resolved complaints (Super Admin View)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resolved.length > 0 ? (
                <div className="space-y-3">
                  {resolved.slice(0, 50).map(complaint => (
                    <div
                      key={complaint.id}
                      onClick={() => setSelectedComplaint(complaint)}
                      className="cursor-pointer rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-foreground line-clamp-1">{complaint.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {categoryLabels[complaint.category]} • ID: {complaint.id}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                          {complaint.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-muted-foreground">No resolved complaints found.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* time-based urgency legend */}


        {/* My Resolved History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Recently Solved Issues
            </CardTitle>
            <CardDescription>
              History of complaints you have successfully resolved
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myResolved.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {myResolved.map(complaint => (
                  <div
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint)}
                    className="cursor-pointer rounded-lg border border-border p-4 transition-all hover:bg-muted/50 hover:shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground line-clamp-1 flex-1">{complaint.title}</h4>
                      <Badge variant="outline" className="shrink-0 bg-green-50 text-green-700 border-green-200">
                        {complaint.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {categoryLabels[complaint.category]} • ID: {complaint.id.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Resolved {getTimeElapsed(new Date(complaint.updatedAt)).text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p>No resolved history yet.</p>
                <p className="text-sm">Complaints you resolve will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal for Claimed Complaint */}
        <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="break-all whitespace-normal pr-4">{selectedComplaint?.title}</DialogTitle>
              <DialogDescription>
                {selectedComplaint ? categoryLabels[selectedComplaint.category] : ''} • ID: {selectedComplaint?.id.slice(0, 8)}...
              </DialogDescription>
              {selectedComplaint && (
                <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                  <p><strong>Filed By:</strong> {selectedComplaint.studentEmail}</p>
                  {selectedComplaint.claimedByEmail && <p><strong>Claimed By:</strong> {selectedComplaint.claimedByEmail}</p>}
                </div>
              )}
            </DialogHeader>

            {modalLoading ? (
              <div className="flex h-full py-12 w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading details...</p>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-2 font-medium">Description</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words break-all">
                        {selectedComplaint?.description}
                      </p>
                    </div>

                    {selectedComplaint?.imageUrl ? (
                      <div>
                        <h4 className="mb-2 font-medium">Attached Proof</h4>
                        <img
                          src={selectedComplaint.imageUrl}
                          alt="Complaint Proof"
                          className="max-w-full h-auto max-h-[40vh] object-contain rounded-md border bg-gray-50 mx-auto"
                        />
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
                {selectedComplaint && !['resolved', 'closed', 'rejected'].includes(selectedComplaint.status) && (
                  <div className="mt-6 flex justify-end gap-3 pt-2 border-t">
                    <Button
                      onClick={() => {
                        // Open Add Update Dialog
                        setUpdateMessage('')
                        setUpdateDialogOpen(true)
                      }}
                      variant="outline"
                    >
                      Add Update
                    </Button>
                    <Button
                      onClick={handleQuickResolve}
                      disabled={isResolving}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Resolve Issue
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Update Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post Status Update</DialogTitle>
              <DialogDescription>
                Add a progress update for the student. They will see this in their timeline.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="update-message" className="mb-2 block">Message</Label>
              <Textarea
                id="update-message"
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="e.g. Electrician has been assigned..."
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUpdate} disabled={isUpdating || !updateMessage.trim()}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Post Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div >
  )
}
