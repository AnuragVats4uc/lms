import type { FolderStatus } from "@repo/types";

export const getFolderStatusTone = (status: FolderStatus) =>
  status === "ACTIVE" ? ("success" as const) : ("neutral" as const);
