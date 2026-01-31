"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

interface Toast {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message?: string
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...toast, id }])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-[#10b981]" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    info: <Info className="h-5 w-5 text-primary" />,
    warning: <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />,
  }

  const bgColors = {
    success: "bg-[#10b981]/10 border-[#10b981]/20",
    error: "bg-destructive/10 border-destructive/20",
    info: "bg-primary/10 border-primary/20",
    warning: "bg-[#f59e0b]/10 border-[#f59e0b]/20",
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${bgColors[toast.type]} bg-card min-w-[300px] max-w-[400px] animate-in slide-in-from-right-full duration-300`}
    >
      {icons[toast.type]}
      <div className="flex-1">
        <p className="font-medium text-foreground">{toast.title}</p>
        {toast.message && <p className="mt-1 text-sm text-muted-foreground">{toast.message}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
