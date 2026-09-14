import ReactPlayer from "react-player";
import type {
  DashboardBannerEventType,
  StudentDashboardBanner,
} from "@repo/types";

import { useProtectedMediaUrl } from "@/hooks/useProtectedMediaUrl";

import { getBannerPlaybackOptions } from "../utils/bannerPlayback";
import styles from "../../StudentDashboardBannerCarousel.module.css";

type StudentDashboardBannerMediaProps = {
  banner: StudentDashboardBanner;
  onEvent: (eventType: DashboardBannerEventType) => void;
};

export const StudentDashboardBannerMedia = ({
  banner,
  onEvent,
}: StudentDashboardBannerMediaProps) => {
  const posterUrl = useProtectedMediaUrl(banner.posterUrl);
  const mediaUrl = useProtectedMediaUrl(
    banner.mediaType === "IMAGE" ? banner.mediaUrl : null,
  );

  if (banner.mediaType === "IMAGE") {
    return (
      <img
        alt={banner.mediaAlt ?? banner.title}
        className={styles.media}
        src={mediaUrl}
      />
    );
  }

  if (banner.videoProvider === "EXTERNAL") {
    return posterUrl ? (
      <img
        alt={banner.mediaAlt ?? banner.title}
        className={styles.media}
        src={posterUrl}
      />
    ) : (
      <div className={styles.videoFallback}>
        This video opens through the banner action.
      </div>
    );
  }

  const playback = getBannerPlaybackOptions(banner.autoplay, posterUrl);

  return (
    <ReactPlayer
      className={styles.media}
      controls={playback.controls}
      height="100%"
      light={playback.light}
      loop={playback.loop}
      muted={playback.muted}
      onEnded={() => onEvent("DASHBOARD_BANNER_VIDEO_COMPLETE")}
      onPause={() => onEvent("DASHBOARD_BANNER_VIDEO_PAUSE")}
      onPlay={() => onEvent("DASHBOARD_BANNER_VIDEO_PLAY")}
      playing={playback.playing}
      playsInline
      src={banner.mediaUrl}
      width="100%"
    />
  );
};
