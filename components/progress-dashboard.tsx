"use client"

import useSWR from "swr"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Application } from "@/lib/interfaces"
import { filterApplications } from "@/lib/filtering"
import { useFilters } from "@/hooks/use-filters"
import { cn, fetchJson } from "@/lib/utils"
import { STATUS_LIST } from "@/lib/constants"

const fetcher = (url: string) => fetchJson<Application[]>(url)

export function ProgressDashboard() {
  const { data } = useSWR<Application[]>("/data/applications.json", fetcher)
  const { applied, statusOverrides } = useFilters()

  const filtered = useMemo(() => {
    if (!data) return []
    const apps = data.map((a) => (statusOverrides[a.id] ? { ...a, status: statusOverrides[a.id]! } : a))
    return filterApplications(apps, applied)
  }, [data, applied, statusOverrides])

  const counts = useMemo(() => {
    const map: Record<string, number> = { Draft: 0, Ready: 0, Submitted: 0, Awarded: 0, Lost: 0 }
    for (const a of filtered) map[a.status] = (map[a.status] ?? 0) + 1
    return map
  }, [filtered])

  const total = filtered.length || 1
  const avgComplete = Math.round(filtered.reduce((s, a) => s + a.percentComplete, 0) / total)

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Progress Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          {STATUS_LIST.map((s) => (
            <div key={s} className="rounded-md border p-2 text-center">
              <div className="font-medium">{s}</div>
              <div className="text-2xl">{counts[s]}</div>
            </div>
          ))}
        </div>

        <div aria-label="Status distribution" className="h-3 w-full rounded-full overflow-hidden bg-muted">
          {STATUS_LIST.map((s) => {
            const pct = (counts[s] / (filtered.length || 1)) * 100
            return pct > 0 ? (
              <div
                key={s}
                style={{ width: `${pct}%` }}
                className={cn(
                  "h-full inline-block",
                  s === "Draft" && "bg-muted-foreground/30",
                  s === "Ready" && "bg-secondary",
                  s === "Submitted" && "bg-primary",
                  s === "Awarded" && "bg-green-600",
                  s === "Lost" && "bg-red-600",
                )}
              />
            ) : null
          })}
        </div>

        <div className="text-sm">
          Average % complete: <strong>{avgComplete}%</strong>
        </div>
      </CardContent>
    </Card>
  )
}
