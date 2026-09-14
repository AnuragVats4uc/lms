import { StudentVideoResourceDetail } from "@repo/types";
import Link from "next/link";

export const VideoLessonBreadcrumb = ({
  resource,
}: {
  resource: StudentVideoResourceDetail;
}) => {
  return (
    <nav aria-label="Breadcrumb" className="student-video-breadcrumb">
      <Link href="/student/my-courses">My Courses</Link>
      <span>/</span>
      <Link href="/student/resources">{resource.course.sessionName}</Link>
      <span>/</span>
      <Link
        href={`/student/resources?search=${encodeURIComponent(resource.course.name)}`}
      >
        {resource.course.name}
      </Link>
      <span>/</span>
      <span title={resource.title}>{resource.title}</span>
    </nav>
  );
};
