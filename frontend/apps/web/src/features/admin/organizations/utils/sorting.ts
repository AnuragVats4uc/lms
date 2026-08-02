import type { OrganizationTableRow, SortOption } from "../types";

export const sortRows = (
  rows: OrganizationTableRow[],
  sort: SortOption,
): OrganizationTableRow[] => {
  return [...rows].sort((first, second) => {
    if (sort === "oldest") {
      return (
        new Date(first.createdAt).getTime() -
        new Date(second.createdAt).getTime()
      );
    }

    if (sort === "name-asc") {
      return first.name.localeCompare(second.name);
    }

    if (sort === "name-desc") {
      return second.name.localeCompare(first.name);
    }

    if (sort === "updated") {
      return (
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime()
      );
    }

    return (
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
  });
};
