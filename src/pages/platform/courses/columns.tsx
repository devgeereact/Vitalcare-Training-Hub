import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { ArrowUpDown, Pencil, Eye, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CourseRow } from "@/lib/queries/courses.queries"
import DuplicateCourseButton from "@/pages/platform/courses/DuplicateCourseButton"
import PublishCourseButton from "@/pages/platform/courses/PublishCourseButton"

export const courseColumns: ColumnDef<CourseRow>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        to={`/platform/courses/builder/${row.original.id}`}
        className="font-medium text-foreground hover:text-primary hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  { accessorKey: "categoryName", header: "Category" },
  {
    accessorKey: "cstf",
    header: "CSTF",
    cell: ({ row }) =>
      row.original.cstf ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <ShieldCheck className="size-3.5" /> Aligned
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "cpdHours",
    header: "CPD",
    cell: ({ row }) => `${row.original.cpdHours}h`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          row.original.status === "Published"
            ? "bg-success/15 text-success"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {row.original.status}
      </span>
    ),
    filterFn: (row, id, value) => row.getValue(id) === value,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => format(new Date(row.original.updatedAt), "d MMM yyyy"),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button asChild variant="ghost" size="icon" className="size-8" aria-label="View course">
          <Link to={`/platform/courses/${row.original.id}`}>
            <Eye className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="size-8" aria-label="Edit course">
          <Link to={`/platform/courses/builder/${row.original.id}`}>
            <Pencil className="size-4" />
          </Link>
        </Button>
        <PublishCourseButton
          id={row.original.id}
          published={row.original.status === "Published"}
        />
        <DuplicateCourseButton id={row.original.id} />
      </div>
    ),
  },
]
