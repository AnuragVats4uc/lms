"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { StudentDashboardBanner } from "@repo/types";

import { StudentDashboardBannerMedia } from "./components/StudentDashboardBannerMedia";
import { useDashboardBannerTracking } from "./hooks/useDashboardBannerTracking";
import styles from "../StudentDashboardBannerCarousel.module.css";

export function StudentDashboardBannerCarousel({
  banners,
}: {
  banners: StudentDashboardBanner[];
}) {
  const [active, setActive] = useState(0);
  const banner = banners[active];
  const recordEvent = useDashboardBannerTracking(banner);

  useEffect(
    () =>
      setActive((value) => Math.min(value, Math.max(0, banners.length - 1))),
    [banners.length],
  );

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
        <StudentDashboardBannerMedia banner={banner} onEvent={recordEvent} />
        {hasContent ? <div className={styles.overlay} /> : null}
        {hasContent ? (
          <div className={styles.content}>
            {banner.title ? <h1>{banner.title}</h1> : null}
            {banner.description ? <p>{banner.description}</p> : null}
            {banner.ctaLabel && banner.destinationUrl ? (
              <a
                className={styles.cta}
                href={banner.destinationUrl}
                onClick={() => recordEvent("DASHBOARD_BANNER_CTA_CLICK")}
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
