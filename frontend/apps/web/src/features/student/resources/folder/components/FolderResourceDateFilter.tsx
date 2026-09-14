import { StudentFolderResourceList } from "@repo/types";
import { UseQueryResult } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { FolderResourceFilters } from "../types";

type FolderResourceDateFilterProps = {
  query: UseQueryResult<NoInfer<StudentFolderResourceList>, Error>;
  filters: FolderResourceFilters;
  updateUploadDate: (val: string) => void;
};

export const FolderResourceDateFilter = ({
  query,
  filters,
  updateUploadDate,
}: FolderResourceDateFilterProps) => {
  return (
    <div className="student-resource-admin-date-filter lms-crud-filter-control lms-crud-select">
      <label
        className="student-resource-admin-date-trigger lms-crud-select-trigger"
        htmlFor="student-resource-added-date"
      >
        <span className="lms-crud-select-label">Added date</span>
        <span className="student-resource-admin-date-value lms-crud-select-value">
          <CalendarDays aria-hidden="true" size={13} />
          <input
            aria-label="Filter resources by added date"
            disabled={query.isFetching}
            id="student-resource-added-date"
            onChange={(event) => updateUploadDate(event.target.value)}
            type="date"
            value={filters.uploadedOn}
          />
        </span>
      </label>
    </div>
  );
};
