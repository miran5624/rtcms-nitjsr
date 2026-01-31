// authentication utilities for nit jamshedpur complaint system

import type { UserRole } from './types'

// email patterns for role detection
const STUDENT_EMAIL_PATTERN = /^202[0-9]{2}[a-z]{4}[0-9]{3}@nitjsr\.ac\.in$/i
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
  
  // check admin patterns
  for (const suffix of ADMIN_EMAIL_SUFFIXES) {
    if (normalizedEmail.endsWith(suffix) || normalizedEmail === suffix) {
      return 'admin'
    }
  }
  
  // check student pattern
  if (STUDENT_EMAIL_PATTERN.test(normalizedEmail)) {
    return 'student'
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
