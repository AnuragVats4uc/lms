"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  FileText,
  Minus,
  Plus,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export interface DocumentViewerHandle {
  download: () => void;
  enterFullscreen: () => void;
}

interface DocumentViewerProps {
  data: ArrayBuffer;
  fileName: string;
  isDownloadable: boolean;
  onDocumentLoaded: () => void;
  onPageCountChange: (pageCount: number) => void;
}

export const DocumentViewer = forwardRef<
  DocumentViewerHandle,
  DocumentViewerProps
>(function DocumentViewer(
  { data, fileName, isDownloadable, onDocumentLoaded, onPageCountChange },
  forwardedRef,
) {
  const frameRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(760);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pdfFile = useMemo(
    () => ({ data: new Uint8Array(data.slice(0)) }),
    [data],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateWidth = () =>
      setViewportWidth(Math.max(320, viewport.clientWidth - 48));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const enterFullscreen = () => {
    if (!frameRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void frameRef.current.requestFullscreen();
  };

  const download = () => {
    if (!isDownloadable) return;
    const blob = new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(forwardedRef, () => ({ download, enterFullscreen }), [
    data,
    fileName,
    isDownloadable,
  ]);

  return (
    <div
      className={`student-document-viewer${isFullscreen ? " is-fullscreen" : ""}`}
      ref={frameRef}
    >
      <div className="student-document-toolbar">
        <div className="student-document-filename">
          <span>
            <FileText aria-hidden="true" size={17} />
          </span>
          <strong title={fileName}>{fileName}</strong>
        </div>
        <div
          className="student-document-controls"
          aria-label="Document controls"
        >
          <button
            aria-label="Previous page"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={17} />
          </button>
          <input
            aria-label="Current page"
            max={pageCount || 1}
            min={1}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isInteger(next)) {
                setPageNumber(Math.min(Math.max(1, next), pageCount || 1));
              }
            }}
            type="number"
            value={pageNumber}
          />
          <span>/ {pageCount || "—"}</span>
          <button
            aria-label="Next page"
            disabled={!pageCount || pageNumber >= pageCount}
            onClick={() =>
              setPageNumber((current) => Math.min(pageCount, current + 1))
            }
            type="button"
          >
            <ChevronRight aria-hidden="true" size={17} />
          </button>
          <i aria-hidden="true" />
          <button
            aria-label="Zoom out"
            disabled={scale <= 0.5}
            onClick={() => setScale((current) => Math.max(0.5, current - 0.1))}
            type="button"
          >
            <Minus aria-hidden="true" size={17} />
          </button>
          <span className="student-document-zoom">
            {Math.round(scale * 100)}%
          </span>
          <button
            aria-label="Zoom in"
            disabled={scale >= 2}
            onClick={() => setScale((current) => Math.min(2, current + 0.1))}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
          </button>
          <i aria-hidden="true" />
          {isDownloadable ? (
            <button aria-label="Download PDF" onClick={download} type="button">
              <Download aria-hidden="true" size={17} />
            </button>
          ) : null}
          <button
            aria-label={
              isFullscreen ? "Exit full screen" : "Open in full screen"
            }
            onClick={enterFullscreen}
            type="button"
          >
            <Expand aria-hidden="true" size={17} />
          </button>
        </div>
      </div>

      <div className="student-document-pdf-viewport" ref={viewportRef}>
        <Document
          error={
            <div className="student-document-pdf-message">
              This PDF could not be rendered. Please try again.
            </div>
          }
          file={pdfFile}
          loading={
            <div className="student-document-pdf-message">Loading PDF…</div>
          }
          onLoadSuccess={({ numPages }) => {
            setPageCount(numPages);
            setPageNumber((current) => Math.min(current, numPages));
            onPageCountChange(numPages);
            onDocumentLoaded();
          }}
        >
          <Page
            pageNumber={pageNumber}
            renderAnnotationLayer
            renderTextLayer
            scale={scale}
            width={viewportWidth}
          />
        </Document>
      </div>
    </div>
  );
});
