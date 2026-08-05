export interface DashboardMetric {
  total: number;
  active: number;
  inactive: number;
}

export interface DashboardStatistics {
  organizations: DashboardMetric;
  sessions: DashboardMetric;
  courses: DashboardMetric;
  sessionCourses: DashboardMetric;
  folders: DashboardMetric;
  resources: DashboardMetric;
  users: DashboardMetric;
  roles: DashboardMetric;
  permissions: number;
}

export interface DashboardContext {
  organization: { id: number; name: string; code: string } | null;
  session: { id: number; name: string } | null;
  course: { id: number; name: string; code: string } | null;
  sessionCourseId: number | null;
  folder: { id: number; name: string; parentFolderId: number | null } | null;
}

export interface DashboardSessionOption {
  id: number;
  organizationId: number;
  name: string;
  code: string | null;
}

export interface DashboardSessionCourseOption {
  id: number;
  sessionId: number;
  courseId: number;
  displayName: string | null;
  course: { id: number; name: string; code: string };
}

export interface DashboardFolderOption {
  id: number;
  sessionCourseId: number;
  parentFolderId: number | null;
  name: string;
}

export interface DashboardContextOptions {
  organizations: Array<{ id: number; name: string; code: string }>;
  sessions: DashboardSessionOption[];
  sessionCourses: DashboardSessionCourseOption[];
  folders: DashboardFolderOption[];
}

export interface DashboardFolder {
  id: number;
  name: string;
  description: string | null;
  resourceCount: number;
  folderCount: number;
  updatedAt: string;
}

export type DashboardTreeNodeType = 'organization' | 'session' | 'course' | 'folder';

export interface DashboardTreeNode {
  id: string;
  type: DashboardTreeNodeType;
  label: string;
  children?: DashboardTreeNode[];
}

export interface DashboardRole {
  id: number;
  name: string;
  code: string;
  description: string | null;
  permissionCount: number;
  userCount: number;
  isActive: boolean;
}

export interface DashboardData {
  statistics: DashboardStatistics;
  context: DashboardContext;
  folders: DashboardFolder[];
  tree: DashboardTreeNode[];
  roles: DashboardRole[];
}

export interface DashboardQuery {
  organizationId?: number;
  sessionId?: number;
  sessionCourseId?: number;
  folderId?: number;
}
