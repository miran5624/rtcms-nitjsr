'use client'

// admin my claims page
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { 
  getClaimedByAdmin,
  subscribe 
} from '@/lib/store'
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
  ExternalLink
} from 'lucide-react'

export default function MyClaimsPage() {
  const { user, loading } = useAuth('admin')
  const [claims, setClaims] = useState<Complaint[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  const loadData = () => {
    if (!user) return
    setClaims(getClaimedByAdmin(user.id))
  }
  
  useEffect(() => {
    loadData()
    
    const unsubscribe = subscribe(() => {
      loadData()
    })
    
    return () => unsubscribe()
  }, [user])
  
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
                      <tr key={complaint.id} className="border-b border-border last:border-0">
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
                          <Link href={`/admin/complaint/${complaint.id}`}>
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
                      <tr key={complaint.id} className="border-b border-border last:border-0">
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
                          <Link href={`/admin/complaint/${complaint.id}`}>
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
                <p className="text-muted-foreground">No resolved claims yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
