import Link from "next/link";

export const FolderBreadcrumb = ({ name }: { name: string }) => {
  return (
    <nav className="student-folder-breadcrumb" aria-label="Breadcrumb">
      <Link href="/student/my-courses">My Courses</Link>
      <span>/</span>
      <span>{name}</span>
    </nav>
  );
};
