export const ALL_RESOURCES = "ALL";
export const DEFAULT_PAGE_SIZE = 10;

export const resourceSortOptions = [
  { label: "Newest First", value: "NEWEST" },
  { label: "Oldest First", value: "OLDEST" },
  { label: "Name A–Z", value: "TITLE_ASC" },
  { label: "Name Z–A", value: "TITLE_DESC" },
] as const;
