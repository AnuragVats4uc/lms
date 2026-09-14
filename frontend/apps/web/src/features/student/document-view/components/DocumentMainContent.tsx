import dynamic from "next/dynamic";
import type { RefObject } from "react";
import type { StudentResourceDetail } from "@repo/types";

import type { DocumentViewerHandle } from "./viewer/types";
import { ResourceSequence } from "./ResourceSequence";
import { DocumentFileErrorState } from "./states/DocumentFileErrorState";
import { DocumentFileLoadingState } from "./states/DocumentFileLoadingState";

const DocumentViewer = dynamic(
  () =>
    import("./viewer/DocumentViewer").then((module) => module.DocumentViewer),
  {
    loading: () => (
      <div className="student-document-viewer-loading">
        Loading document viewer…
      </div>
    ),
    ssr: false,
  },
);

type DocumentMainContentProps = {
  fileData?: ArrayBuffer;
  fileError: boolean;
  fileLoading: boolean;
  onDownload: () => void;
  onFullscreenChange: (fullscreen: boolean) => void;
  onPageChange: (pageNumber: number) => void;
  onPageCountChange: (pageCount: number) => void;
  onRetryFile: () => void;
  resource: StudentResourceDetail;
  viewerRef: RefObject<DocumentViewerHandle | null>;
};

export const DocumentMainContent = ({
  fileData,
  fileError,
  fileLoading,
  onDownload,
  onFullscreenChange,
  onPageChange,
  onPageCountChange,
  onRetryFile,
  resource,
  viewerRef,
}: DocumentMainContentProps) => (
  <section
    className="student-document-main-column"
    aria-label="Document viewer"
  >
    {fileLoading ? (
      <DocumentFileLoadingState />
    ) : fileError || !fileData ? (
      <DocumentFileErrorState onRetryFile={onRetryFile} />
    ) : (
      <DocumentViewer
        data={fileData}
        fileName={resource.fileName}
        isDownloadable={resource.isDownloadable}
        onDocumentLoaded={() => undefined}
        onDownload={onDownload}
        onFullscreenChange={onFullscreenChange}
        onPageChange={onPageChange}
        onPageCountChange={onPageCountChange}
        ref={viewerRef}
      />
    )}
    <ResourceSequence resource={resource} />
  </section>
);
