import type { DashboardBannerFormState } from "./types";

export const EMPTY_DASHBOARD_BANNER_FORM: DashboardBannerFormState = {
  title: "",
  description: "",
  ctaLabel: "Learn more",
  destinationUrl: "",
  mediaType: "IMAGE",
  mediaUrl: "",
  mediaAlt: "",
  posterUrl: "",
  sessionIds: [],
  autoplay: false,
  openInNewTab: false,
  isActive: true,
  startsAt: null,
  endsAt: null,
};

export const DASHBOARD_BANNERS_QUERY_KEY = "dashboard-banners";
export const DASHBOARD_BANNER_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif";
