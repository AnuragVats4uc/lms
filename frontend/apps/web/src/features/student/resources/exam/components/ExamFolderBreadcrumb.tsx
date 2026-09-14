import { StudentExamResourceDetail } from "@repo/types";
import Link from "next/link";

type ExamFolderBreadcrumbProps = {
  data: StudentExamResourceDetail;
};

export const ExamFolderBreadcrumb = ({ data }: ExamFolderBreadcrumbProps) => {
  return (
    <nav className="student-folder-breadcrumb" aria-label="Breadcrumb">
      <Link href="/student/my-courses">My Courses</Link>
      <span>/</span>
      <Link href={`/student/my-courses/${data.course.id}`}>
        {data.course.name}
      </Link>
      <span>/</span>
      <Link
        href={`/student/my-courses/${data.course.id}/folders/${data.folder.id}`}
      >
        {data.folder.name}
      </Link>
      <span>/</span>
      <span>{data.title}</span>
    </nav>
  );
};
