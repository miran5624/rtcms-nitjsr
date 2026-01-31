'use client'

// super admin dashboard - overview of all complaints logic
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
  Check,
  ShieldAlert
} from 'lucide-react'

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth('super_admin') // Enforce super_admin role
  const [activeComplaints, setActiveComplaints] = useState<Complaint[]>([])
  const [resolved, setResolved] = useState<Complaint[]>([])
  const [refreshing, setRefreshing] = useState(false)

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

      // Super Admin sees ALL active complaints (pending, open, in_progress)
      setActiveComplaints(mapped.filter((c) => ['pending', 'open', 'in_progress'].includes(c.status)))

      // And all resolved history
      setResolved(mapped.filter((c) => ['resolved', 'closed', 'rejected'].includes(c.status)))
    } catch {
      setActiveComplaints([])
      setResolved([])
    }
  }, [user])

  useSocketComplaints(loadData)

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (selectedComplaint) {
      setModalLoading(true)
      const timer = setTimeout(() => setModalLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [selectedComplaint])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleQuickResolve = async () => {
    if (!selectedComplaint) return
    setIsResolving(true)
    try {
      await api.patch(`/complaints/${selectedComplaint.id}/status`, {
        status: 'resolved',
        remarks: 'Resolved by Super Admin via Dashboard'
      })
      setSelectedComplaint(null)
      await loadData()
    } catch (err: unknown) {
      alert('Failed to resolve complaint.')
    } finally {
      setIsResolving(false)
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
            <h2 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
              <ShieldAlert className="h-6 w-6" />
              Super Admin Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Oversee and manage all institute complaints
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
              <p className="text-2xl font-bold text-foreground">{activeComplaints.length}</p>
              <p className="text-sm text-muted-foreground">Active Complaints</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-1 pt-6">
              <p className="text-2xl font-bold text-foreground">{resolved.length}</p>
              <p className="text-sm text-muted-foreground">Total Resolved</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-1 pt-6">
              <p className="text-2xl font-bold text-foreground">
                {activeComplaints.filter(c => getUrgencyLevel(new Date(c.createdAt)) !== 'normal').length}
              </p>
              <p className="text-sm text-muted-foreground">Critical / Urgent</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Active Complaints Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                All Active Complaints
              </CardTitle>
              <CardDescription>
                Live feed of all pending and in-progress complaints across the institute
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeComplaints.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeComplaints.map(complaint => {
                    const elapsed = getTimeElapsed(new Date(complaint.createdAt))
                    const urgency = getUrgencyLevel(new Date(complaint.createdAt))

                    return (
                      <div
                        key={complaint.id}
                        onClick={() => setSelectedComplaint(complaint)}
                        className={`cursor-pointer rounded-lg border border-border p-4 transition-all hover:shadow-md ${getUrgencyStyles(new Date(complaint.createdAt))}`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground break-all whitespace-normal line-clamp-1">
                              {complaint.title}
                            </h4>
                            {urgency === 'critical' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          </div>
                          <Badge
                            variant="outline"
                            className={statusConfig[complaint.status].color}
                          >
                            {statusConfig[complaint.status].label}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mb-2">
                          {categoryLabels[complaint.category]} • ID: {complaint.id}
                        </p>

                        <p className="mb-3 text-sm text-muted-foreground line-clamp-3 break-all whitespace-normal">
                          {complaint.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-xs text-muted-foreground">
                            {complaint.claimedByEmail ? `Claimed by: ${complaint.claimedByEmail}` : 'Unclaimed'}
                          </p>
                          <span className="text-xs text-muted-foreground">{elapsed.text}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p className="text-muted-foreground">
                    All clear! No active complaints at the moment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolved History (Collapsible or just a list) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recent Resolutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resolved.length > 0 ? (
                <div className="space-y-2">
                  {resolved.slice(0, 10).map(complaint => (
                    <div
                      key={complaint.id}
                      onClick={() => setSelectedComplaint(complaint)}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground line-clamp-1">{complaint.title}</p>
                          <p className="text-xs text-muted-foreground">Resolved on {new Date(complaint.resolvedAt || '').toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">RESOLVED</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No resolved history yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal for Details (Same as Admin) */}
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
                <div className="mt-6 flex justify-end gap-3 pt-2 border-t">
                  <Button
                    onClick={() => {
                      setUpdateMessage('')
                      setUpdateDialogOpen(true)
                    }}
                    variant="outline"
                  >
                    Add Update
                  </Button>

                  {selectedComplaint?.status !== 'resolved' && (
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
                  )}

                </div>
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
                Add a progress update as Super Admin.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="update-message" className="mb-2 block">Message</Label>
              <Textarea
                id="update-message"
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="e.g. Issue escalated to external contractor..."
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
