import type {
  ResourceStatus,
  ResourceTypeId,
  StudentResourcesSort,
} from "@repo/types";

export type ResourceFilterValues = {
  search: string;
  resourceTypeId: "ALL" | `${ResourceTypeId}`;
  courseId: string;
  subjectId: string;
  uploadedOn: string;
  status: "ALL" | ResourceStatus;
  sort: StudentResourcesSort;
};

export type StudentResourcesPageProps = {
  initialSearch?: string;
  initialResourceTypeId?: ResourceTypeId;
  subtitle?: string;
  title?: string;
};
