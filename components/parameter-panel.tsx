"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useFilters } from "@/hooks/use-filters"
import type { Filters } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ALL_NAICS, ALL_SET_ASIDE, ALL_VEHICLE, ALL_AGENCIES } from "@/lib/constants"

export function ParameterPanel() {
  const { draft, setDraft, apply, resetAll, presets, savePreset, loadPreset } = useFilters()
  const { toast } = useToast()
  const [kwInput, setKwInput] = useState("")
  const debouncer = useRef<NodeJS.Timeout | null>(null)
  const ceilingInvalid =
    draft.ceilingMin != null && draft.ceilingMax != null && draft.ceilingMin > draft.ceilingMax
  const [saveOpen, setSaveOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const duplicatePreset = presets.some((p) => p.name.trim().toLowerCase() === presetName.trim().toLowerCase())

  function onKwChange(v: string) {
    setKwInput(v)
    if (debouncer.current) clearTimeout(debouncer.current)
    debouncer.current = setTimeout(() => {
    }, 300)
  }

  function addKeywordsFromInput() {
    const parts = kwInput
      .split(/[,\s]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (!parts.length) return
    setDraft({ ...draft, keywords: Array.from(new Set([...draft.keywords, ...parts])) })
    setKwInput("")
  }

  function removeKeyword(k: string) {
    setDraft({ ...draft, keywords: draft.keywords.filter((x) => x !== k) })
  }

  function toggleSetAside(s: string) {
    const exists = draft.setAside.includes(s)
    setDraft({ ...draft, setAside: exists ? draft.setAside.filter((x) => x !== s) : [...draft.setAside, s] })
  }

  function toggleAgency(a: string) {
    const exists = draft.agencies.includes(a)
    setDraft({ ...draft, agencies: exists ? draft.agencies.filter((x) => x !== a) : [...draft.agencies, a] })
  }

  function onSavePresetConfirm() {
    const name = presetName.trim()
    if (!name) {
      toast({ title: "Name required", description: "Please enter a preset name.", duration: 2000 })
      return
    }
    savePreset(name)
    toast({ title: duplicatePreset ? "Preset overwritten" : "Preset saved", description: `Saved "${name}"`, duration: 2000 })
    setSaveOpen(false)
    setPresetName("")
  }

  return (
    <section aria-labelledby="filters-title" className="space-y-6">
      <h2 id="filters-title" className="text-pretty text-lg md:text-xl font-semibold">
        Search Parameters
      </h2>

      <div className="grid gap-2">
        <Label htmlFor="naics">NAICS</Label>
        <Select value={draft.naics ?? ""} onValueChange={(v) => setDraft({ ...draft, naics: v || undefined })}>
          <SelectTrigger id="naics" aria-label="Select NAICS code">
            <SelectValue placeholder="Choose NAICS" />
          </SelectTrigger>
          <SelectContent>
            {ALL_NAICS.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Dialog open={saveOpen} onOpenChange={(o) => { setSaveOpen(o); if (!o) setPresetName("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save preset</DialogTitle>
            <DialogDescription>Enter a name to save the current filters.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="preset-name">Preset name</Label>
            <Input
              id="preset-name"
              placeholder="e.g., USDA Cloud Next 30d"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  onSavePresetConfirm()
                }
              }}
              aria-describedby="preset-help"
            />
            {duplicatePreset && (
              <p id="preset-help" className="text-sm text-destructive">A preset with this name exists. Saving will overwrite it.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={onSavePresetConfirm} disabled={!presetName.trim()}>
              {duplicatePreset ? "Overwrite" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-2">
        <Label>Set-Aside</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_SET_ASIDE.map((s) => (
            <button
              key={s}
              onClick={() => toggleSetAside(s)}
              className={cn(
                "rounded-full px-3 py-1 text-sm border",
                draft.setAside.includes(s)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
              aria-pressed={draft.setAside.includes(s)}
              aria-label={`Toggle ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="vehicle">Vehicle</Label>
        <Select value={draft.vehicle ?? ""} onValueChange={(v) => setDraft({ ...draft, vehicle: v || undefined })}>
          <SelectTrigger id="vehicle" aria-label="Select Vehicle">
            <SelectValue placeholder="Choose vehicle" />
          </SelectTrigger>
          <SelectContent>
            {ALL_VEHICLE.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Agency</Label>
        <div className="rounded-md border">
          <Command shouldFilter={true}>
            <CommandInput placeholder="Search agencies..." aria-label="Search agencies" />
            <CommandList>
              <CommandEmpty>No agencies found.</CommandEmpty>
              <CommandGroup heading="Agencies">
                {ALL_AGENCIES.map((a) => (
                  <CommandItem
                    key={a}
                    value={a}
                    onSelect={() => toggleAgency(a)}
                    aria-selected={draft.agencies.includes(a)}
                  >
                    <Checkbox className="mr-2" checked={draft.agencies.includes(a)} aria-label={`Select ${a}`} />
                    {a}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {draft.agencies.map((a) => (
            <Badge key={a} variant="secondary" className="rounded-full">
              <span className="mr-2">{a}</span>
              <button aria-label={`Remove ${a}`} onClick={() => toggleAgency(a)} className="text-xs">
                ✕
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Period</Label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDraft({ ...draft, period: { type: "none" } })}
            className={cn(
              "rounded-full px-3 py-1 text-sm border",
              draft.period.type === "none"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
            aria-pressed={draft.period.type === "none"}
          >
            None
          </button>
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDraft({ ...draft, period: { type: "next", days: d as 30 | 60 | 90 } })}
              className={cn(
                "rounded-full px-3 py-1 text-sm border",
                draft.period.type === "next" && draft.period.days === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
              aria-pressed={draft.period.type === "next" && draft.period.days === d}
            >
              Due in {d} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="cmin">Ceiling Min</Label>
          <Input
            id="cmin"
            type="number"
            inputMode="numeric"
            value={draft.ceilingMin ?? ""}
            onChange={(e) => setDraft({ ...draft, ceilingMin: e.target.value ? Number(e.target.value) : undefined })}
            aria-invalid={ceilingInvalid}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="cmax">Ceiling Max</Label>
          <Input
            id="cmax"
            type="number"
            inputMode="numeric"
            value={draft.ceilingMax ?? ""}
            onChange={(e) => setDraft({ ...draft, ceilingMax: e.target.value ? Number(e.target.value) : undefined })}
            aria-invalid={ceilingInvalid}
            aria-describedby="cmax-help"
          />
        </div>
        <p id="cmin-help" className={`col-span-2 text-sm ${ceilingInvalid ? "text-destructive" : "text-muted-foreground"}`}>
          {ceilingInvalid ? "Ceiling Min must be less than or equal to Ceiling Max." : "Ensure Min ≤ Max. Leave blank to skip."}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="keywords">Keywords</Label>
        <Input
          id="keywords"
          value={kwInput}
          onChange={(e) => onKwChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addKeywordsFromInput()
            }
          }}
          placeholder="Type and press Enter to add"
          aria-describedby="kw-help"
        />
        <div className="flex flex-wrap gap-2">
          {draft.keywords.map((k) => (
            <Badge key={k} variant="secondary" className="rounded-full">
              <span className="mr-2">{k}</span>
              <button aria-label={`Remove ${k}`} onClick={() => removeKeyword(k)} className="text-xs">
                ✕
              </button>
            </Badge>
          ))}
        </div>
        <p id="kw-help" className="text-sm text-muted-foreground">
          Free text; chipify on Enter.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor="sortBy">Sort By</Label>
          <Select value={draft.sortBy} onValueChange={(v: Filters["sortBy"]) => setDraft({ ...draft, sortBy: v })}>
            <SelectTrigger id="sortBy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due date</SelectItem>
              <SelectItem value="percentComplete">% complete</SelectItem>
              <SelectItem value="fitScore">Fit Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={() => apply()} aria-label="Apply filters" disabled={ceilingInvalid}>
          Apply
        </Button>
        <Button variant="outline" onClick={resetAll} aria-label="Reset all filters">
          Reset All
        </Button>
        <Button variant="secondary" onClick={() => setSaveOpen(true)} aria-label="Save preset">
          Save preset
        </Button>
        {presets.length > 0 && (
          <Select onValueChange={(name) => loadPreset(name)}>
            <SelectTrigger className="w-[200px]" aria-label="Load preset">
              <SelectValue placeholder="Load preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </section>
  )
}
