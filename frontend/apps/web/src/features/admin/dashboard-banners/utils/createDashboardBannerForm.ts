import type { AdminStudentDashboardBanner } from "@repo/types";

import { EMPTY_DASHBOARD_BANNER_FORM } from "../constants";
import type { DashboardBannerFormState } from "../types";
import { toDashboardBannerLocalInput } from "./dashboardBannerDates";

export const createDashboardBannerForm = (
  banner?: AdminStudentDashboardBanner | null,
  sessionId?: number,
): DashboardBannerFormState =>
  banner
    ? {
        title: banner.title,
        description: banner.description,
        ctaLabel: banner.ctaLabel,
        destinationUrl: banner.destinationUrl,
        mediaType: banner.mediaType,
        mediaUrl: banner.mediaUrl,
        mediaAlt: banner.mediaAlt,
        posterUrl: banner.posterUrl,
        sessionIds: banner.sessions.map((item) => item.sessionId),
        autoplay: banner.autoplay,
        openInNewTab: banner.openInNewTab,
        isActive: banner.isActive,
        startsAt: toDashboardBannerLocalInput(banner.startsAt),
        endsAt: toDashboardBannerLocalInput(banner.endsAt),
      }
    : {
        ...EMPTY_DASHBOARD_BANNER_FORM,
        sessionIds: sessionId ? [sessionId] : [],
      };
