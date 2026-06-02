import ThreadBoard from "@/components/platform/ThreadBoard"

export default function QaWallPage() {
  return (
    <ThreadBoard
      kind="qa"
      basePath="/platform/qa"
      title="Q&A wall"
      description="Ask trainers a question; answers are marked for everyone to see."
      emptyText="No questions yet. Ask the first one above."
    />
  )
}
