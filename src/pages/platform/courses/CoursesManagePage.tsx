import MyCoursesPage from "./MyCoursesPage"

/**
 * Legacy /platform/courses/manage route. The "My Courses" and "All Courses"
 * surfaces have been consolidated into a single role-aware Courses page. This
 * keeps the old route resolving by rendering the unified page with the manage
 * (table) view open by default.
 */
export default function CoursesManagePage() {
  return <MyCoursesPage initialStaffView="manage" />
}
