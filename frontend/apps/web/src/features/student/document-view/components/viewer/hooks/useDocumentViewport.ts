import { useEffect, useRef, useState } from "react";

export const useDocumentViewport = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(760);

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

  return { viewportRef, viewportWidth };
};
