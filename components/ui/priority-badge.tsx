import type { Priority } from "@/lib/types"

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
  },
  medium: {
    label: "Medium",
    className: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  },
  high: {
    label: "High",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

export function PriorityBadge({ priority, className = "" }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
