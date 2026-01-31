import type { ComplaintStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: ComplaintStatus
  className?: string
}

const statusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  resolved: {
    label: "Resolved",
    className: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
  },
  escalated: {
    label: "Escalated",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
