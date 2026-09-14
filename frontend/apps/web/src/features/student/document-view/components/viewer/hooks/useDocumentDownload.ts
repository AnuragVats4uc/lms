import { useCallback } from "react";

type UseDocumentDownloadOptions = {
  data: ArrayBuffer;
  fileName: string;
  isDownloadable: boolean;
  onDownload: () => void;
};

export const useDocumentDownload = ({
  data,
  fileName,
  isDownloadable,
  onDownload,
}: UseDocumentDownloadOptions) =>
  useCallback(() => {
    if (!isDownloadable) return;

    onDownload();
    const blob = new Blob([data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [data, fileName, isDownloadable, onDownload]);
