"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  CalendarDays,
  Ellipsis,
  FileText,
  Folder,
  ShieldCheck,
  UploadCloud,
  UserCog,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import { Button, Text, XStack, YStack } from "@repo/ui";
import { PageContainer } from "@repo/ui/dashboard";
import type {
  BreadcrumbItem,
  FolderCardProps,
  QuickActionsProps,
  RoleCardProps,
  StatCardProps,
  SupportCardProps,
  TreeNodeItem,
  UploadDropzoneProps,
} from "@repo/ui/dashboard";
import { dashboardApi } from "@repo/api";
import type {
  DashboardData,
  DashboardQuery,
  DashboardRole,
  DashboardTreeNode,
} from "@repo/types";

import { DashboardPage } from "@/features/admin/dashboard";

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );

const roleIcon = (role: DashboardRole) => {
  if (role.code === "SUPER_ADMIN") return <ShieldCheck aria-hidden="true" />;
  if (role.code === "ADMIN") return <UserCog aria-hidden="true" />;
  if (role.code === "INSTRUCTOR") return <Users aria-hidden="true" />;
  return <UserRound aria-hidden="true" />;
};

const treeIcon = (node: DashboardTreeNode) => {
  if (node.type === "organization") return <Building2 size={15} strokeWidth={2.2} />;
  if (node.type === "session") return <CalendarDays size={15} strokeWidth={2.2} />;
  if (node.type === "course") return <BookOpen size={15} strokeWidth={2.2} />;
  return <Folder size={14} strokeWidth={2.2} />;
};

const toTreeItem = (
  node: DashboardTreeNode,
  selectedId: string | null,
  collapsedIds: Set<string>,
): TreeNodeItem => ({
  id: node.id,
  label: node.label,
  icon: treeIcon(node),
  expanded: !collapsedIds.has(node.id),
  selected: node.id === selectedId,
  children: node.children?.map((child) =>
    toTreeItem(child, selectedId, collapsedIds),
  ),
});

const buildStatistics = (data: DashboardData, navigate: (path: string) => void): StatCardProps[] => [
  {
    color: "green",
    icon: <Building2 aria-hidden="true" size={24} strokeWidth={2.2} />,
    link: "Manage Organizations",
    subtitle: `${data.statistics.organizations.active} active organizations`,
    title: "Organizations",
    value: data.statistics.organizations.total,
    onPress: () => navigate("/admin/organizations"),
  },
  {
    color: "purple",
    icon: <CalendarDays aria-hidden="true" size={24} strokeWidth={2.2} />,
    link: "Manage Sessions",
    subtitle: `${data.statistics.sessions.active} active sessions`,
    title: "Sessions",
    value: data.statistics.sessions.total,
    onPress: () => navigate("/admin/sessions"),
  },
  {
    color: "blue",
    icon: <BookOpen aria-hidden="true" size={24} strokeWidth={2.2} />,
    link: "Manage Courses",
    subtitle: `${data.statistics.courses.active} active courses`,
    title: "Courses",
    value: data.statistics.courses.total,
    onPress: () => navigate("/admin/courses"),
  },
];

const buildFolders = (data: DashboardData, navigate: (path: string) => void): FolderCardProps[] =>
  data.folders.map((folder) => ({
    actions: [
      {
        icon: <Folder size={15} />,
        label: "Open",
        onPress: () => navigate(resourcePath(data, folder.id)),
      },
      {
        icon: <FileText size={15} />,
        label: "Resources",
        onPress: () => navigate(resourcePath(data, folder.id)),
      },
      {
        icon: <Ellipsis size={15} />,
        label: "More",
        onPress: () => navigate(folderPath(data, "edit", folder.id)),
      },
    ],
    badge: `${folder.resourceCount} resources`,
    description: folder.description ?? "No description available.",
    folderCount: folder.folderCount,
    icon: <Folder aria-hidden="true" size={34} strokeWidth={2.2} />,
    resourceCount: folder.resourceCount,
    title: folder.name,
    updatedAt: formatUpdatedAt(folder.updatedAt),
  }));

const buildRoles = (data: DashboardData, navigate: (path: string) => void): RoleCardProps[] =>
  data.roles.map((role) => ({
    actions: [
      {
        label: "Edit",
        onPress: () => navigate(`/admin/roles?action=edit&id=${role.id}`),
      },
      {
        icon: <Ellipsis size={15} />,
        label: "More",
        onPress: () => navigate("/admin/roles"),
      },
    ],
    badge: `${role.permissionCount} permissions`,
    badgeTone: role.code === "SUPER_ADMIN" ? "green" : "blue",
    description: role.description ?? "No description available.",
    icon: roleIcon(role),
    permissions: `${role.userCount} assigned users`,
    role: role.name,
  }));

