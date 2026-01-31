'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/services/api'
import { mapApiComplaintToFrontend, type ApiComplaint } from '@/lib/types'
import { useSocketComplaints } from '@/hooks/use-socket-complaints'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  categoryLabels,
  statusConfig,
  getTimeElapsed
} from '@/lib/types'
import type { Complaint } from '@/lib/types'
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Loader2,
  Check
} from 'lucide-react'

export default function MyClaimsPage() {
  const { user, loading } = useAuth('admin')
  const [claims, setClaims] = useState<Complaint[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Modal state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  // Add Update State
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get<ApiComplaint[]>('/complaints')
      const list = Array.isArray(data) ? data : []
      const mapped = list.map(c => mapApiComplaintToFrontend(c))
      // Filter for complaints claimed by the current user
      setClaims(mapped.filter(c => c.claimedBy === user.id))
    } catch (error) {
      console.error('Failed to fetch claims', error)
    }
  }, [user])

  // Enable real-time updates
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setTimeout(() => setRefreshing(false), 500)
  }

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const activeClaims = claims.filter(c => !['resolved', 'closed'].includes(c.status))
  const resolvedClaims = claims.filter(c => ['resolved', 'closed'].includes(c.status))

  return (
    <div className="min-h-screen bg-secondary">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary">My Claims</h2>
              <p className="text-sm text-muted-foreground">
                All complaints you have claimed
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

        {/* active claims */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Active Claims</CardTitle>
            <CardDescription>
              Complaints currently being worked on
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeClaims.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 pr-4">Category</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Time Elapsed</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeClaims.map(complaint => (
                      <tr key={complaint.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground">{complaint.title}</p>
                          <p className="text-xs text-muted-foreground">{complaint.studentEmail}</p>
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
                          {getTimeElapsed(new Date(complaint.createdAt)).text}
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                            onClick={() => setSelectedComplaint(complaint)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No active claims.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* resolved claims */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolved Claims</CardTitle>
            <CardDescription>
              Previously resolved complaints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resolvedClaims.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 pr-4">Category</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Resolved At</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedClaims.map(complaint => (
                      <tr key={complaint.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground">{complaint.title}</p>
                          <p className="text-xs text-muted-foreground">{complaint.studentEmail}</p>
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
                          {complaint.resolvedAt
                            ? new Date(complaint.resolvedAt).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent"
                            onClick={() => setSelectedComplaint(complaint)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No resolved claims yet.</p>
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
    </div>
  )
}
