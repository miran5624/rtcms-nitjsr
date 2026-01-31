'use client'

// super admin analytics page
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/lib/services/api'
import { mapApiComplaintToFrontend, type ApiComplaint, type Complaint } from '@/lib/types'
import { categoryLabels, statusConfig } from '@/lib/types'
import type { ComplaintCategory, ComplaintStatus } from '@/lib/types'
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw
} from 'lucide-react'

// Define the analytics structure locally since we aren't using the store
interface AnalyticsData {
  total: number
  pending: number
  resolved: number
  escalated: number
  avgResolutionTime: number
  byCategory: Record<string, number>
  byStatus: Record<string, number>
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth('super_admin')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const calculateAnalytics = (complaints: Complaint[]): AnalyticsData => {
    const resolved = complaints.filter(c => c.status === 'resolved')
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const escalated = complaints.filter(
      c => new Date(c.createdAt) < dayAgo && !['resolved', 'closed', 'rejected'].includes(c.status)
    )

    // avg resolution time in hours
    let avgResolutionTime = 0
    if (resolved.length > 0) {
      const totalTime = resolved.reduce((sum, c) => {
        if (c.resolvedAt) {
          return sum + (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime())
        }
        return sum
      }, 0)
      avgResolutionTime = Math.round(totalTime / resolved.length / (1000 * 60 * 60))
    }

    // complaints by category
    const byCategory = complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // complaints by status
    const byStatus = complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      resolved: resolved.length,
      escalated: escalated.length,
      avgResolutionTime,
      byCategory,
      byStatus
    }
  }

  const loadData = async () => {
    try {
      const { data } = await api.get<ApiComplaint[]>('/complaints')
      const list = Array.isArray(data) ? data : []
      const mapped = list.map(c => mapApiComplaintToFrontend(c))
      setAnalytics(calculateAnalytics(mapped))
    } catch (error) {
      console.error('Failed to fetch analytics data', error)
    }
  }

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setTimeout(() => setRefreshing(false), 500)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!analytics) {
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
              <h2 className="font-serif text-2xl font-bold text-primary">Analytics Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Complaint statistics and insights
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

        {/* key metrics */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics.total}</p>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics.resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics.escalated}</p>
                <p className="text-sm text-muted-foreground">Escalated</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {analytics.avgResolutionTime}h
                </p>
                <p className="text-sm text-muted-foreground">Avg. Resolution Time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* complaints by category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Complaints by Category
              </CardTitle>
              <CardDescription>
                Distribution of complaints across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(Object.keys(categoryLabels) as ComplaintCategory[]).map(category => {
                  const count = analytics.byCategory[category] || 0
                  const percentage = analytics.total > 0
                    ? Math.round((count / analytics.total) * 100)
                    : 0

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{categoryLabels[category]}</span>
                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* complaints by status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Complaints by Status
              </CardTitle>
              <CardDescription>
                Current status distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(Object.keys(statusConfig) as ComplaintStatus[]).map(status => {
                  const count = analytics.byStatus[status] || 0
                  const percentage = analytics.total > 0
                    ? Math.round((count / analytics.total) * 100)
                    : 0

                  // get color for this status
                  const colorClass = status === 'pending' ? 'bg-yellow-500'
                    : status === 'claimed' ? 'bg-blue-500'
                      : status === 'in_progress' ? 'bg-indigo-500'
                        : status === 'resolved' ? 'bg-green-500'
                          : status === 'escalated' ? 'bg-red-500'
                            : 'bg-gray-500'

                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{statusConfig[status].label}</span>
                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full transition-all ${colorClass}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* summary cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <h4 className="mb-2 font-medium text-foreground">Resolution Rate</h4>
              <p className="text-3xl font-bold text-green-600">
                {analytics.total > 0
                  ? Math.round((analytics.resolved / analytics.total) * 100)
                  : 0
                }%
              </p>
              <p className="text-sm text-muted-foreground">
                {analytics.resolved} of {analytics.total} complaints resolved
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <h4 className="mb-2 font-medium text-foreground">Escalation Rate</h4>
              <p className="text-3xl font-bold text-red-600">
                {analytics.total > 0
                  ? Math.round((analytics.escalated / analytics.total) * 100)
                  : 0
                }%
              </p>
              <p className="text-sm text-muted-foreground">
                {analytics.escalated} complaints escalated ({'>'}24 hours)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <h4 className="mb-2 font-medium text-foreground">Pending Complaints</h4>
              <p className="text-3xl font-bold text-yellow-600">{analytics.pending}</p>
              <p className="text-sm text-muted-foreground">
                Awaiting action from admins
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
