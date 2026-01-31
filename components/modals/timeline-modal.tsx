'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, CheckCircle2, Circle, Clock } from 'lucide-react'
import { api } from '@/lib/services/api'
import { format } from 'date-fns'

interface TimelineEvent {
    type: 'created' | 'update' | 'resolved' | 'rejected' | 'claimed'
    title: string;
    description?: string;
    timestamp: string;
}

interface TimelineModalProps {
    complaintId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TimelineModal({ complaintId, open, onOpenChange }: TimelineModalProps) {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && complaintId) {
            setLoading(true)
            api.get<TimelineEvent[]>(`/complaints/${complaintId}/timeline`)
                .then(res => setEvents(res.data))
                .catch(() => setEvents([]))
                .finally(() => setLoading(false))
        }
    }, [open, complaintId])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Complaint Timeline</DialogTitle>
                    <DialogDescription>Track the progress of your complaint</DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="relative space-y-8 pl-2 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-20px)] before:w-[2px] before:bg-muted">
                            {events.map((event, index) => {
                                const isLast = index === events.length - 1;
                                // Determine icon and color
                                let Icon = CheckCircle2;
                                let color = "text-green-600 bg-white";

                                if (event.type === 'resolved') {
                                    color = "text-green-600 bg-green-50";
                                } else if (event.type === 'rejected') {
                                    Icon = Circle;
                                    color = "text-red-600 bg-red-50";
                                } else if (event.type === 'update') {
                                    Icon = Clock;
                                    color = "text-blue-600 bg-white";
                                } else if (event.type === 'created') {
                                    Icon = CheckCircle2;
                                    color = "text-primary bg-primary/10";
                                }

                                return (
                                    <div key={index} className="relative flex gap-4">
                                        <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background ${color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="-mt-1 flex-1">
                                            <p className="font-medium leading-none">{event.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(event.timestamp), "MMM d, h:mm a")}
                                            </p>
                                            {event.description && (
                                                <p className="mt-2 text-sm text-muted-foreground bg-muted/40 p-2 rounded-md">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            {events.length === 0 && !loading && (
                                <p className="text-center text-muted-foreground">No updates found.</p>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
