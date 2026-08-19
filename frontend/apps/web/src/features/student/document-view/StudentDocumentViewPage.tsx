"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Expand,
  FileText,
  FolderOpen,
  GraduationCap,
  Play,
} from "lucide-react";
import { studentsApi } from "@repo/api";
import type {
  StudentDocumentProgress,
  StudentRelatedResource,
  StudentResourceDetail,
} from "@repo/types";

import type { DocumentViewerHandle } from "./DocumentViewer";

const DocumentViewer = dynamic(
  () => import("./DocumentViewer").then((module) => module.DocumentViewer),
  {
    loading: () => (
      <div className="student-document-viewer-loading">
        Loading document viewer…
      </div>
    ),
    ssr: false,
  },
);

export function StudentDocumentViewPage({
  resourceId,
}: {
  resourceId: number;
}) {
  const queryClient = useQueryClient();
  const viewerRef = useRef<DocumentViewerHandle>(null);
  const accessRecordedRef = useRef(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const detailQueryKey = ["student-resource", resourceId] as const;
  const detailQuery = useQuery({
    queryFn: () => studentsApi.findMyResource(resourceId),
    queryKey: detailQueryKey,
    staleTime: 30_000,
  });
  const fileQuery = useQuery({
    enabled: detailQuery.data?.resourceType.code === "DOCUMENT",
    queryFn: () => studentsApi.findMyResourceFile(resourceId),
    queryKey: ["student-resource-file", resourceId],
    staleTime: Number.POSITIVE_INFINITY,
  });
  const accessMutation = useMutation({
    mutationFn: () => studentsApi.recordMyResourceAccess(resourceId),
    onSuccess: (progress) => {
      queryClient.setQueryData<StudentResourceDetail>(
        detailQueryKey,
        (current) => (current ? { ...current, progress } : current),
      );
    },
  });

  const recordAccess = () => {
    if (accessRecordedRef.current) return;
    accessRecordedRef.current = true;
    accessMutation.mutate();
  };

  if (detailQuery.isLoading) {
    return <DocumentPageSkeleton />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="student-document-state-card" role="alert">
        <FileText aria-hidden="true" size={28} />
        <h1>Document unavailable</h1>
        <p>
          This resource may not exist, may not be published, or may not belong
          to one of your enrolled courses.
        </p>
        <div>
          <button onClick={() => void detailQuery.refetch()} type="button">
            Try again
          </button>
          <Link href="/student/resources">Back to resources</Link>
        </div>
      </div>
    );
  }

  const resource = detailQuery.data;

  return (
    <main className="student-document-page">
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

      <div className="student-document-layout">
        <section
          className="student-document-main-column"
          aria-label="Document viewer"
        >
          {fileQuery.isLoading ? (
            <div className="student-document-viewer-loading">
              Loading document…
            </div>
          ) : fileQuery.isError || !fileQuery.data ? (
            <div className="student-document-file-error" role="alert">
              <FileText aria-hidden="true" size={28} />
              <strong>Unable to load this PDF</strong>
              <span>The document storage could not be reached.</span>
              <button onClick={() => void fileQuery.refetch()} type="button">
                Retry document
              </button>
            </div>
          ) : (
            <DocumentViewer
              data={fileQuery.data}
              fileName={resource.fileName}
              isDownloadable={resource.isDownloadable}
              onDocumentLoaded={recordAccess}
              onPageCountChange={setPageCount}
              ref={viewerRef}
            />
          )}

          <ResourceSequence resource={resource} />
        </section>

        <aside
          className="student-document-side-column"
          aria-label="Document information"
        >
          <DocumentDetailsCard resource={resource} pageCount={pageCount} />
          <ReadingProgressCard progress={resource.progress} />
          <section className="student-document-card student-document-actions-card">
            <h2>Quick Actions</h2>
            <div>
              {resource.isDownloadable ? (
                <button
                  onClick={() => viewerRef.current?.download()}
                  type="button"
                >
                  <Download aria-hidden="true" size={16} />
                  Download PDF
                </button>
              ) : null}
              <button
                onClick={() => viewerRef.current?.enterFullscreen()}
                type="button"
              >
                <Expand aria-hidden="true" size={16} />
                Open in Full Screen
              </button>
            </div>
          </section>
          <RelatedResourcesCard resources={resource.relatedResources} />
        </aside>
      </div>
    </main>
  );
}

