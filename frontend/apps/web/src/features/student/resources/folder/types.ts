import type { ResourceTypeId, StudentResourcesSort } from "@repo/types";

import { ALL_FOLDER_RESOURCES } from "./constants";

export type FolderResourceFilters = {
  search: string;
  type: typeof ALL_FOLDER_RESOURCES | `${ResourceTypeId}`;
  uploadedOn: string;
  sort: StudentResourcesSort;
};

export type StudentFolderResourcesPageProps = {
  sessionCourseId: number;
  folderId: number;
};

export const defaultFolderResourceFilters: FolderResourceFilters = {
  search: "",
  type: ALL_FOLDER_RESOURCES,
  uploadedOn: "",
  sort: "NEWEST",
};
