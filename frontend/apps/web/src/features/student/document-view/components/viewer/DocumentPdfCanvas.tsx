import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type DocumentPdfCanvasProps = {
  file: { data: Uint8Array<ArrayBuffer> };
  onLoadSuccess: (pageCount: number) => void;
  pageNumber: number;
  scale: number;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  viewportWidth: number;
};

export const DocumentPdfCanvas = ({
  file,
  onLoadSuccess,
  pageNumber,
  scale,
  viewportRef,
  viewportWidth,
}: DocumentPdfCanvasProps) => (
  <div className="student-document-pdf-viewport" ref={viewportRef}>
    <Document
      error={
        <div className="student-document-pdf-message">
          This PDF could not be rendered. Please try again.
        </div>
      }
      file={file}
      loading={<div className="student-document-pdf-message">Loading PDF…</div>}
      onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
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
);
