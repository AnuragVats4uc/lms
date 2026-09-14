"use client";

import { useRef } from "react";

import { DocumentMainContent } from "./components/DocumentMainContent";
import DocumentPageHeader from "./components/DocumentPageHeader";
import { DocumentSidebar } from "./components/DocumentSidebar";
import { DocumentPageSkeleton } from "./components/states/DocumentPageSkeleton";
import { DocumentUnavailableState } from "./components/states/DocumentUnavailableState";
import type { DocumentViewerHandle } from "./components/viewer/types";
import { useDocumentActivityTracking } from "./hooks/useDocumentActivityTracking";
import { useStudentDocument } from "./hooks/useStudentDocument";
import type { StudentDocumentViewPageProps } from "./types";

export const StudentDocumentViewPage = ({
  resourceId,
}: StudentDocumentViewPageProps) => {
  const viewerRef = useRef<DocumentViewerHandle>(null);
  const document = useStudentDocument(resourceId);
  const activity = useDocumentActivityTracking({
    enabled: Boolean(document.detailQuery.data && document.fileQuery.data),
    onProgressRefresh: document.refreshProgress,
    resourceId,
  });

  if (document.detailQuery.isLoading) {
    return <DocumentPageSkeleton />;
  }

  if (document.detailQuery.isError || !document.detailQuery.data) {
    return (
      <DocumentUnavailableState
        onRetry={() => void document.detailQuery.refetch()}
      />
    );
  }

  const resource = document.detailQuery.data;

  return (
    <main className="student-document-page">
      <DocumentPageHeader resource={resource} />
      <div className="student-document-layout">
        <DocumentMainContent
          fileData={document.fileQuery.data}
          fileError={document.fileQuery.isError}
          fileLoading={document.fileQuery.isLoading}
          onDownload={activity.handleDownload}
          onFullscreenChange={activity.handleFullscreenChange}
          onPageChange={activity.handlePageChange}
          onPageCountChange={document.recordAccess}
          onRetryFile={() => void document.fileQuery.refetch()}
          resource={resource}
          viewerRef={viewerRef}
        />
        <DocumentSidebar
          pageCount={document.pageCount}
          resource={resource}
          viewerRef={viewerRef}
        />
      </div>
    </main>
  );
};
