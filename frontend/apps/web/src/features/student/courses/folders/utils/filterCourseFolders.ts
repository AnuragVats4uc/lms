import type { StudentCourseFolder } from "@repo/types";

import type { FolderSort, FolderTypeFilter } from "../types";

type FilterCourseFoldersOptions = {
  folders: StudentCourseFolder[];
  search: string;
  sort: FolderSort;
  typeFilter: FolderTypeFilter;
};

export const filterCourseFolders = ({
  folders,
  search,
  sort,
  typeFilter,
}: FilterCourseFoldersOptions) => {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matchesType = (folder: StudentCourseFolder) => {
    if (typeFilter === "VIDEO") return folder.resourceCounts.videos > 0;
    if (typeFilter === "DOCUMENT") {
      return folder.resourceCounts.documents > 0;
    }
    if (typeFilter === "EXAM") return folder.resourceCounts.exams > 0;
    return true;
  };

  const matches = folders.filter(
    (folder) =>
      matchesType(folder) &&
      (!normalizedSearch ||
        folder.name.toLocaleLowerCase().includes(normalizedSearch) ||
        folder.description?.toLocaleLowerCase().includes(normalizedSearch)),
  );

  if (sort === "NAME") {
    return [...matches].sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }

  if (sort === "RESOURCES") {
    return [...matches].sort(
      (first, second) =>
        second.resourceCounts.total - first.resourceCounts.total ||
        first.name.localeCompare(second.name),
    );
  }

  return matches;
};
