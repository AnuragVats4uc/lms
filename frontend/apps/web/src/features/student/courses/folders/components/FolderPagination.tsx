import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPaginationItems } from "../utils/getPaginationItems";

export const FolderPagination = ({
  currentPage,
  firstVisibleIndex,
  onPageChange,
  totalItems,
  totalPages,
  visibleItems,
}: {
  currentPage: number;
  firstVisibleIndex: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  totalPages: number;
  visibleItems: number;
}) => {
  const pageItems = getPaginationItems(currentPage, totalPages);

  return (
    <nav
      className="student-course-folder-pagination"
      aria-label="Folder pagination"
    >
      <span aria-live="polite">
        Showing {firstVisibleIndex + 1}–{firstVisibleIndex + visibleItems} of{" "}
        {totalItems} folders
      </span>
      <div>
        <button
          aria-label="Previous page"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={15} />
        </button>
        {pageItems.map((item) =>
          typeof item === "number" ? (
            <button
              aria-current={item === currentPage ? "page" : undefined}
              aria-label={`Page ${item}`}
              className={item === currentPage ? "active" : undefined}
              key={item}
              onClick={() => onPageChange(item)}
              type="button"
            >
              {item}
            </button>
          ) : (
            <span aria-hidden="true" key={item}>
              …
            </span>
          ),
        )}
        <button
          aria-label="Next page"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={15} />
        </button>
      </div>
    </nav>
  );
};
