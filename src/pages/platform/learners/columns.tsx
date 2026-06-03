import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { ArrowUpDown, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LearnerRow } from "@/lib/queries/learners.queries"

export const learnerColumns: ColumnDef<LearnerRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        to={`/platform/learners/${row.original.id}`}
        className="font-medium text-foreground hover:text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone || "-",
  },
  {
    accessorKey: "joined",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Joined <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.original.joined), "d MMM yyyy"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="inline-flex rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
        {row.original.status}
      </span>
    ),
    filterFn: (row, id, value) => row.getValue(id) === value,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button asChild variant="ghost" size="icon" className="size-8" aria-label="View learner">
          <Link to={`/platform/learners/${row.original.id}`}>
            <Eye className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]
