import { useState, type ReactNode } from "react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { FileSpreadsheet, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  learnerImportRowSchema,
  type LearnerImportRow,
} from "@/lib/validations/learner.schema"
import { useCreateLearners } from "@/lib/queries/learners.queries"

function normaliseRow(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k.trim().toLowerCase().replace(/\s+/g, "_")] = String(v ?? "").trim()
  }
  return out
}

export default function ImportLearnersDialog({
  children,
}: {
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [parsing, setParsing] = useState(false)
  const create = useCreateLearners()

  async function handleFile(file: File) {
    setParsing(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array" })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

      const valid: LearnerImportRow[] = []
      let invalid = 0
      for (const row of raw) {
        const parsed = learnerImportRowSchema.safeParse(normaliseRow(row))
        if (parsed.success) valid.push(parsed.data)
        else invalid += 1
      }

      if (valid.length === 0) {
        toast.error("Nothing to import", {
          description:
            "No valid rows found. Expected columns: email, first_name, last_name, phone.",
        })
        return
      }

      const result = await create.mutateAsync(valid)
      const failed = result.errors.length
      toast.success("Import complete", {
        description: `${result.created} added${
          failed ? `, ${failed} failed` : ""
        }${invalid ? `, ${invalid} invalid rows skipped` : ""}.`,
      })
      setOpen(false)
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Unexpected error",
      })
    } finally {
      setParsing(false)
    }
  }

  const busy = parsing || create.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Import learners</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file. Columns: email (required), first_name,
            last_name, phone.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border py-10 text-center transition-colors hover:border-primary/50 focus-within:ring-2 focus-within:ring-[#d4a843]">
          {busy ? (
            <Loader2 className="size-8 animate-spin text-primary" />
          ) : (
            <FileSpreadsheet className="size-8 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {busy ? "Importing…" : "Click to choose a .csv or .xlsx file"}
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ""
            }}
          />
        </label>

        <p className="text-xs text-muted-foreground">
          Each learner gets an account and sets their own password via the
          forgot-password flow.
        </p>
      </DialogContent>
    </Dialog>
  )
}
