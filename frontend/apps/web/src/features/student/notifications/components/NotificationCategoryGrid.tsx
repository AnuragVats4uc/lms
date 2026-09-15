import { Inbox } from "lucide-react";
import type {
  StudentNotificationCategory,
  StudentNotificationsResponse,
} from "@repo/types";

import { categoryMeta } from "../constants";
import styles from "../StudentNotificationsPage.module.css";
import type { CategoryFilter } from "../types";
import { totalNotificationCategoryCount } from "../utils/notificationSummary";
import { NotificationCategoryCard } from "./NotificationCategoryCard";

type NotificationCategoryGridProps = {
  activeCategory: CategoryFilter;
  data: StudentNotificationsResponse;
  onCategoryChange: (category: CategoryFilter) => void;
};

export const NotificationCategoryGrid = ({
  activeCategory,
  data,
  onCategoryChange,
}: NotificationCategoryGridProps) => (
  <section aria-label="Notification categories" className={styles.categoryGrid}>
    <NotificationCategoryCard
      active={activeCategory === "ALL"}
      count={totalNotificationCategoryCount(data)}
      description="Every relevant student update"
      icon={Inbox}
      label="All updates"
      onClick={() => onCategoryChange("ALL")}
      tone="all"
    />
    {(Object.keys(categoryMeta) as StudentNotificationCategory[]).map(
      (category) => {
        const meta = categoryMeta[category];
        return (
          <NotificationCategoryCard
            active={activeCategory === category}
            count={data.summary.byType[category]}
            description={meta.description}
            icon={meta.icon}
            key={category}
            label={meta.label}
            onClick={() => onCategoryChange(category)}
            tone={category.toLocaleLowerCase()}
          />
        );
      },
    )}
  </section>
);
