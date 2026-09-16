import { CheckCircle2, Image as ImageIcon, Video } from "lucide-react";

import styles from "../../DashboardBannersPage.module.css";

export const DashboardBannersHeader = ({
  activeCount,
  imageCount,
  videoCount,
}: {
  activeCount: number;
  imageCount: number;
  videoCount: number;
}) => (
  <section className={styles.headerGrid} aria-label="Dashboard banner summary">
    <div className={styles.heroCard}>
      <img
        alt=""
        aria-hidden="true"
        className={styles.dotGrid}
        src="/exam-subject-assets/dot-grid.png"
      />
      <div>
        <span>Student experience</span>
        <h1>Dashboard Banners</h1>
        <p>
          Manage session-specific images and videos shown above the student
          course list.
        </p>
      </div>
      <span className={styles.heroIcon}>
        <Video aria-hidden="true" size={42} />
      </span>
    </div>
    <div className={styles.insightCard}>
      <span>Banner insights</span>
      <h2>Media coverage</h2>
      <div className={styles.insightStats}>
        <span>
          <CheckCircle2 aria-hidden="true" size={24} />
          <strong>{activeCount}</strong>
          <small>Active</small>
        </span>
        <span>
          <ImageIcon aria-hidden="true" size={24} />
          <strong>{imageCount}</strong>
          <small>Images</small>
        </span>
        <span>
          <Video aria-hidden="true" size={24} />
          <strong>{videoCount}</strong>
          <small>Videos</small>
        </span>
      </div>
    </div>
  </section>
);