const buildQuickActions = (
  data: DashboardData,
  navigate: (path: string) => void,
): QuickActionsProps => ({
  icon: <Zap aria-hidden="true" size={18} strokeWidth={2.2} />,
  title: "Quick Actions",
  actions: [
    {
      icon: <Building2 size={22} strokeWidth={2.2} />,
      label: "Add Organization",
      onPress: () => navigate("/admin/organizations?action=create"),
    },
    {
      icon: <CalendarDays size={22} strokeWidth={2.2} />,
      label: "Add Session",
      onPress: () => navigate(sessionPath(data, "create")),
    },
    {
      icon: <BookOpen size={22} strokeWidth={2.2} />,
      label: "Create Course",
      onPress: () => navigate("/admin/courses?action=create"),
    },
    {
      icon: <UploadCloud size={22} strokeWidth={2.2} />,
      label: "Upload Resource",
      onPress: () => navigate(resourcePath(data, undefined, "create")),
    },
  ],
});

const buildSupport = (navigate: (path: string) => void): SupportCardProps => ({
  actionLabel: "Contact Support",
  description: "Our support team is here to help you.",
  onPress: () => navigate("/admin/settings"),
  title: "Need Help?",
});

const buildUpload = (
  data: DashboardData,
  navigate: (path: string) => void,
): UploadDropzoneProps => ({
  actionLabel: "Upload Files",
  description: "Drag and drop files here, or click to browse. Supports: PDF, DOCX, PPTX, MP4, MOV, ZIP and more.",
  icon: <UploadCloud aria-hidden="true" size={42} strokeWidth={2.2} />,
  onPress: () => navigate(resourcePath(data, undefined, "create")),
  title: "Upload resources to this course",
});

const resourcePath = (
  data: DashboardData,
  folderId?: number,
  action?: "create" | "edit",
  itemId?: number,
) => {
  const params = new URLSearchParams();
  if (data.context.organization) params.set("organizationId", String(data.context.organization.id));
  if (data.context.session) params.set("sessionId", String(data.context.session.id));
  if (data.context.sessionCourseId) params.set("sessionCourseId", String(data.context.sessionCourseId));
  const selectedFolderId = folderId ?? data.context.folder?.id;
  if (selectedFolderId) params.set("folderId", String(selectedFolderId));
  if (action) params.set("action", action);
  if (itemId) params.set("id", String(itemId));
  return `/admin/resources?${params.toString()}`;
};

const folderPath = (
  data: DashboardData,
  action?: "create" | "edit",
  itemId?: number,
) => {
  const params = new URLSearchParams();
  if (data.context.organization) params.set("organizationId", String(data.context.organization.id));
  if (data.context.session) params.set("sessionId", String(data.context.session.id));
  if (data.context.sessionCourseId) params.set("sessionCourseId", String(data.context.sessionCourseId));
  if (action) params.set("action", action);
  if (itemId) params.set("id", String(itemId));
  return `/admin/folders?${params.toString()}`;
};

const sessionPath = (data: DashboardData, action?: "create") => {
  const params = new URLSearchParams();
  if (data.context.organization) params.set("organizationId", String(data.context.organization.id));
  if (action) params.set("action", action);
  return `/admin/sessions?${params.toString()}`;
};

const buildBreadcrumbs = (data: DashboardData): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [];

  if (data.context.organization) {
    items.push({
      icon: <Building2 size={22} strokeWidth={2.2} />,
      label: data.context.organization.name,
      subtitle: "Organization",
    });
  }

  if (data.context.session) {
    items.push({
      icon: <CalendarDays size={22} strokeWidth={2.2} />,
      label: data.context.session.name,
      subtitle: "Session",
    });
  }

  if (data.context.course) {
    items.push({
      icon: <BookOpen size={22} strokeWidth={2.2} />,
      label: data.context.course.name,
      subtitle: "Course",
    });
  }

  if (data.context.folder) {
    items.push({
      icon: <Folder size={22} strokeWidth={2.2} />,
      label: data.context.folder.name,
      subtitle: "Folder",
    });
  }

  return [
    ...items,
    {
      icon: <Folder size={22} strokeWidth={2.2} />,
      label: "Resource Home",
      subtitle: "Manage Content",
    },
  ];
};

