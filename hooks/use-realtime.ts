"use client"

import { useEffect, useCallback, useRef } from "react"
import { mutate } from "swr"

// Simple polling-based real-time updates
// In production, this would be replaced with WebSocket or Server-Sent Events

interface UseRealtimeOptions {
  key: string
  interval?: number
  enabled?: boolean
}

export function useRealtime({ key, interval = 3000, enabled = true }: UseRealtimeOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const refresh = useCallback(() => {
    mutate(key)
  }, [key])

  useEffect(() => {
    if (!enabled) return

    intervalRef.current = setInterval(() => {
      refresh()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [key, interval, enabled, refresh])

  return { refresh }
}

// Event emitter for cross-component updates
type EventCallback = () => void
const listeners: Map<string, Set<EventCallback>> = new Map()

export function emitUpdate(event: string) {
  const eventListeners = listeners.get(event)
  if (eventListeners) {
    eventListeners.forEach((callback) => callback())
  }
}

export function useUpdateListener(event: string, callback: EventCallback) {
  useEffect(() => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(callback)

    return () => {
      listeners.get(event)?.delete(callback)
    }
  }, [event, callback])
}
