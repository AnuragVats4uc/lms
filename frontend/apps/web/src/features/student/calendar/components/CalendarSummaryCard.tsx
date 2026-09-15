import type { LucideIcon } from "lucide-react";
import styles from "../StudentCalendarPage.module.css";

export const CalendarSummaryCard = ({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone: "purple" | "green" | "orange" | "blue";
  value: number;
}) => (
  <article className={styles.summaryCard} data-tone={tone}>
    <span className={styles.summaryIcon}>
      <Icon aria-hidden="true" size={19} />
    </span>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </article>
);
