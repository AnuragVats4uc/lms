import {
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  FileText,
  Minus,
  Plus,
} from "lucide-react";

type DocumentViewerToolbarProps = {
  fileName: string;
  isDownloadable: boolean;
  isFullscreen: boolean;
  onDownload: () => void;
  onFullscreen: () => void;
  onPageChange: (pageNumber: number) => void;
  onScaleChange: (scale: number) => void;
  pageCount: number;
  pageNumber: number;
  scale: number;
};

export const DocumentViewerToolbar = ({
  fileName,
  isDownloadable,
  isFullscreen,
  onDownload,
  onFullscreen,
  onPageChange,
  onScaleChange,
  pageCount,
  pageNumber,
  scale,
}: DocumentViewerToolbarProps) => (
  <div className="student-document-toolbar">
    <div className="student-document-filename">
      <span>
        <FileText aria-hidden="true" size={17} />
      </span>
      <strong title={fileName}>{fileName}</strong>
    </div>
    <div className="student-document-controls" aria-label="Document controls">
      <button
        aria-label="Previous page"
        disabled={pageNumber <= 1}
        onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
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
            onPageChange(Math.min(Math.max(1, next), pageCount || 1));
          }
        }}
        type="number"
        value={pageNumber}
      />
      <span>/ {pageCount || "—"}</span>
      <button
        aria-label="Next page"
        disabled={!pageCount || pageNumber >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, pageNumber + 1))}
        type="button"
      >
        <ChevronRight aria-hidden="true" size={17} />
      </button>
      <i aria-hidden="true" />
      <button
        aria-label="Zoom out"
        disabled={scale <= 0.5}
        onClick={() => onScaleChange(Math.max(0.5, scale - 0.1))}
        type="button"
      >
        <Minus aria-hidden="true" size={17} />
      </button>
      <span className="student-document-zoom">{Math.round(scale * 100)}%</span>
      <button
        aria-label="Zoom in"
        disabled={scale >= 2}
        onClick={() => onScaleChange(Math.min(2, scale + 0.1))}
        type="button"
      >
        <Plus aria-hidden="true" size={17} />
      </button>
      <i aria-hidden="true" />
      {isDownloadable ? (
        <button aria-label="Download PDF" onClick={onDownload} type="button">
          <Download aria-hidden="true" size={17} />
        </button>
      ) : null}
      <button
        aria-label={isFullscreen ? "Exit full screen" : "Open in full screen"}
        onClick={onFullscreen}
        type="button"
      >
        <Expand aria-hidden="true" size={17} />
      </button>
    </div>
  </div>
);
