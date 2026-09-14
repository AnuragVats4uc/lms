import { useCallback, useEffect, useRef } from "react";
import { studentDashboardBannersApi } from "@repo/api";
import type {
  DashboardBannerEventType,
  StudentDashboardBanner,
} from "@repo/types";

const recordBannerEvent = (
  banner: StudentDashboardBanner,
  eventType: DashboardBannerEventType,
  position?: number,
) => {
  void studentDashboardBannersApi
    .recordEvent(
      banner.uuid,
      eventType,
      crypto.randomUUID(),
      position == null ? undefined : Math.max(0, Math.round(position)),
    )
    .catch(() => undefined);
};

export const useDashboardBannerTracking = (
  banner: StudentDashboardBanner | undefined,
) => {
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!banner || seen.current.has(banner.uuid)) return;
    seen.current.add(banner.uuid);
    recordBannerEvent(banner, "DASHBOARD_BANNER_IMPRESSION");
  }, [banner]);

  return useCallback(
    (eventType: DashboardBannerEventType, position?: number) => {
      if (banner) recordBannerEvent(banner, eventType, position);
    },
    [banner],
  );
};
