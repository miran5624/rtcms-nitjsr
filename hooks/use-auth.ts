'use client'

// auth hook to manage user session
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/lib/types'

export function useAuth(requiredRole?: string | string[]) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const stored = sessionStorage.getItem('user')
    
    if (!stored) {
      router.push('/login')
      return
    }
    
    try {
      const parsed = JSON.parse(stored) as User
      
      // check role if required
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        if (!roles.includes(parsed.role)) {
          router.push('/login')
          return
        }
      }
      
      setUser(parsed)
    } catch {
      sessionStorage.removeItem('user')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router, requiredRole])
  
  const logout = () => {
    sessionStorage.removeItem('user')
    router.push('/login')
  }
  
  return { user, loading, logout }
}
