import type { ComplaintStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: ComplaintStatus
  className?: string
}

const statusConfig: Record<
  ComplaintStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/[0.08] text-amber-700 dark:text-amber-400",
  },
  open: {
    label: "Open",
    className: "bg-orange-500/[0.08] text-orange-700 dark:text-orange-400",
  },
  claimed: {
    label: "Claimed",
    className: "bg-sky-500/[0.08] text-sky-700 dark:text-sky-400",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-indigo-500/[0.08] text-indigo-700 dark:text-indigo-400",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400",
  },
  escalated: {
    label: "Escalated",
    className: "bg-rose-500/[0.08] text-rose-700 dark:text-rose-400",
  },
  closed: {
    label: "Closed",
    className: "bg-zinc-500/[0.08] text-zinc-700 dark:text-zinc-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/[0.08] text-red-700 dark:text-red-400",
  },
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {config.label}
    </span>
  )
}
