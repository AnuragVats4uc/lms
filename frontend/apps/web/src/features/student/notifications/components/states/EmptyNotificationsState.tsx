import { Search, Sparkles } from "lucide-react";

import styles from "../../StudentNotificationsPage.module.css";

export const EmptyNotificationsState = ({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) => {
  return (
    <div className={styles.emptyState}>
      <span>
        {filtered ? (
          <Search aria-hidden="true" size={24} />
        ) : (
          <Sparkles aria-hidden="true" size={24} />
        )}
      </span>
      <h3>
        {filtered ? "No matching notifications" : "You are all caught up"}
      </h3>
      <p>
        {filtered
          ? "Try a different search, category or read-status filter."
          : "New exam, resource and account updates will appear here."}
      </p>
      {filtered ? (
        <button onClick={onClear} type="button">
          Clear filters
        </button>
      ) : null}
    </div>
  );
};
