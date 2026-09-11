import type {
  StudentDashboardBanner,
  StudentDashboardBannerMediaType,
} from "./student-dashboard";

export interface AdminStudentDashboardBanner extends StudentDashboardBanner {
  sessions: Array<{
    sessionId: number;
    session: { id: number; name: string; code: string | null };
  }>;
}

export interface SaveStudentDashboardBannerRequest {
  title: string;
  description?: string | null;
  ctaLabel?: string | null;
  destinationUrl?: string | null;
  mediaType: StudentDashboardBannerMediaType;
  mediaUrl: string;
  mediaAlt?: string | null;
  posterUrl?: string | null;
  sessionIds: number[];
  autoplay?: boolean;
  openInNewTab?: boolean;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export type DashboardBannerEventType =
  | "DASHBOARD_BANNER_IMPRESSION"
  | "DASHBOARD_BANNER_CTA_CLICK"
  | "DASHBOARD_BANNER_VIDEO_PLAY"
  | "DASHBOARD_BANNER_VIDEO_PAUSE"
  | "DASHBOARD_BANNER_VIDEO_COMPLETE";
