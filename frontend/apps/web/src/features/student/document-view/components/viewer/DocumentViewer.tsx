"use client";

import { forwardRef, useImperativeHandle } from "react";

import { DocumentPdfCanvas } from "./DocumentPdfCanvas";
import { DocumentViewerToolbar } from "./DocumentViewerToolbar";
import { useDocumentDownload } from "./hooks/useDocumentDownload";
import { useDocumentFullscreen } from "./hooks/useDocumentFullscreen";
import { useDocumentViewer } from "./hooks/useDocumentViewer";
import { useDocumentViewport } from "./hooks/useDocumentViewport";
import type { DocumentViewerHandle, DocumentViewerProps } from "./types";

export const DocumentViewer = forwardRef<
  DocumentViewerHandle,
  DocumentViewerProps
>(function DocumentViewer(
  {
    data,
    fileName,
    isDownloadable,
    onDocumentLoaded,
    onDownload,
    onFullscreenChange,
    onPageChange,
    onPageCountChange,
  },
  forwardedRef,
) {
  const viewer = useDocumentViewer(data, onPageChange);
  const viewport = useDocumentViewport();
  const fullscreen = useDocumentFullscreen(onFullscreenChange);
  const download = useDocumentDownload({
    data,
    fileName,
    isDownloadable,
    onDownload,
  });

  useImperativeHandle(
    forwardedRef,
    () => ({
      download,
      enterFullscreen: fullscreen.enterFullscreen,
    }),
    [download, fullscreen.enterFullscreen],
  );

  const handleLoadSuccess = (pageCount: number) => {
    viewer.setPageCount(pageCount);
    viewer.setPageNumber((current) => Math.min(current, pageCount));
    onPageCountChange(pageCount);
    onDocumentLoaded();
  };

  return (
    <div
      className={`student-document-viewer${
        fullscreen.isFullscreen ? " is-fullscreen" : ""
      }`}
      ref={fullscreen.frameRef}
    >
      <DocumentViewerToolbar
        fileName={fileName}
        isDownloadable={isDownloadable}
        isFullscreen={fullscreen.isFullscreen}
        onDownload={download}
        onFullscreen={fullscreen.enterFullscreen}
        onPageChange={viewer.setPageNumber}
        onScaleChange={viewer.setScale}
        pageCount={viewer.pageCount}
        pageNumber={viewer.pageNumber}
        scale={viewer.scale}
      />
      <DocumentPdfCanvas
        file={viewer.pdfFile}
        onLoadSuccess={handleLoadSuccess}
        pageNumber={viewer.pageNumber}
        scale={viewer.scale}
        viewportRef={viewport.viewportRef}
        viewportWidth={viewport.viewportWidth}
      />
    </div>
  );
});

export type { DocumentViewerHandle, DocumentViewerProps } from "./types";
