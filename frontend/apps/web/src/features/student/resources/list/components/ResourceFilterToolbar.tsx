import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  Search,
} from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  ResourceTypeId,
  StudentResourceList,
} from "@repo/types";

import { CrudSelect } from "@/features/shared/forms/CrudSelect";
import { ALL_RESOURCES, resourceSortOptions } from "../constants";
import { ResourceFilterField } from "./ResourceFilterField";
import { formatEnum } from "../utils/resourceFormatting";
import type { ResourceFilterValues } from "../types";

type ResourceFilterToolbarProps = {
  filtersVisible: boolean;
  setFiltersVisible: React.Dispatch<React.SetStateAction<boolean>>;
  draftFilters: ResourceFilterValues;
  initialResourceTypeId?: ResourceTypeId;
  resourcesQuery: UseQueryResult<StudentResourceList, Error>;
  data?: StudentResourceList;
  subjectOptions: Array<{
    id: number | string;
    name: string;
  }>;
  updateFilter: <K extends keyof ResourceFilterValues>(
    key: K,
    value: ResourceFilterValues[K],
  ) => void;
  updateCourse: (value: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
};

export const ResourceFilterToolbar = ({
  filtersVisible,
  setFiltersVisible,
  draftFilters,
  initialResourceTypeId,
  resourcesQuery,
  data,
  subjectOptions,
  updateFilter,
  updateCourse,
  applyFilters,
  resetFilters,
}: ResourceFilterToolbarProps) => {
  return (
    <section
      className="student-resource-filter-panel"
      aria-label="Resource filters"
    >
      {filtersVisible ? (
        <div className="student-resource-filter-grid">
          <ResourceFilterField className="is-search" label="Search by Name">
            <div className="student-resource-search-control">
              <Search aria-hidden="true" size={16} strokeWidth={2} />

              <input
                aria-label="Search by resource name"
                onChange={(event) =>
                  updateFilter("search", event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyFilters();
                  }
                }}
                placeholder="Search resource name, topic..."
                type="search"
                value={draftFilters.search}
              />
            </div>
          </ResourceFilterField>

          {initialResourceTypeId ? null : (
            <ResourceFilterField label="Resource Type">
              <CrudSelect
                ariaLabel="Resource type"
                disabled={resourcesQuery.isLoading}
                onChange={(value) =>
                  updateFilter(
                    "resourceTypeId",
                    value as ResourceFilterValues["resourceTypeId"],
                  )
                }
                options={[
                  { label: "All Types", value: ALL_RESOURCES },
                  ...(data?.filters.types ?? []).map((type) => ({
                    label: type.name,
                    value: String(type.id),
                  })),
                ]}
                value={draftFilters.resourceTypeId}
                variant="form"
                width="100%"
              />
            </ResourceFilterField>
          )}

          <ResourceFilterField label="Course">
            <CrudSelect
              ariaLabel="Course"
              disabled={resourcesQuery.isLoading}
              onChange={updateCourse}
              options={[
                { label: "All Courses", value: ALL_RESOURCES },
                ...(data?.filters.courses ?? []).map((course) => ({
                  label: course.name,
                  value: String(course.id),
                })),
              ]}
              value={draftFilters.courseId}
              variant="form"
              width="100%"
            />
          </ResourceFilterField>

          <ResourceFilterField label="Subject">
            <CrudSelect
              ariaLabel="Subject"
              disabled={
                resourcesQuery.isLoading || !subjectOptions.length
              }
              onChange={(value) => updateFilter("subjectId", value)}
              options={[
                { label: "All Subjects", value: ALL_RESOURCES },
                ...subjectOptions.map((subject) => ({
                  label: subject.name,
                  value: String(subject.id),
                })),
              ]}
              value={draftFilters.subjectId}
              variant="form"
              width="100%"
            />
          </ResourceFilterField>

          <ResourceFilterField label="Upload Date">
            <div className="student-resource-date-control">
              <CalendarDays
                aria-hidden="true"
                size={16}
                strokeWidth={2}
              />

              <input
                aria-label="Upload date"
                onChange={(event) =>
                  updateFilter("uploadedOn", event.target.value)
                }
                type="date"
                value={draftFilters.uploadedOn}
              />
            </div>
          </ResourceFilterField>

          <ResourceFilterField label="Status">
            <CrudSelect
              ariaLabel="Status"
              disabled={resourcesQuery.isLoading}
              onChange={(value) =>
                updateFilter(
                  "status",
                  value as ResourceFilterValues["status"],
                )
              }
              options={[
                { label: "All Status", value: ALL_RESOURCES },
                ...(data?.filters.statuses ?? []).map((status) => ({
                  label: formatEnum(status),
                  value: status,
                })),
              ]}
              value={draftFilters.status}
              variant="form"
              width="100%"
            />
          </ResourceFilterField>

          <ResourceFilterField label="Sort By">
            <CrudSelect
              ariaLabel="Sort resources"
              onChange={(value) =>
                updateFilter(
                  "sort",
                  value as ResourceFilterValues["sort"],
                )
              }
              options={resourceSortOptions}
              value={draftFilters.sort}
              variant="form"
              width="100%"
            />
          </ResourceFilterField>

          <div className="student-resource-filter-actions">
            <button
              className="student-resource-apply-button"
              disabled={resourcesQuery.isFetching}
              onClick={applyFilters}
              type="button"
            >
              <span>Apply Filters</span>
              <Filter aria-hidden="true" size={14} strokeWidth={2.2} />
            </button>

            <button
              className="student-resource-reset-button"
              disabled={resourcesQuery.isFetching}
              onClick={resetFilters}
              type="button"
            >
              <RotateCcw
                aria-hidden="true"
                size={14}
                strokeWidth={2.2}
              />
              <span>Reset</span>
            </button>
          </div>
        </div>
      ) : null}

      <button
        aria-expanded={filtersVisible}
        className="student-resource-filter-toggle"
        onClick={() => setFiltersVisible((current) => !current)}
        type="button"
      >
        <span>
          {filtersVisible ? "Hide Filters" : "Show Filters"}
        </span>

        {filtersVisible ? (
          <ChevronUp aria-hidden="true" size={14} />
        ) : (
          <ChevronDown aria-hidden="true" size={14} />
        )}
      </button>
    </section>
  );
};