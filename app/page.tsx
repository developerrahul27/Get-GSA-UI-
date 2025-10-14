"use client"

import { ParameterPanel } from "@/components/parameter-panel"
import { ResultsList } from "@/components/results-list"
import { ProgressDashboard } from "@/components/progress-dashboard"
import { Toaster } from "@/components/ui/toaster"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-screen-2xl p-4 md:p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-pretty text-2xl md:text-3xl font-semibold">GSA Opportunity Finder</h1>
          <p className="text-sm text-muted-foreground">
            Filter and review opportunities, track progress, and act quickly.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <aside className="md:col-span-1">
          <ParameterPanel />
        </aside>
        <section aria-labelledby="results-title" className="md:col-span-2 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-3">
              <ProgressDashboard />
            </div>
          </div>
          <h2 id="results-title" className="text-lg md:text-xl font-semibold">
            Results
          </h2>
          <ResultsList />
        </section>
      </div>

      <Toaster />
    </main>
  )
}
