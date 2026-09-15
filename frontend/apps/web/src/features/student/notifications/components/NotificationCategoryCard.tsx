import type { LucideIcon } from "lucide-react";

import styles from "../StudentNotificationsPage.module.css";

export const NotificationCategoryCard = ({
  active,
  count,
  description,
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  count: number;
  description: string;
  icon: LucideIcon;
  label: string;
  tone: string;
  onClick: () => void;
}) => {
  return (
    <button
      aria-pressed={active}
      className={styles.categoryCard}
      data-active={active}
      data-tone={tone}
      onClick={onClick}
      type="button"
    >
      <span className={styles.categoryIcon}>
        <Icon aria-hidden="true" size={18} />
      </span>
      <span className={styles.categoryCopy}>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className={styles.categoryCount}>{count}</span>
    </button>
  );
};
