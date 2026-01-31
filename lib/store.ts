// global state store for complaints - simulates backend
// in production, this would be replaced with actual api calls

import type { Complaint, ActivityLog, User } from './types'

// global store for demo purposes
declare global {
  // eslint-disable-next-line no-var
  var complaintsStore: Complaint[]
  // eslint-disable-next-line no-var
  var activityStore: ActivityLog[]
  // eslint-disable-next-line no-var
  var listeners: Set<() => void>
}

// initialize stores
if (!global.complaintsStore) {
  global.complaintsStore = []
}
if (!global.activityStore) {
  global.activityStore = []
}
if (!global.listeners) {
  global.listeners = new Set()
}

// subscribe to changes
export function subscribe(callback: () => void) {
  global.listeners.add(callback)
  return () => global.listeners.delete(callback)
}

// notify all listeners
function notifyListeners() {
  global.listeners.forEach(callback => callback())
}

// get all complaints
export function getComplaints(): Complaint[] {
  return [...global.complaintsStore]
}

// get complaint by id
export function getComplaintById(id: string): Complaint | null {
  return global.complaintsStore.find(c => c.id === id) || null
}

// get complaints by student id
export function getComplaintsByStudent(studentId: string): Complaint[] {
  return global.complaintsStore.filter(c => c.studentId === studentId)
}

// get active complaint for student (only one allowed at a time)
export function getActiveComplaint(studentId: string): Complaint | null {
  return global.complaintsStore.find(
    c => c.studentId === studentId && 
    !['resolved', 'closed'].includes(c.status)
  ) || null
}

// create new complaint
export function createComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): Complaint {
  const newComplaint: Complaint = {
    ...complaint,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  global.complaintsStore.push(newComplaint)
  
  // add activity log
  addActivityLog({
    complaintId: newComplaint.id,
    action: 'Complaint Created',
    performedBy: complaint.studentId,
    performedByEmail: complaint.studentEmail,
    performedByRole: 'student',
    remarks: `New complaint filed under ${complaint.category} category`
  })
  
  notifyListeners()
  return newComplaint
}

// update complaint
export function updateComplaint(
  id: string, 
  updates: Partial<Complaint>,
  updatedBy: User,
  remarks?: string
): Complaint | null {
  const index = global.complaintsStore.findIndex(c => c.id === id)
  if (index === -1) return null
  
  const oldComplaint = global.complaintsStore[index]
  const updatedComplaint = {
    ...oldComplaint,
    ...updates,
    updatedAt: new Date()
  }
  
  global.complaintsStore[index] = updatedComplaint
  
  // log activity
  let action = 'Complaint Updated'
  if (updates.status && updates.status !== oldComplaint.status) {
    action = `Status changed to ${updates.status}`
  }
  if (updates.claimedBy && !oldComplaint.claimedBy) {
    action = 'Complaint Claimed'
  }
  
  addActivityLog({
    complaintId: id,
    action,
    performedBy: updatedBy.id,
    performedByEmail: updatedBy.email,
    performedByRole: updatedBy.role,
    remarks: remarks || null
  })
  
  notifyListeners()
  return updatedComplaint
}

// claim complaint (admin only)
export function claimComplaint(complaintId: string, admin: User): Complaint | null {
  const complaint = getComplaintById(complaintId)
  if (!complaint || complaint.claimedBy) return null
  
  return updateComplaint(
    complaintId,
    {
      claimedBy: admin.id,
      claimedByEmail: admin.email,
      claimedAt: new Date(),
      status: 'claimed'
    },
    admin,
    `Claimed by ${admin.email}`
  )
}

// get unclaimed complaints
export function getUnclaimedComplaints(): Complaint[] {
  return global.complaintsStore.filter(c => !c.claimedBy && c.status === 'pending')
}

// get complaints claimed by admin
export function getClaimedByAdmin(adminId: string): Complaint[] {
  return global.complaintsStore.filter(c => c.claimedBy === adminId)
}

// add activity log
export function addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
  const newLog: ActivityLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date()
  }
  
  global.activityStore.push(newLog)
  notifyListeners()
  return newLog
}

// get activity logs for complaint
export function getActivityLogs(complaintId: string): ActivityLog[] {
  return global.activityStore
    .filter(log => log.complaintId === complaintId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// add feedback to complaint
export function addFeedback(complaintId: string, feedback: {
  id: string
  complaintId: string
  userId: string
  userName: string
  userRole: 'student' | 'admin' | 'super_admin'
  message: string
  createdAt: string
}): boolean {
  const index = global.complaintsStore.findIndex(c => c.id === complaintId)
  if (index === -1) return false
  
  const complaint = global.complaintsStore[index]
  const existingFeedback = complaint.feedback || []
  
  global.complaintsStore[index] = {
    ...complaint,
    feedback: [...existingFeedback, feedback],
    updatedAt: new Date()
  }
  
  notifyListeners()
  return true
}

// get all complaints for super admin
export function getAllComplaints(): Complaint[] {
  return [...global.complaintsStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

// get escalated complaints (open for more than 24 hours)
export function getEscalatedComplaints(): Complaint[] {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return global.complaintsStore.filter(
    c => new Date(c.createdAt) < dayAgo && !['resolved', 'closed'].includes(c.status)
  )
}

// get analytics data
export function getAnalytics() {
  const complaints = getAllComplaints()
  const resolved = complaints.filter(c => c.status === 'resolved')
  const escalated = getEscalatedComplaints()
  
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

// seed demo data
export function seedDemoData() {
  if (global.complaintsStore.length > 0) return
  
  const demoComplaints: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      studentId: 'demo-student-1',
      studentEmail: '2024ugcs001@nitjsr.ac.in',
      studentName: '2024ugcs001',
      category: 'hostel',
      title: 'Water supply issue in Block A',
      description: 'There has been no water supply in Block A Room 201 for the past 2 days.',
      status: 'pending',
      claimedBy: null,
      claimedByEmail: null,
      claimedAt: null,
      resolvedAt: null
    },
    {
      studentId: 'demo-student-2',
      studentEmail: '2024ugec042@nitjsr.ac.in',
      studentName: '2024ugec042',
      category: 'mess',
      title: 'Food quality concerns',
      description: 'The quality of food served in the mess has deteriorated significantly.',
      status: 'claimed',
      claimedBy: 'demo-admin-1',
      claimedByEmail: 'warden@nitjsr.ac.in',
      claimedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resolvedAt: null
    },
    {
      studentId: 'demo-student-3',
      studentEmail: '2023ugme015@nitjsr.ac.in',
      studentName: '2023ugme015',
      category: 'internet',
      title: 'WiFi connectivity issues',
      description: 'WiFi has been extremely slow in the library for the past week.',
      status: 'pending',
      claimedBy: null,
      claimedByEmail: null,
      claimedAt: null,
      resolvedAt: null
    }
  ]
  
  // create complaints with staggered timestamps
  demoComplaints.forEach((complaint, index) => {
    const hoursAgo = index * 12 + Math.random() * 24
    const created = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
    
    const newComplaint: Complaint = {
      ...complaint,
      id: crypto.randomUUID(),
      createdAt: created,
      updatedAt: created
    }
    
    global.complaintsStore.push(newComplaint)
    
    global.activityStore.push({
      id: crypto.randomUUID(),
      complaintId: newComplaint.id,
      action: 'Complaint Created',
      performedBy: complaint.studentId,
      performedByEmail: complaint.studentEmail,
      performedByRole: 'student',
      remarks: `New complaint filed under ${complaint.category} category`,
      timestamp: created
    })
  })
  
  notifyListeners()
}
