"use client"

import { use, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, Clock, User, MessageSquare, Paperclip, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { PriorityBadge } from "@/components/ui/priority-badge"
import { useAuth } from "@/hooks/use-auth"
import { getComplaintById, addFeedback } from "@/lib/store"
import { useRealtime } from "@/hooks/use-realtime"
import type { Complaint } from "@/lib/types"

export default function StudentComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetcher = useCallback(() => getComplaintById(id), [id])
  const { data: complaint, mutate } = useSWR<Complaint | undefined>(`complaint-${id}`, fetcher)

  useRealtime({ key: `complaint-${id}`, interval: 5000 })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (!authLoading && user && user.role !== "student") {
      router.push(`/${user.role}/dashboard`)
    }
  }, [user, authLoading, router])

  const handleSubmitFeedback = async () => {
    if (!feedback.trim() || !user) return

    setSubmitting(true)
    try {
      addFeedback(id, {
        id: Math.random().toString(36).substring(7),
        complaintId: id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        message: feedback,
        createdAt: new Date().toISOString(),
      })
      setFeedback("")
      mutate()
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={user} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">Complaint not found</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/student/dashboard")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Complaint #{complaint.id.toUpperCase()}
                    </p>
                    <CardTitle className="text-xl text-foreground">{complaint.title}</CardTitle>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-foreground whitespace-pre-wrap break-words break-all">{complaint.description}</p>
                </div>

                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {complaint.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{attachment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Communication Thread
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complaint.feedback && complaint.feedback.length > 0 ? (
                  <div className="space-y-4">
                    {complaint.feedback.map((fb) => (
                      <div
                        key={fb.id}
                        className={`p-4 rounded-lg ${fb.userRole === "student"
                            ? "bg-primary/5 border border-primary/10 ml-4"
                            : "bg-muted mr-4"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm text-foreground">{fb.userName}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              ({fb.userRole})
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{fb.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No messages yet. Add a message to communicate with the assigned admin.
                  </p>
                )}

                <div className="pt-4 border-t">
                  <Textarea
                    placeholder="Type your message..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="mb-3"
                    rows={3}
                  />
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={!feedback.trim() || submitting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {complaint.category}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Submitted</span>
                  <span className="text-sm text-foreground">
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {complaint.assignedTo && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Assigned To</span>
                    <span className="text-sm text-foreground">{complaint.assignedToName}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="w-0.5 flex-1 bg-border" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-foreground">Complaint Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(complaint.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {complaint.assignedTo && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="w-0.5 flex-1 bg-border" />
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-foreground">Assigned to Admin</p>
                        <p className="text-xs text-muted-foreground">{complaint.assignedToName}</p>
                      </div>
                    </div>
                  )}

                  {complaint.status === "resolved" && complaint.resolvedAt && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Resolved</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(complaint.resolvedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {complaint.status === "escalated" && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Escalated</p>
                        <p className="text-xs text-muted-foreground">
                          Sent to Super Admin for review
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