export function AdminDashboardPage() {
  const router = useRouter();
  const [dashboardContext, setDashboardContext] = useState<DashboardQuery>({});
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [treeOnly, setTreeOnly] = useState(false);
  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => dashboardApi.findSummary(),
  });
  const resourceQuery = useQuery({
    enabled: Boolean(dashboardQuery.data && Object.keys(dashboardContext).length),
    queryKey: [
      "admin-dashboard",
      "resources",
      dashboardContext.organizationId ?? null,
      dashboardContext.sessionId ?? null,
      dashboardContext.sessionCourseId ?? null,
      dashboardContext.folderId ?? null,
    ],
    queryFn: () => dashboardApi.findSummary(dashboardContext),
  });
  const contextOptionsQuery = useQuery({
    enabled: Boolean(dashboardQuery.data),
    queryKey: [
      "admin-dashboard",
      "contexts",
      dashboardContext.organizationId ?? null,
      dashboardContext.sessionId ?? null,
      dashboardContext.sessionCourseId ?? null,
      dashboardContext.folderId ?? null,
    ],
    queryFn: () => dashboardApi.findContextOptions(dashboardContext),
  });

  useEffect(() => {
    const data = dashboardQuery.data;
    if (!data) return;

    // The initial dashboard response supplies defaults for the query context.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDashboardContext((current) => {
      const next = { ...current };
      if (next.organizationId === undefined && data.context.organization) {
        next.organizationId = data.context.organization.id;
      }
      if (next.sessionId === undefined && data.context.session) {
        next.sessionId = data.context.session.id;
      }
      if (next.sessionCourseId === undefined && data.context.sessionCourseId) {
        next.sessionCourseId = data.context.sessionCourseId;
      }
      return next.organizationId === current.organizationId &&
        next.sessionId === current.sessionId &&
        next.sessionCourseId === current.sessionCourseId &&
        next.folderId === current.folderId
        ? current
        : next;
    });
  }, [dashboardQuery.data]);

  const overviewViewModel = useMemo(() => {
    if (!dashboardQuery.data) return null;

    return {
      roles: buildRoles(dashboardQuery.data, router.push),
      statistics: buildStatistics(dashboardQuery.data, router.push),
    };
  }, [dashboardQuery.data, router.push]);

  const resourceData = resourceQuery.data ?? dashboardQuery.data;
  const quickActions = useMemo(
    () =>
      dashboardQuery.data
        ? buildQuickActions(dashboardQuery.data, router.push)
        : null,
    [dashboardQuery.data, router.push],
  );
  const support = useMemo(() => buildSupport(router.push), [router.push]);
  const resourceViewModel = useMemo(() => {
    if (!resourceData) return null;

    return {
      breadcrumbs: buildBreadcrumbs(resourceData),
      folders: buildFolders(resourceData, router.push),
      context: resourceData.context,
      tree: resourceData.tree.map((node) =>
        toTreeItem(
          node,
          selectedTreeId ??
            (resourceData.context.sessionCourseId
              ? `session-course-${resourceData.context.sessionCourseId}`
              : null),
          collapsedTreeIds,
        ),
      ),
    };
  }, [collapsedTreeIds, dashboardQuery.data, resourceData, router.push, selectedTreeId]);

  const navigateToTreeNode = (id: string) => {
    setSelectedTreeId(id);
    if (id.startsWith("folder-")) {
      const folderId = Number(id.replace("folder-", ""));
      if (resourceData) router.push(resourcePath(resourceData, folderId));
      return;
    }
    if (id.startsWith("session-course-") && resourceData?.context.sessionCourseId) {
      router.push(resourcePath(resourceData));
    }
  };

  const toggleTreeNode = (id: string) => {
    setCollapsedTreeIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (dashboardQuery.isPending) {
    return (
      <PageContainer>
        <YStack gap="$2" py="$6">
          <Text color="#52627A" fontSize="$body">Loading dashboard data...</Text>
        </YStack>
      </PageContainer>
    );
  }

  if (dashboardQuery.isError || !overviewViewModel || !resourceViewModel) {
    return (
      <PageContainer>
        <YStack gap="$3" py="$6" style={{ alignItems: "center" }}>
          <Text color="#B91C1C" fontSize="$body">Unable to load dashboard data.</Text>
          <Button onPress={() => void dashboardQuery.refetch()} background="#059669" rounded="$3">
            <Button.Text color="#FFFFFF">Retry</Button.Text>
          </Button>
        </YStack>
      </PageContainer>
    );
  }

  return (
    <DashboardPage
      breadcrumbs={resourceViewModel.breadcrumbs}
      context={resourceViewModel.context}
      selectedContext={dashboardContext}
      contextOptions={contextOptionsQuery.data ?? {
        organizations: [],
        sessions: [],
        sessionCourses: [],
        folders: [],
      }}
      contextLoading={contextOptionsQuery.isFetching}
      folders={resourceViewModel.folders}
      roles={overviewViewModel.roles}
      statistics={overviewViewModel.statistics}
      support={support}
      tree={resourceViewModel.tree}
      upload={buildUpload(resourceData!, router.push)}
      quickActions={quickActions!}
      onAddFolder={() =>
        router.push(
          resourceData
            ? folderPath(resourceData, "create")
            : "/admin/folders",
        )
      }
      onMore={() => router.push("/admin/resources")}
      onRefresh={() => void resourceQuery.refetch()}
      onContextChange={setDashboardContext}
      onSelectTree={navigateToTreeNode}
      onToggleTree={toggleTreeNode}
      onViewTree={() => setTreeOnly((current) => !current)}
      refreshing={resourceQuery.isFetching}
      treeOnly={treeOnly}
      onViewAllRoles={() => router.push("/admin/roles")}
    />
  );
}
