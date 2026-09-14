import { StudentResourceDetail } from "@repo/types";
import Link from "next/link";

type DocumentPageHeaderProps = {
  resource: StudentResourceDetail;
};

const DocumentPageHeader = ({ resource }: DocumentPageHeaderProps) => {
  return (
    <header className="student-document-page-header">
      <h1>Document View</h1>
      <nav aria-label="Breadcrumb" className="student-document-breadcrumb">
        <Link href="/student/my-courses">My Courses</Link>
        <span>/</span>
        <Link href="/student/resources">{resource.course.name}</Link>
        <span>/</span>
        <Link href="/student/resources">Documents</Link>
        <span>/</span>
        <span title={resource.title}>{resource.title}</span>
      </nav>
    </header>
  );
};

export default DocumentPageHeader;
