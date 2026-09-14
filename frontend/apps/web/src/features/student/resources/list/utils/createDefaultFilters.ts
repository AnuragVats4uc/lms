import type { ResourceTypeId } from "@repo/types";

import { ALL_RESOURCES } from "../constants";
import type { ResourceFilterValues } from "../types";

export const createDefaultFilters = (
  search = "",
  resourceTypeId?: ResourceTypeId,
): ResourceFilterValues => ({
  search,
  resourceTypeId: resourceTypeId
    ? (String(resourceTypeId) as `${ResourceTypeId}`)
    : ALL_RESOURCES,
  courseId: ALL_RESOURCES,
  subjectId: ALL_RESOURCES,
  uploadedOn: "",
  status: ALL_RESOURCES,
  sort: "NEWEST",
});
