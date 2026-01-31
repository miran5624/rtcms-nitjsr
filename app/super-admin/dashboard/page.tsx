'use client'

// super admin dashboard - all complaints overview
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { 
  getAllComplaints,
  getAnalytics,
  subscribe,
  seedDemoData 
} from '@/lib/store'
import { 
  categoryLabels, 
  statusConfig, 
  getTimeElapsed,
  getUrgencyLevel
} from '@/lib/types'
import type { Complaint } from '@/lib/types'
import { 
  Search,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  TrendingUp
} from 'lucide-react'

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth('super_admin')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([])
  const [analytics, setAnalytics] = useState<ReturnType<typeof getAnalytics> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  
  const loadData = () => {
    seedDemoData()
    const all = getAllComplaints()
    setComplaints(all)
    setFilteredComplaints(all)
    setAnalytics(getAnalytics())
  }
  
  useEffect(() => {
    loadData()
    
    const unsubscribe = subscribe(() => {
      loadData()
    })
    
    return () => unsubscribe()
  }, [])
  
  // filter complaints
  useEffect(() => {
    let filtered = [...complaints]
    
    // search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }
    
    setFilteredComplaints(filtered)
  }, [searchQuery, statusFilter, complaints])
  
  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
    setTimeout(() => setRefreshing(false), 500)
  }
  
  const getUrgencyStyles = (createdAt: Date) => {
    const level = getUrgencyLevel(createdAt)
    switch (level) {
      case 'critical':
        return 'border-l-4 border-l-destructive bg-destructive/5'
      case 'warning':
        return 'border-l-4 border-l-warning bg-warning/5'
      default:
        return ''
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
            <h2 className="font-serif text-2xl font-bold text-primary">Super Admin Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Complete oversight of all complaints
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
        
        {/* stats overview */}
        {analytics && (
          <div className="mb-6 grid gap-4 md:grid-cols-4">
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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{analytics.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
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
          </div>
        )}
        
        {/* quick links */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/super-admin/analytics">
            <Button variant="outline" className="gap-2 bg-transparent">
              <TrendingUp className="h-4 w-4" />
              View Analytics
            </Button>
          </Link>
          <Link href="/super-admin/escalations">
            <Button variant="outline" className="gap-2 border-destructive text-destructive hover:bg-destructive/10 bg-transparent">
              <AlertTriangle className="h-4 w-4" />
              View Escalations ({analytics?.escalated || 0})
            </Button>
          </Link>
        </div>
        
        {/* complaints table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg">All Complaints</CardTitle>
                <CardDescription>
                  {filteredComplaints.length} of {complaints.length} complaints
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10"
                  />
                </div>
                
                {/* status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="claimed">Claimed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredComplaints.length > 0 ? (
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
                      <th className="pb-3 pr-4">Age</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map(complaint => (
                      <tr 
                        key={complaint.id} 
                        className={`border-b border-border last:border-0 ${getUrgencyStyles(new Date(complaint.createdAt))}`}
                      >
                        <td className="py-3 pr-4 text-xs font-mono text-muted-foreground">
                          {complaint.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground">{complaint.title}</p>
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
                          {complaint.claimedByEmail || '-'}
                        </td>
                        <td className="py-3 pr-4 text-sm">
                          <span className={
                            getUrgencyLevel(new Date(complaint.createdAt)) === 'critical' 
                              ? 'font-medium text-destructive'
                              : getUrgencyLevel(new Date(complaint.createdAt)) === 'warning'
                                ? 'font-medium text-warning'
                                : 'text-muted-foreground'
                          }>
                            {getTimeElapsed(new Date(complaint.createdAt)).text}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link href={`/super-admin/complaint/${complaint.id}`}>
                            <Button size="sm" variant="outline" className="gap-1 bg-transparent">
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
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No complaints found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
