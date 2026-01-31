'use client'

import { useEffect, useCallback } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'sonner'

const SOCKET_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
    ? String(process.env.NEXT_PUBLIC_API_URL).replace(/\/api\/?$/, '')
    : 'http://localhost:4000'

export function useSocketComplaints(onRefresh: () => void) {
  const refresh = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  useEffect(() => {
    const socket = io(SOCKET_URL)

    socket.on('new_complaint', (data: { title?: string }) => {
      toast.success('New complaint', {
        description: data?.title ? `"${data.title}" was submitted.` : 'A new complaint has been filed.',
      })
      refresh()
    })

    socket.on('complaint_status_change', (data: { title?: string; status?: string }) => {
      toast.info('Complaint updated', {
        description: data?.title
          ? `"${data.title}" status: ${data.status ?? 'updated'}`
          : 'A complaint status has changed.',
      })
      refresh()
    })

    return () => {
      socket.disconnect()
    }
  }, [refresh])
}
