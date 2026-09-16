import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import type { AdminStudentDashboardBanner } from "@repo/types";

import styles from "../../DashboardBannersPage.module.css";
import { DashboardBannerPreview } from "./DashboardBannerPreview";

export const DashboardBannerList = ({
  banners,
  onDelete,
  onEdit,
  onMove,
}: {
  banners: AdminStudentDashboardBanner[];
  onDelete: (banner: AdminStudentDashboardBanner) => void;
  onEdit: (banner: AdminStudentDashboardBanner) => void;
  onMove: (index: number, delta: -1 | 1) => void;
}) => (
  <section className={styles.list}>
    {banners.map((banner, index) => (
      <article className={styles.row} key={banner.uuid}>
        <div className={styles.preview}>
          <DashboardBannerPreview banner={banner} />
        </div>
        <div className={styles.copy}>
          <div>
            <h2>{banner.title || "Untitled video banner"}</h2>
            <span>{banner.mediaType}</span>
            <span>{banner.isActive ? "Active" : "Hidden"}</span>
          </div>
          <p>{banner.description || "No description"}</p>
          <small>
            {banner.sessions.map(({ session }) => session.name).join(", ")}
          </small>
        </div>
        <div className={styles.actions}>
          <button
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            aria-label="Move up"
          >
            <ArrowUp size={16} />
          </button>
          <button
            disabled={index === banners.length - 1}
            onClick={() => onMove(index, 1)}
            aria-label="Move down"
          >
            <ArrowDown size={16} />
          </button>
          <button onClick={() => onEdit(banner)} aria-label="Edit">
            <Pencil size={16} />
          </button>
          <button
            className={styles.danger}
            onClick={() => onDelete(banner)}
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </article>
    ))}
  </section>
);