function DocumentDetailsCard({
  pageCount,
  resource,
}: {
  pageCount: number | null;
  resource: StudentResourceDetail;
}) {
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
}

function DetailRow({
  Icon,
  label,
  value,
}: {
  Icon: typeof FileText;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt>
        <Icon aria-hidden="true" size={14} /> {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReadingProgressCard({
  progress,
}: {
  progress: StudentDocumentProgress;
}) {
  const percentage = Math.max(0, Math.min(100, progress.percentage));
  return (
    <section className="student-document-card student-document-progress-card">
      <h2>Reading Progress</h2>
      <div className="student-document-progress-content">
        <div
          aria-label={`${percentage}% course progress`}
          className="student-document-progress-ring"
          style={
            { "--progress": `${percentage * 3.6}deg` } as React.CSSProperties
          }
        >
          <div>
            <strong>{percentage}%</strong>
            <span>Read</span>
          </div>
        </div>
        <div className="student-document-progress-copy">
          <span>Last opened</span>
          <strong>{formatLastOpened(progress.lastOpenedAt)}</strong>
          <div aria-hidden="true">
            <span style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function RelatedResourcesCard({
  resources,
}: {
  resources: StudentRelatedResource[];
}) {
  return (
    <section className="student-document-card student-document-related-card">
      <div className="student-document-card-heading">
        <h2>Related Resources</h2>
        <Link href="/student/resources">
          View All <ChevronRight size={13} />
        </Link>
      </div>
      {resources.length ? (
        <ul>
          {resources.map((resource) => (
            <li key={resource.id}>
              <span className={resource.resourceType.code.toLowerCase()}>
                {resource.resourceType.code === "VIDEO" ? (
                  <Play size={13} />
                ) : (
                  <FileText size={13} />
                )}
              </span>
              {resource.resourceType.code === "DOCUMENT" ? (
                <Link href={`/student/resources/${resource.id}`}>
                  {resource.title}
                </Link>
              ) : resource.resourceType.code === "VIDEO" ? (
                <Link href={`/student/resources/${resource.id}/video`}>
                  {resource.title}
                </Link>
              ) : (
                <span>{resource.title}</span>
              )}
              <small>{resource.resourceType.name}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="student-document-related-empty">
          No other published resources are available in this subject.
        </p>
      )}
    </section>
  );
}

function ResourceSequence({ resource }: { resource: StudentResourceDetail }) {
  return (
    <nav aria-label="Document sequence" className="student-document-sequence">
      {resource.navigation.previous ? (
        <Link href={`/student/resources/${resource.navigation.previous.id}`}>
          <ChevronLeft aria-hidden="true" size={15} /> Previous Resource
        </Link>
      ) : (
        <span />
      )}
      <strong>
        Resource {resource.navigation.current} of {resource.navigation.total}
      </strong>
      {resource.navigation.next ? (
        <Link
          className="is-next"
          href={`/student/resources/${resource.navigation.next.id}`}
        >
          Next Resource <ChevronRight aria-hidden="true" size={15} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function ProgressBadge({
  status,
}: {
  status: StudentDocumentProgress["status"];
}) {
  return (
    <span className={`student-document-status ${status.toLowerCase()}`}>
      {formatEnum(status)}
    </span>
  );
}

function DocumentPageSkeleton() {
  return (
    <div
      className="student-document-page student-document-skeleton"
      aria-label="Loading document"
    >
      <div className="student-document-skeleton-title" />
      <div className="student-document-layout">
        <div className="student-document-skeleton-viewer" />
        <div className="student-document-side-column">
          {[1, 2, 3, 4].map((item) => (
            <div className="student-document-skeleton-card" key={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLastOpened(value: string | null) {
  if (!value) return "Not opened yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
