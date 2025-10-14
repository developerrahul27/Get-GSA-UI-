"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { filterApplications, highlightTitle, sortApplications } from "@/lib/filtering"
import type { Application } from "@/lib/types"
import { useFilters } from "@/hooks/use-filters"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatDue(dueISO: string) {
  const due = new Date(dueISO)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const rel = diffDays >= 0 ? `${diffDays}d left` : `${Math.abs(diffDays)}d past due`
  return `${rel} • ${due.toLocaleDateString()}`
}

export function ResultsList() {
  const { data, isLoading } = useSWR<Application[]>("/data/applications.json", fetcher)
  const { draft, setDraft, apply, applied, isApplying, statusOverrides, markSubmitted } = useFilters()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Application | null>(null)
  const { toast } = useToast()

  const apps = useMemo(() => {
    if (!data) return []
    return data.map((a) => (statusOverrides[a.id] ? { ...a, status: statusOverrides[a.id]! } : a))
  }, [data, statusOverrides])

  const filtered = useMemo(() => {
    const f = filterApplications(apps, applied)
    return sortApplications(f, applied.sortBy, applied.sortDir)
  }, [apps, applied])

  const loading = isLoading || isApplying

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4" aria-busy="true" aria-live="polite">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border h-full">
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!filtered.length) {
    return (
      <div className="rounded-md border p-6 text-center">
        <p className="font-medium">No matches found</p>
        <p className="text-sm text-muted-foreground">Try clearing some filters or expanding your date range.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Button
            size="sm"
            variant={applied.sortBy === 'dueDate' ? 'default' : 'outline'}
            aria-pressed={applied.sortBy === 'dueDate'}
            onClick={() => {
              const next = { ...draft, sortBy: 'dueDate' as const }
              setDraft(next)
              apply(next)
            }}
          >
            Due date
          </Button>
          <Button
            size="sm"
            variant={applied.sortBy === 'percentComplete' ? 'default' : 'outline'}
            aria-pressed={applied.sortBy === 'percentComplete'}
            onClick={() => {
              const next = { ...draft, sortBy: 'percentComplete' as const }
              setDraft(next)
              apply(next)
            }}
          >
            % complete
          </Button>
          <Button
            size="sm"
            variant={applied.sortBy === 'fitScore' ? 'default' : 'outline'}
            aria-pressed={applied.sortBy === 'fitScore'}
            onClick={() => {
              const next = { ...draft, sortBy: 'fitScore' as const }
              setDraft(next)
              apply(next)
            }}
          >
            Fit Score
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Export visible results to CSV"
            onClick={() => {
              const rows = [
                [
                  'ID','Title','Agency','NAICS','SetAside','Vehicle','DueDate','Status','PercentComplete','FitScore','Ceiling'
                ],
                ...filtered.map(a => [
                  a.id,
                  a.title,
                  a.agency,
                  a.naics,
                  a.setAside.join('|'),
                  a.vehicle,
                  a.dueDate,
                  a.status,
                  String(a.percentComplete),
                  String(a.fitScore),
                  String(a.ceiling),
                ])
              ]
              const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'results.csv'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
            }}
          >
            Export CSV
          </Button>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:gap-4">
        {filtered.map((a) => (
          <li key={a.id} className="min-w-0">
            <Card className="border hover:shadow-sm focus-within:ring h-full">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="text-balance text-base sm:text-lg leading-snug break-words">
                  <button
                    className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded break-words"
                    onClick={() => {
                      setActive(a)
                      setOpen(true)
                    }}
                    aria-haspopup="dialog"
                    aria-controls="details-drawer"
                  >
                    {highlightTitle(a.title, applied.keywords).map((p, i) =>
                      p.match ? (
                        <mark key={i} className="bg-yellow-200 text-foreground px-1 rounded">
                          {p.text}
                        </mark>
                      ) : (
                        <span key={i}>{p.text}</span>
                      ),
                    )}
                  </button>
                </CardTitle>
                <div className="text-sm text-muted-foreground break-words">
                  {a.agency} • NAICS {a.naics} • {a.vehicle}
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3 md:items-center">
                <div className="flex items-center gap-2 flex-nowrap overflow-x-auto sm:flex-wrap">
                  {a.setAside.map((s) => (
                    <Badge key={s} variant="secondary" className="rounded-full text-[11px] sm:text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs sm:text-sm order-3 md:order-none">{formatDue(a.dueDate)}</div>
                <div className="flex flex-wrap items-center justify-between gap-3 w-full md:justify-end">
                  <div className="text-xs sm:text-sm whitespace-nowrap tabular-nums">
                    % complete: <strong>{a.percentComplete}%</strong> • Fit: <strong>{a.fitScore}</strong>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full",
                      a.status === "Draft" && "bg-muted text-foreground",
                      a.status === "Ready" && "bg-yellow-500 text-black",
                      a.status === "Submitted" && "bg-primary text-primary-foreground",
                      a.status === "Awarded" && "bg-green-600 text-white",
                      a.status === "Lost" && "bg-red-600 text-white",
                    )}
                  >
                    {a.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent id="details-drawer" className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{active?.title}</DrawerTitle>
            <DrawerDescription>
              {active?.agency} • NAICS {active?.naics} • {active?.vehicle}
            </DrawerDescription>
          </DrawerHeader>
          {active && (
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Summary: A brief synopsis of the opportunity based on the title and agency.
              </p>
              <div aria-label="Stage timeline" className="flex items-center gap-2">
                {["Draft", "Ready", "Submitted", active.status === "Awarded" ? "Awarded" : "Lost"].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        s === "Awarded" ? "bg-green-600" : s === "Lost" ? "bg-red-600" : "bg-primary",
                      )}
                    />
                    <span className="text-sm">{s}</span>
                    {i < 3 && <div className="h-px w-6 bg-border" />}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (active) {
                      markSubmitted(active.id)
                      toast({ title: "Marked as Submitted", description: `${active.title} moved to Submitted.` })
                      setOpen(false)
                    }
                  }}
                >
                  Mark as Submitted
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
