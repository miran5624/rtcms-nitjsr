// authentication utilities for nit jamshedpur complaint system

import type { UserRole } from './types'

// email patterns for role detection
// student: 4 digits (year) + letters (branch) + digits (roll) e.g. 2024ugcs002
const STUDENT_EMAIL_PATTERN = /^\d{4}[a-zA-Z]+\d{1,4}@nitjsr\.ac\.in$/
// faculty/staff: name.warden, name.supervisor, etc.
const FACULTY_EMAIL_PATTERN = /^[a-zA-Z0-9._-]+\.(warden|supervisor|faculty|hod|dean)@nitjsr\.ac\.in$/
const ADMIN_EMAIL_SUFFIXES = ['warden@nitjsr.ac.in', 'supervisor@nitjsr.ac.in', 'faculty@nitjsr.ac.in']

// super admin emails loaded from env (comma separated)
function getSuperAdminEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || ''
  return envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

// determine user role based on email
export function determineRole(email: string): UserRole | null {
  const normalizedEmail = email.toLowerCase().trim()
  
  // check super admin first
  const superAdmins = getSuperAdminEmails()
  if (superAdmins.includes(normalizedEmail)) {
    return 'super_admin'
  }
  
  // check faculty pattern (name.warden@nitjsr.ac.in, etc.)
  if (FACULTY_EMAIL_PATTERN.test(normalizedEmail)) {
    return 'admin'
  }

  // check admin suffixes (warden@nitjsr.ac.in, etc.)
  for (const suffix of ADMIN_EMAIL_SUFFIXES) {
    if (normalizedEmail === suffix) {
      return 'admin'
    }
  }

  // check student pattern (2024ugcs002@nitjsr.ac.in)
  if (STUDENT_EMAIL_PATTERN.test(normalizedEmail)) {
    return 'student'
  }

  // any other @nitjsr.ac.in treated as admin (generic institute email)
  if (normalizedEmail.endsWith('@nitjsr.ac.in')) {
    return 'admin'
  }

  return null
}

// validate if email belongs to nitjsr domain
export function isValidNITJSREmail(email: string): boolean {
  return email.toLowerCase().endsWith('@nitjsr.ac.in')
}

// get redirect path based on role
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/student/dashboard'
    case 'admin':
      return '/admin/dashboard'
    case 'super_admin':
      return '/super-admin/dashboard'
    default:
      return '/'
  }
}

// extract name from student email (best effort)
export function extractNameFromEmail(email: string): string {
  const localPart = email.split('@')[0]
  // for student emails like 2024ugcs002, just return the email prefix
  return localPart
}
