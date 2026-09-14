import { useCallback, useEffect, useRef, useState } from "react";

export const useDocumentFullscreen = (
  onFullscreenChange: (fullscreen: boolean) => void,
) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreen = document.fullscreenElement === frameRef.current;
      setIsFullscreen(fullscreen);
      onFullscreenChange(fullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onFullscreenChange]);

  const enterFullscreen = useCallback(() => {
    if (!frameRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void frameRef.current.requestFullscreen();
  }, []);

  return { enterFullscreen, frameRef, isFullscreen };
};
