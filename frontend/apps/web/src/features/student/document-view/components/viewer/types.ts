export interface DocumentViewerHandle {
  download: () => void;
  enterFullscreen: () => void;
}

export interface DocumentViewerProps {
  data: ArrayBuffer;
  fileName: string;
  isDownloadable: boolean;
  onDocumentLoaded: () => void;
  onDownload: () => void;
  onFullscreenChange: (fullscreen: boolean) => void;
  onPageChange: (pageNumber: number) => void;
  onPageCountChange: (pageCount: number) => void;
}
