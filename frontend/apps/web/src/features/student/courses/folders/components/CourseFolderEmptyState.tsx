import { Search } from "lucide-react";

type CourseFolderEmptyStateProps = {
  resetFilters: () => void;
};

export const CourseFolderEmptyState = ({
  resetFilters,
}: CourseFolderEmptyStateProps) => {
  return (
    <div className="student-course-folder-empty">
      <Search aria-hidden="true" size={24} />
      <div>
        <strong>No matching folders</strong>
        <span>Try a different search or resource type.</span>
      </div>
      <button onClick={resetFilters} type="button">
        Clear filters
      </button>
    </div>
  );
};
