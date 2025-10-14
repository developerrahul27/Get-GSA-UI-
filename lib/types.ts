
export type Application = {
  id: string
  title: string
  agency: string
  naics: string
  setAside: string[]
  vehicle: string
  dueDate: string 
  status: "Draft" | "Ready" | "Submitted" | "Awarded" | "Lost"
  percentComplete: number
  fitScore: number
  ceiling: number
  keywords: string[]
}

export type PeriodFilter =
  | { type: "none" }
  | { type: "next"; days: 30 | 60 | 90 }

export type Filters = {
  naics?: string
  setAside: string[]
  vehicle?: string
  agencies: string[]
  period: PeriodFilter
  ceilingMin?: number
  ceilingMax?: number
  keywords: string[]
  sortBy: "dueDate" | "percentComplete" | "fitScore"
  sortDir: "asc" | "desc"
  minFitScore?: number
}

export type Preset = {
  name: string
  filters: Filters
}
