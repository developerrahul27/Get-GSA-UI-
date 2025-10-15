import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function inRange(value: number, min?: number, max?: number) {
  if (min != null && value < min) return false
  if (max != null && value > max) return false
  return true
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

export function formatDue(dueISO: string) {
  const due = new Date(dueISO)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const rel = diffDays >= 0 ? `${diffDays}d left` : `${Math.abs(diffDays)}d past due`
  return `${rel} • ${due.toLocaleDateString()}`
}

export function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => r.json())
}
