import type { FolderForm } from "./types";

export const INITIAL_FOLDER_FORM: FolderForm = {
  color: "",
  description: "",
  icon: "",
  name: "",
  parentFolderId: "",
  sortOrder: "0",
  status: "ACTIVE",
};

export const FOLDER_STATUS_OPTIONS = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];
