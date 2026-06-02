import ThreadBoard from "@/components/platform/ThreadBoard"

export default function ForumsPage() {
  return (
    <ThreadBoard
      kind="discussion"
      basePath="/platform/forums"
      title="Forums"
      description="Course discussions for learners and trainers."
      emptyText="No topics yet. Start the first discussion above."
    />
  )
}
