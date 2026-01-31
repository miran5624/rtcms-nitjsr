// complaint management system types

export type UserRole = 'student' | 'admin' | 'super_admin'

export type ComplaintCategory = 
  | 'hostel'
  | 'mess'
  | 'academic'
  | 'internet'
  | 'infrastructure'
  | 'others'

export type ComplaintStatus = 
  | 'pending'
  | 'claimed'
  | 'in_progress'
  | 'resolved'
  | 'escalated'
  | 'closed'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

export interface Complaint {
  id: string
  studentId: string
  studentEmail: string
  studentName: string
  category: ComplaintCategory
  title: string
  description: string
  status: ComplaintStatus
  claimedBy: string | null
  claimedByEmail: string | null
  claimedAt: Date | null
  createdAt: Date
  updatedAt: Date
  resolvedAt: Date | null
  feedback?: Feedback[]
  attachments?: string[]
  priority?: 'low' | 'medium' | 'high'
  assignedTo?: string
  assignedToName?: string
}

export interface ActivityLog {
  id: string
  complaintId: string
  action: string
  performedBy: string
  performedByEmail: string
  performedByRole: UserRole
  remarks: string | null
  timestamp: Date
}

export interface Feedback {
  id: string
  complaintId: string
  userId: string
  userName: string
  userRole: UserRole
  message: string
  createdAt: string
}

// helper to calculate time elapsed
export function getTimeElapsed(date: Date): { minutes: number; hours: number; text: string } {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (minutes < 60) {
    return { minutes, hours: 0, text: `${minutes} min ago` }
  } else if (hours < 24) {
    return { minutes, hours, text: `${hours} hour${hours > 1 ? 's' : ''} ago` }
  } else {
    const days = Math.floor(hours / 24)
    return { minutes, hours, text: `${days} day${days > 1 ? 's' : ''} ago` }
  }
}

// urgency levels based on time elapsed
export function getUrgencyLevel(createdAt: Date): 'normal' | 'warning' | 'critical' {
  const { minutes } = getTimeElapsed(createdAt)
  if (minutes > 24 * 60) return 'critical' // > 24 hours
  if (minutes > 30) return 'warning' // > 30 minutes
  return 'normal'
}

// category labels for display
export const categoryLabels: Record<ComplaintCategory, string> = {
  hostel: 'Hostel',
  mess: 'Mess',
  academic: 'Academic',
  internet: 'Internet / Network',
  infrastructure: 'Infrastructure',
  others: 'Others'
}

// status labels and colors
export const statusConfig: Record<ComplaintStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  claimed: { label: 'Claimed', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-300' },
  escalated: { label: 'Escalated', color: 'bg-red-100 text-red-800 border-red-300' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-300' }
}
