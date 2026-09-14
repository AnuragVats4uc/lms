import { StudentResourceDetail } from "@repo/types";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  GraduationCap,
} from "lucide-react";
import { formatDate } from "../utils/formatDocumentDate";
import { ProgressBadge } from "./ProgressBadge";

export const DetailRow = ({
  Icon,
  label,
  value,
}: {
  Icon: typeof FileText;
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div>
      <dt>
        <Icon aria-hidden="true" size={14} /> {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
};

export const DocumentDetailsCard = ({
  pageCount,
  resource,
}: {
  pageCount: number | null;
  resource: StudentResourceDetail;
}) => {
  return (
    <section className="student-document-card student-document-details-card">
      <div className="student-document-card-heading">
        <h2>
          <FileText aria-hidden="true" size={20} /> Document Details
        </h2>
        <span>Document</span>
      </div>
      <dl>
        <DetailRow
          Icon={GraduationCap}
          label="Course"
          value={resource.course.name}
        />
        <DetailRow
          Icon={FolderOpen}
          label="Subject"
          value={resource.subject.name}
        />
        <DetailRow
          Icon={CalendarDays}
          label="Uploaded On"
          value={formatDate(resource.createdAt)}
        />
        <DetailRow
          Icon={FileText}
          label="Total Pages"
          value={pageCount == null ? "—" : `${pageCount} pages`}
        />
        <DetailRow
          Icon={Clock3}
          label="Estimated Reading Time"
          value={
            resource.estimatedReadingMinutes == null
              ? "—"
              : `${resource.estimatedReadingMinutes} min`
          }
        />
        <DetailRow
          Icon={CheckCircle2}
          label="Status"
          value={<ProgressBadge status={resource.progress.status} />}
        />
      </dl>
    </section>
  );
};
