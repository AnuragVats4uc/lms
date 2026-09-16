import type { CreateFolderRequest, UpdateFolderRequest } from "@repo/types";

import type { FolderForm } from "../types";

export const toCreateFolderPayload = (
  form: FolderForm,
): CreateFolderRequest => {
  const payload: CreateFolderRequest = {
    name: form.name.trim(),
    sortOrder: Number(form.sortOrder),
    status: form.status,
  };
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.icon.trim()) payload.icon = form.icon.trim();
  if (form.color.trim()) payload.color = form.color.trim();
  if (form.parentFolderId) payload.parentFolderId = Number(form.parentFolderId);
  return payload;
};

export const toUpdateFolderPayload = (
  form: FolderForm,
): UpdateFolderRequest => ({
  ...toCreateFolderPayload(form),
  parentFolderId: form.parentFolderId ? Number(form.parentFolderId) : null,
});
