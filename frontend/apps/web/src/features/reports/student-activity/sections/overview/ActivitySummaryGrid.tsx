import type { ComponentProps } from "react";
import styles from "../../styles/StudentActivityReportPage.module.css";
import { ActivitySummaryCard } from "./ActivitySummaryCard";

export const ActivitySummaryGrid = ({
  cards,
}: {
  cards: Array<ComponentProps<typeof ActivitySummaryCard>>;
}) => (
  <section aria-label="Activity summary" className={styles.summaryGrid}>
    {cards.map((card) => (
      <ActivitySummaryCard {...card} key={card.label} />
    ))}
  </section>
);
