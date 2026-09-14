import { useEffect, useMemo, useRef, useState } from "react";

export const useDocumentViewer = (
  data: ArrayBuffer,
  onPageChange: (pageNumber: number) => void,
) => {
  const onPageChangeRef = useRef(onPageChange);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1);
  const pdfFile = useMemo(
    () => ({ data: new Uint8Array(data.slice(0)) }),
    [data],
  );

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    onPageChangeRef.current(pageNumber);
  }, [pageNumber]);

  return {
    pageCount,
    pageNumber,
    pdfFile,
    scale,
    setPageCount,
    setPageNumber,
    setScale,
  };
};
