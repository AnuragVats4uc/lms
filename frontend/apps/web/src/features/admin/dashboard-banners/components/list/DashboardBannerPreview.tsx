import { Video } from "lucide-react";
import type { AdminStudentDashboardBanner } from "@repo/types";

import { useProtectedMediaUrl } from "@/hooks/useProtectedMediaUrl";

export const DashboardBannerPreview = ({
  banner,
}: {
  banner: AdminStudentDashboardBanner;
}) => {
  const source = useProtectedMediaUrl(
    banner.mediaType === "IMAGE" ? banner.mediaUrl : banner.posterUrl,
  );
  return source ? (
    <img alt={banner.mediaAlt ?? banner.title} src={source} />
  ) : (
    <Video aria-label="Video banner" size={34} />
  );
};
