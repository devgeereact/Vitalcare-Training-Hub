import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DataState, type QueryLike } from "@/components/common/DataState"

/**
 * The defect this component exists to prevent: an assessment whose questions
 * failed to load told the learner "this assessment has no questions yet",
 * blaming the administrator for a broken request.
 *
 * These tests pin the five states apart. If any of them starts falling through
 * to the empty state, that class of defect is back.
 */
function query<T>(partial: Partial<QueryLike<T>>): QueryLike<T> {
  return {
    isLoading: false,
    isError: false,
    error: undefined,
    data: undefined,
    ...partial,
  }
}

const EMPTY = <p>This assessment has no questions yet</p>

function renderState<T>(q: QueryLike<T>) {
  return render(
    <DataState query={q} resource="the questions" empty={EMPTY}>
      {(rows) => <p>{`loaded ${(rows as unknown[]).length}`}</p>}
    </DataState>,
  )
}

describe("DataState", () => {
  it("shows a loading state, not an empty one, while in flight", () => {
    renderState(query<string[]>({ isLoading: true }))
    expect(screen.getByRole("status")).toHaveTextContent("Loading")
    expect(screen.queryByText(/no questions yet/i)).not.toBeInTheDocument()
  })

  it("shows an error, not an empty state, when the request failed", () => {
    renderState(query<string[]>({ isError: true, error: { status: 500 } }))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not load the questions. Please try again.",
    )
    expect(screen.queryByText(/no questions yet/i)).not.toBeInTheDocument()
  })

  it("distinguishes a refusal from a fault", () => {
    renderState(query<string[]>({ isError: true, error: { status: 403 } }))
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You do not have permission to view the questions.",
    )
    expect(screen.queryByText(/please try again/i)).not.toBeInTheDocument()
  })

  it("offers a retry that calls refetch", async () => {
    const refetch = vi.fn()
    renderState(query<string[]>({ isError: true, error: { status: 500 }, refetch }))
    await userEvent.click(screen.getByRole("button", { name: /try again/i }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it("does not offer retry on a permission refusal", () => {
    renderState(query<string[]>({ isError: true, error: { status: 403 }, refetch: vi.fn() }))
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument()
  })

  it("shows the empty state only for a successful empty result", () => {
    renderState(query<string[]>({ data: [] }))
    expect(screen.getByText(/no questions yet/i)).toBeInTheDocument()
  })

  it("renders the children for a successful populated result", () => {
    renderState(query<string[]>({ data: ["a", "b"] }))
    expect(screen.getByText("loaded 2")).toBeInTheDocument()
  })

  it("treats undefined data as still loading, never as empty", () => {
    // A disabled or paused query settles with no data. Reading that as "empty"
    // is how a learner-scoped query that has not started yet ends up claiming
    // the learner has no certificates.
    renderState(query<string[]>({ data: undefined }))
    expect(screen.getByRole("status")).toHaveTextContent("Loading")
    expect(screen.queryByText(/no questions yet/i)).not.toBeInTheDocument()
  })

  it("accepts a custom emptiness test for object-shaped data", () => {
    render(
      <DataState
        query={query<{ items: string[] }>({ data: { items: [] } })}
        empty={<p>nothing</p>}
        isEmpty={(d) => d.items.length === 0}
      >
        {(d) => <p>{`loaded ${d.items.length}`}</p>}
      </DataState>,
    )
    expect(screen.getByText("nothing")).toBeInTheDocument()
  })

  it("never puts the raw database message on screen", () => {
    renderState(
      query<string[]>({
        isError: true,
        error: { code: "42P01", message: 'relation "learner_certificates" does not exist' },
      }),
    )
    expect(screen.queryByText(/learner_certificates/)).not.toBeInTheDocument()
  })
})
