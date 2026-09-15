import { ChevronLeft, ChevronRight } from "lucide-react";

import styles from "../StudentNotificationsPage.module.css";

type NotificationsPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const NotificationsPagination = ({
  page,
  totalPages,
  onPageChange,
}: NotificationsPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <span>
        Page {page} of {totalPages}
      </span>
      <div>
        <button
          aria-label="Previous notification page"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </button>
        <button
          aria-label="Next notification page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
};
