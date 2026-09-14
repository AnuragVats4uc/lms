import { StudentFolderResourceList } from "@repo/types";
import Link from "next/link";

type FolderResourceBreadcrumbProps = {
  data: NoInfer<StudentFolderResourceList> | undefined;
  sessionCourseId: number;
};

export const FolderResourceBreadcrumb = ({
  data,
  sessionCourseId,
}: FolderResourceBreadcrumbProps) => {
  return (
    <nav className="student-folder-breadcrumb" aria-label="Breadcrumb">
      <Link href="/student/my-courses">My Courses</Link>
      <span>/</span>
      {data ? (
        <Link href={`/student/my-courses/${sessionCourseId}`}>
          {data.course.name}
        </Link>
      ) : (
        <span>Course</span>
      )}
      {(data?.breadcrumbs ?? []).map((breadcrumb, index, breadcrumbs) => (
        <span key={breadcrumb.id}>
          <span>/</span>{" "}
          {index === breadcrumbs.length - 1 ? (
            <span>{breadcrumb.name}</span>
          ) : (
            <Link
              href={`/student/my-courses/${sessionCourseId}/folders/${breadcrumb.id}`}
            >
              {breadcrumb.name}
            </Link>
          )}
        </span>
      ))}
      {!data ? (
        <>
          <span>/</span>
          <span>Folder</span>
        </>
      ) : null}
    </nav>
  );
};
