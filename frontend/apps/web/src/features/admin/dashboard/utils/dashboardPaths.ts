import type { DashboardData } from "@repo/types";

const addDashboardContextParams = (
  params: URLSearchParams,
  data: DashboardData,
) => {
  if (data.context.organization) {
    params.set("organizationId", String(data.context.organization.id));
  }
  if (data.context.session) {
    params.set("sessionId", String(data.context.session.id));
  }
  if (data.context.sessionCourseId) {
    params.set("sessionCourseId", String(data.context.sessionCourseId));
  }
};

export const getDashboardResourcePath = (
  data: DashboardData,
  folderId?: number,
  action?: "create" | "edit",
  itemId?: number,
) => {
  const params = new URLSearchParams();
  addDashboardContextParams(params, data);
  const selectedFolderId = folderId ?? data.context.folder?.id;
  if (selectedFolderId) params.set("folderId", String(selectedFolderId));
  if (action) params.set("action", action);
  if (itemId) params.set("id", String(itemId));
  return `/admin/resources?${params.toString()}`;
};

export const getDashboardFolderPath = (
  data: DashboardData,
  action?: "create" | "edit",
  itemId?: number,
) => {
  const params = new URLSearchParams();
  addDashboardContextParams(params, data);
  if (action) params.set("action", action);
  if (itemId) params.set("id", String(itemId));
  return `/admin/folders?${params.toString()}`;
};

export const getDashboardSessionPath = (
  data: DashboardData,
  action?: "create",
) => {
  const params = new URLSearchParams();
  if (data.context.organization) {
    params.set("organizationId", String(data.context.organization.id));
  }
  if (action) params.set("action", action);
  return `/admin/sessions?${params.toString()}`;
};
