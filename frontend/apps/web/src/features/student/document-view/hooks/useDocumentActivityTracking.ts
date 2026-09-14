import { useCallback } from "react";

import { useResourceActivity } from "../../activity/useResourceActivity";

type UseDocumentActivityTrackingOptions = {
  enabled: boolean;
  onProgressRefresh: () => void;
  resourceId: number;
};

export const useDocumentActivityTracking = ({
  enabled,
  onProgressRefresh,
  resourceId,
}: UseDocumentActivityTrackingOptions) => {
  const activity = useResourceActivity({
    enabled,
    initialPageNumber: 1,
    onHeartbeat: onProgressRefresh,
    resourceId,
  });

  const handleDownload = useCallback(() => {
    void activity.recordEvent("RESOURCE_DOWNLOAD").catch(() => undefined);
  }, [activity]);

  const handleFullscreenChange = useCallback(
    (fullscreen: boolean) => {
      void activity
        .recordEvent(
          fullscreen ? "DOCUMENT_FULLSCREEN_ENTER" : "DOCUMENT_FULLSCREEN_EXIT",
        )
        .catch(() => undefined);
    },
    [activity],
  );

  const handlePageChange = useCallback(
    (pageNumber: number) => {
      void activity
        .changePage(pageNumber)
        .then(onProgressRefresh)
        .catch(() => undefined);
    },
    [activity, onProgressRefresh],
  );

  return {
    handleDownload,
    handleFullscreenChange,
    handlePageChange,
  };
};
