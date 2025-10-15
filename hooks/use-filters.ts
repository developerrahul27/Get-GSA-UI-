"use client"

import React, { useCallback, useEffect, useMemo, useState, createContext, useContext } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { Filters, Preset } from "@/lib/types"
import { PRESETS_KEY, LAST_VIEW_KEY, STATUS_OVERRIDES_KEY } from "@/lib/constants"

function sanitizePeriod(p: Filters["period"] | null | undefined): Filters["period"] {
  if (!p) return { type: "none" }
  if (p.type === "none") return { type: "none" }
  if (p.type === "next") {
    const d = p.days
    if (d === 30 || d === 60 || d === 90) return { type: "next", days: d }
  }
  return { type: "none" }
}

function sanitizeFilters(f: Filters): Filters {
  return { ...f, period: sanitizePeriod(f.period) }
}

const DEFAULT_FILTERS: Filters = {
  naics: undefined,
  setAside: [],
  vehicle: undefined,
  agencies: [],
  period: { type: "none" },
  ceilingMin: undefined,
  ceilingMax: undefined,
  keywords: [],
  sortBy: "dueDate",
  sortDir: "asc",
}


export type StatusOverrides = Record<string, "Draft" | "Ready" | "Submitted" | "Awarded" | "Lost">

function parseQueryToFilters(sp: URLSearchParams): Filters {
  const q = (key: string) => sp.get(key) ?? undefined
  const list = (key: string) => (sp.get(key) ? sp.get(key)!.split(",").filter(Boolean) : [])
  const num = (key: string) => (sp.get(key) ? Number(sp.get(key)) : undefined)

  const periodParam = q("period")
  let period: Filters["period"] = { type: "none" }
  if (periodParam?.startsWith("next:")) {
    const days = Number(periodParam.split(":")[1])
    if (days === 30 || days === 60 || days === 90) period = { type: "next", days }
  }

  return {
    naics: q("naics"),
    setAside: list("setAside"),
    vehicle: q("vehicle"),
    agencies: list("agencies"),
    period,
    ceilingMin: num("cMin"),
    ceilingMax: num("cMax"),
    keywords: list("kw"),
    sortBy: (q("sortBy") as Filters["sortBy"]) || "dueDate",
    sortDir: (q("sortDir") as Filters["sortDir"]) || "asc",
    minFitScore: num("minFit"),
  }
}

function filtersToQuery(f: Filters): Record<string, string> {
  const out: Record<string, string> = {}
  if (f.naics) out.naics = f.naics
  if (f.setAside.length) out.setAside = f.setAside.join(",")
  if (f.vehicle) out.vehicle = f.vehicle
  if (f.agencies.length) out.agencies = f.agencies.join(",")
  if (f.ceilingMin != null) out.cMin = String(f.ceilingMin)
  if (f.ceilingMax != null) out.cMax = String(f.ceilingMax)
  if (f.keywords.length) out.kw = f.keywords.join(",")
  out.sortBy = f.sortBy
  out.sortDir = f.sortDir
  if (f.period.type === "next") out.period = `next:${f.period.days}`
  if (f.minFitScore != null) out.minFit = String(f.minFitScore)
  return out
}

function useFiltersImpl() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [draft, setDraft] = useState<Filters>(() => {
    const fromUrl = parseQueryToFilters(new URLSearchParams(searchParams?.toString()))
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(LAST_VIEW_KEY) : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Filters
        const safePeriod = sanitizePeriod(fromUrl.period ?? parsed.period)
        return { ...DEFAULT_FILTERS, ...parsed, ...fromUrl, period: safePeriod }
      } catch {}
    }
    const safePeriod = sanitizePeriod(fromUrl.period ?? { type: "none" })
    return { ...DEFAULT_FILTERS, ...fromUrl, period: safePeriod }
  })
  const [applied, setApplied] = useState<Filters>(draft)
  const [isApplying, setIsApplying] = useState(false)
  const [presets, setPresets] = useState<Preset[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = window.localStorage.getItem(PRESETS_KEY)
      return raw ? (JSON.parse(raw) as Preset[]) : []
    } catch {
      return []
    }
  })
  const [statusOverrides, setStatusOverrides] = useState<StatusOverrides>(() => {
    if (typeof window === "undefined") return {}
    try {
      const raw = window.localStorage.getItem(STATUS_OVERRIDES_KEY)
      return raw ? (JSON.parse(raw) as StatusOverrides) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(LAST_VIEW_KEY, JSON.stringify(draft))
    } catch {}
  }, [draft])

  const apply = useCallback((next?: Filters) => {
    const target = next ?? draft
    setIsApplying(true)
    const delay = 300 + Math.floor(Math.random() * 300)
    const q = new URLSearchParams(filtersToQuery(target))
    setTimeout(() => {
      setApplied(target)
      setIsApplying(false)
      router.replace(`${pathname}?${q.toString()}`)
    }, delay)
  }, [draft, pathname, router])

  const resetAll = useCallback(() => {
    setDraft(DEFAULT_FILTERS)
  }, [])

  const savePreset = useCallback(
    (name: string) => {
      const next = [...presets.filter((p) => p.name !== name), { name, filters: draft }]
      setPresets(next)
      try {
        window.localStorage.setItem(PRESETS_KEY, JSON.stringify(next))
      } catch {}
    },
    [draft, presets],
  )

  const loadPreset = useCallback(
    (name: string) => {
      const p = presets.find((x) => x.name === name)
      if (p) setDraft(sanitizeFilters(p.filters))
    },
    [presets],
  )

  const markSubmitted = useCallback((id: string) => {
    setStatusOverrides((prev) => {
      const next: StatusOverrides = { ...prev, [id]: "Submitted" }
      try {
        window.localStorage.setItem(STATUS_OVERRIDES_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  return {
    draft,
    setDraft,
    applied,
    isApplying,
    apply,
    resetAll,
    presets,
    savePreset,
    loadPreset,
    statusOverrides,
    markSubmitted,
  }
}

type FiltersContextValue = ReturnType<typeof useFiltersImpl>
const FiltersContext = createContext<FiltersContextValue | null>(null)

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const value = useFiltersImpl()
  const memoValue = useMemo(() => value, [value.draft, value.applied, value.isApplying, value.presets, value.statusOverrides])
  return React.createElement(FiltersContext.Provider, { value: memoValue, children })
}
export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (ctx) return ctx
  return useFiltersImpl()
}
