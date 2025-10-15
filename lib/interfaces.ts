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
