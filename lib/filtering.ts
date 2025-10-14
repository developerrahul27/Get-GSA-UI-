import type { Application, Filters } from "./types"

const inRange = (value: number, min?: number, max?: number) => {
  if (min != null && value < min) return false
  if (max != null && value > max) return false
  return true
}

export function filterApplications(apps: Application[], f: Filters): Application[] {
  const now = new Date()

  return apps.filter((a) => {
    if (f.naics && a.naics !== f.naics) return false

    if (f.setAside.length > 0 && !f.setAside.some((s) => a.setAside.includes(s))) return false

    if (f.vehicle && a.vehicle !== f.vehicle) return false

    if (f.agencies.length > 0 && !f.agencies.includes(a.agency)) return false

    if (f.period.type === "next") {
      const due = new Date(a.dueDate)
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 0 || diffDays > f.period.days) return false
    }

    if (!inRange(a.ceiling, f.ceilingMin, f.ceilingMax)) return false

    if (f.minFitScore != null && a.fitScore < f.minFitScore) return false

    if (f.keywords.length > 0) {
      const title = a.title.toLowerCase()
      const kwSet = new Set(a.keywords.map((k) => k.toLowerCase()))
      const ok = f.keywords.some((kw) => {
        const k = kw.toLowerCase()
        return title.includes(k) || kwSet.has(k)
      })
      if (!ok) return false
    }

    return true
  })
}

export function sortApplications(apps: Application[], sortBy: Filters["sortBy"], dir: Filters["sortDir"]) {
  const dirMul = dir === "asc" ? 1 : -1
  const getVal = (a: Application) => {
    if (sortBy === "dueDate") return new Date(a.dueDate).getTime()
    if (sortBy === "percentComplete") return a.percentComplete
    return a.fitScore
  }
  return [...apps].sort((a, b) => (getVal(a) - getVal(b)) * dirMul)
}

export function highlightTitle(title: string, keywords: string[]) {
  if (keywords.length === 0) return [{ text: title, match: false }]
  const lower = title.toLowerCase()
  const matches = keywords
    .filter(Boolean)
    .map((k) => k.toLowerCase())
    .sort((a, b) => b.length - a.length)

  const parts: { text: string; match: boolean }[] = []
  let i = 0
  while (i < title.length) {
    let matched = ""
    for (const k of matches) {
      if (lower.slice(i).startsWith(k)) {
        matched = title.slice(i, i + k.length)
        break
      }
    }
    if (matched) {
      parts.push({ text: matched, match: true })
      i += matched.length
    } else {
      parts.push({ text: title[i]!, match: false })
      i += 1
    }
  }
  const merged: typeof parts = []
  for (const p of parts) {
    if (merged.length && !p.match && !merged[merged.length - 1]!.match) {
      merged[merged.length - 1]!.text += p.text
    } else {
      merged.push(p)
    }
  }
  return merged
}
