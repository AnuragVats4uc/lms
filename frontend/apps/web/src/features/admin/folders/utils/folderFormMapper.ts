import type { Folder } from "@repo/types";

import type { FolderForm } from "../types";

export const folderToForm = (folder: Folder): FolderForm => ({
  color: folder.color ?? "",
  description: folder.description ?? "",
  icon: folder.icon ?? "",
  name: folder.name,
  parentFolderId: folder.parentFolderId?.toString() ?? "",
  sortOrder: String(folder.sortOrder),
  status: folder.status,
});
