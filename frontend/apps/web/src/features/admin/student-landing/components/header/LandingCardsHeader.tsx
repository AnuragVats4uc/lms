import { ExternalLink, Eye, LayoutGrid } from "lucide-react";
import styles from "../../StudentLandingCardsPage.module.css";

export const LandingCardsHeader = ({
  customCount,
  totalCount,
  visibleCount,
}: {
  customCount: number;
  totalCount: number;
  visibleCount: number;
}) => (
  <section className={styles.headerGrid} aria-label="Landing card summary">
    <div className={styles.heroCard}>
      <img
        alt=""
        aria-hidden="true"
        className={styles.dotGrid}
        src="/exam-subject-assets/dot-grid.png"
      />
      <div>
        <span>Student experience</span>
        <h1>Landing Cards</h1>
        <p>Manage the destinations shown immediately after login.</p>
      </div>
      <span className={styles.heroIcon}>
        <LayoutGrid aria-hidden="true" size={42} />
      </span>
    </div>
    <div className={styles.insightCard}>
      <span>Card insights</span>
      <h2>Card coverage</h2>
      <div className={styles.insightStats}>
        <span>
          <LayoutGrid aria-hidden="true" size={24} />
          <strong>{totalCount}</strong>
          <small>Total</small>
        </span>
        <span>
          <Eye aria-hidden="true" size={24} />
          <strong>{visibleCount}</strong>
          <small>Visible</small>
        </span>
        <span>
          <ExternalLink aria-hidden="true" size={24} />
          <strong>{customCount}</strong>
          <small>Custom</small>
        </span>
      </div>
    </div>
  </section>
);
