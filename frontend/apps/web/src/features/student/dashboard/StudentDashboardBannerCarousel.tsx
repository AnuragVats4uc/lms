"use client";

import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import { studentDashboardBannersApi } from "@repo/api";
import type {
  DashboardBannerEventType,
  StudentDashboardBanner,
} from "@repo/types";

import { useProtectedMediaUrl } from "@/hooks/useProtectedMediaUrl";

import { getBannerPlaybackOptions } from "./bannerPlayback";
import styles from "./StudentDashboardBannerCarousel.module.css";

export function StudentDashboardBannerCarousel({
  banners,
}: {
  banners: StudentDashboardBanner[];
}) {
  const [active, setActive] = useState(0);
  const seen = useRef(new Set<string>());
  const banner = banners[active];

  useEffect(
    () =>
      setActive((value) => Math.min(value, Math.max(0, banners.length - 1))),
    [banners.length],
  );
  useEffect(() => {
    if (!banner || seen.current.has(banner.uuid)) return;
    seen.current.add(banner.uuid);
    record(banner, "DASHBOARD_BANNER_IMPRESSION");
  }, [banner]);

  if (!banner) return null;
  const hasContent = Boolean(
    banner.title ||
    banner.description ||
    (banner.ctaLabel && banner.destinationUrl),
  );
  const change = (next: number) =>
    setActive((next + banners.length) % banners.length);

  return (
    <section aria-label="Dashboard announcements" className={styles.carousel}>
      <article className={styles.banner} key={banner.uuid}>
        <BannerMedia banner={banner} />
        {hasContent ? <div className={styles.overlay} /> : null}
        {hasContent ? (
          <div className={styles.content}>
            {banner.title ? <h1>{banner.title}</h1> : null}
            {banner.description ? <p>{banner.description}</p> : null}
            {banner.ctaLabel && banner.destinationUrl ? (
              <a
                className={styles.cta}
                href={banner.destinationUrl}
                onClick={() => record(banner, "DASHBOARD_BANNER_CTA_CLICK")}
                rel={banner.openInNewTab ? "noopener noreferrer" : undefined}
                target={banner.openInNewTab ? "_blank" : undefined}
              >
                {banner.ctaLabel}
                {banner.openInNewTab ? (
                  <ExternalLink aria-hidden size={15} />
                ) : (
                  <ChevronRight aria-hidden size={17} />
                )}
              </a>
            ) : null}
          </div>
        ) : null}
      </article>
      {banners.length > 1 ? (
        <>
          <button
            aria-label="Previous banner"
            className={`${styles.arrow} ${styles.previous}`}
            onClick={() => change(active - 1)}
            type="button"
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="Next banner"
            className={`${styles.arrow} ${styles.next}`}
            onClick={() => change(active + 1)}
            type="button"
          >
            <ChevronRight />
          </button>
          <div className={styles.dots}>
            {banners.map((item, index) => (
              <button
                aria-label={`Show banner ${index + 1}`}
                aria-current={index === active}
                className={index === active ? styles.activeDot : ""}
                key={item.uuid}
                onClick={() => setActive(index)}
                type="button"
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function BannerMedia({ banner }: { banner: StudentDashboardBanner }) {
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
      onEnded={() => record(banner, "DASHBOARD_BANNER_VIDEO_COMPLETE")}
      onPause={() => record(banner, "DASHBOARD_BANNER_VIDEO_PAUSE")}
      onPlay={() => record(banner, "DASHBOARD_BANNER_VIDEO_PLAY")}
      playing={playback.playing}
      playsInline
      src={banner.mediaUrl}
      width="100%"
    />
  );
}

function record(
  banner: StudentDashboardBanner,
  eventType: DashboardBannerEventType,
  position?: number,
) {
  void studentDashboardBannersApi
    .recordEvent(
      banner.uuid,
      eventType,
      crypto.randomUUID(),
      position == null ? undefined : Math.max(0, Math.round(position)),
    )
    .catch(() => undefined);
}
