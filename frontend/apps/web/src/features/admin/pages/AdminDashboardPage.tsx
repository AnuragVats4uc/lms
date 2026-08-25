"use client";

import { useMemo, useState } from "react";
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
import { AppCard } from "@repo/ui/primitives";
import { PageContainer } from "@repo/ui/dashboard";
import type {
  BreadcrumbItem,
  FolderCardProps,
  QuickActionsProps,
  RoleCardProps,
  StatCardProps,
  TreeNodeItem,
  UploadDropzoneProps,
} from "@repo/ui/dashboard";
import { dashboardApi } from "@repo/api";
import { useAuthSession } from "@repo/auth";
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
  if (node.type === "organization")
    return <Building2 size={15} strokeWidth={2.2} />;
  if (node.type === "session")
    return <CalendarDays size={15} strokeWidth={2.2} />;
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

const buildStatistics = (
  data: DashboardData,
  navigate: (path: string) => void,
  isSuperAdmin: boolean,
): StatCardProps[] => {
  const statistics: StatCardProps[] = [];

  if (isSuperAdmin) {
    statistics.push({
        color: "green",
        icon: <Building2 aria-hidden="true" size={24} strokeWidth={2.2} />,
        link: "Manage Organizations",
        subtitle: `${data.statistics.organizations.active} active organizations`,
        title: "Organizations",
        value: data.statistics.organizations.total,
        onPress: () => navigate("/admin/organizations"),
    });
  }

  statistics.push(
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
    {
      color: "green",
      icon: <FileText aria-hidden="true" size={24} strokeWidth={2.2} />,
      link: "Manage Resources",
      subtitle: `${data.statistics.resources.active} active resources`,
      title: "Total Resources",
      value: data.statistics.resources.total,
      onPress: () => navigate("/admin/resources"),
    },
  );

  return statistics;
};

const buildFolders = (
  data: DashboardData,
  navigate: (path: string) => void,
): FolderCardProps[] =>
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

const buildRoles = (
  data: DashboardData,
  navigate: (path: string) => void,
): RoleCardProps[] =>
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
  isSuperAdmin: boolean,
): QuickActionsProps => ({
  icon: <Zap aria-hidden="true" size={18} strokeWidth={2.2} />,
  title: "Quick Actions",
  actions: [
    ...(isSuperAdmin
      ? [
          {
            icon: <Building2 size={22} strokeWidth={2.2} />,
            label: "Add Organization",
            onPress: () => navigate("/admin/organizations?action=create"),
          },
        ]
      : []),
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
      icon: <UserRound size={22} strokeWidth={2.2} />,
      label: "Register Student",
      onPress: () => navigate("/admin/students?action=create"),
    },
  ],
});

const buildUpload = (
  data: DashboardData,
  navigate: (path: string) => void,
): UploadDropzoneProps => ({
  actionLabel: "Upload Files",
  description:
    "Drag and drop files here, or click to browse. Supports: PDF, DOCX, PPTX, MP4, MOV, ZIP and more.",
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
  if (data.context.organization)
    params.set("organizationId", String(data.context.organization.id));
  if (data.context.session)
    params.set("sessionId", String(data.context.session.id));
  if (data.context.sessionCourseId)
    params.set("sessionCourseId", String(data.context.sessionCourseId));
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
  if (data.context.organization)
    params.set("organizationId", String(data.context.organization.id));
  if (data.context.session)
    params.set("sessionId", String(data.context.session.id));
  if (data.context.sessionCourseId)
    params.set("sessionCourseId", String(data.context.sessionCourseId));
  if (action) params.set("action", action);
  if (itemId) params.set("id", String(itemId));
  return `/admin/folders?${params.toString()}`;
};

const sessionPath = (data: DashboardData, action?: "create") => {
  const params = new URLSearchParams();
  if (data.context.organization)
    params.set("organizationId", String(data.context.organization.id));
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

function SkeletonBlock({
  height,
  rounded = 10,
  width = "100%",
}: {
  height: number;
  rounded?: number;
  width?: number | string;
}) {
  return (
    <XStack
      className="lms-skeleton"
      style={{ borderRadius: rounded, height, width }}
    />
  );
}

function AdminDashboardSkeleton({ statCount }: { statCount: number }) {
  return (
    <PageContainer>
      <YStack gap="$4">
        <YStack
          className="lms-dashboard-stats-grid"
          gap="$3"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${statCount}, minmax(160px, 1fr)) minmax(260px, 0.9fr)`,
            width: "100%",
          }}
        >
          {Array.from({ length: statCount }).map((_, index) => (
            <AppCard
              key={index}
              background="#FFFFFF"
              borderColor="#E1E7F0"
              p="$4"
              style={{
                borderRadius: 12,
                boxShadow: "0 8px 28px rgba(15, 23, 42, 0.04)",
                minHeight: 136,
                minWidth: 0,
              }}
            >
              <XStack gap="$3" style={{ alignItems: "center" }}>
                <SkeletonBlock height={52} rounded={14} width={52} />
                <YStack gap="$2" style={{ flex: 1 }}>
                  <SkeletonBlock height={12} width="56%" />
                  <SkeletonBlock height={28} width="38%" />
                  <SkeletonBlock height={12} width="78%" />
                </YStack>
              </XStack>
              <SkeletonBlock height={14} width="46%" />
            </AppCard>
          ))}
          <AppCard
            background="#FFFFFF"
            borderColor="#E1E7F0"
            p="$4"
            style={{
              borderRadius: 12,
              boxShadow: "0 8px 28px rgba(15, 23, 42, 0.04)",
              minHeight: 136,
              minWidth: 0,
            }}
          >
            <YStack gap="$3">
              <SkeletonBlock height={16} width={140} />
              <XStack
                gap="$2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(72px, 1fr))",
                }}
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonBlock key={index} height={78} rounded={14} />
                ))}
              </XStack>
            </YStack>
          </AppCard>
        </YStack>

        <AppCard
          background="#FFFFFF"
          borderColor="#E1E7F0"
          p="$4"
          style={{
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
          }}
        >
          <YStack gap="$4">
            <XStack
              style={{
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <YStack gap="$2" style={{ flex: 1 }}>
                <SkeletonBlock height={22} width={220} />
                <SkeletonBlock height={12} width="46%" />
              </YStack>
              <XStack gap="$2">
                <SkeletonBlock height={40} width={96} />
                <SkeletonBlock height={40} width={112} />
              </XStack>
            </XStack>
            <SkeletonBlock height={58} rounded={12} />
            <XStack
              className="lms-resource-management-grid"
              gap="$4"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr)",
                minWidth: 0,
              }}
            >
              <SkeletonBlock height={420} rounded={12} />
              <SkeletonBlock height={420} rounded={12} />
            </XStack>
          </YStack>
        </AppCard>

        <AppCard
          background="#FFFFFF"
          borderColor="#E1E7F0"
          p="$4"
          style={{
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
          }}
        >
          <YStack gap="$3">
            <SkeletonBlock height={18} width={180} />
            <SkeletonBlock height={88} rounded={12} />
          </YStack>
        </AppCard>
      </YStack>
    </PageContainer>
  );
}

export function AdminDashboardPage() {
  const router = useRouter();
  const { currentUser } = useAuthSession();
  const isSuperAdmin = Boolean(currentUser?.roles.includes("SUPER_ADMIN"));
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
  const effectiveDashboardContext = useMemo(() => {
    const data = dashboardQuery.data;
    const next = { ...dashboardContext };

    if (next.organizationId === undefined && data?.context.organization) {
      next.organizationId = data.context.organization.id;
    }
    if (next.sessionId === undefined && data?.context.session) {
      next.sessionId = data.context.session.id;
    }
    if (next.sessionCourseId === undefined && data?.context.sessionCourseId) {
      next.sessionCourseId = data.context.sessionCourseId;
    }

    return next;
  }, [dashboardContext, dashboardQuery.data]);
  const resourceQuery = useQuery({
    enabled: Boolean(
      dashboardQuery.data && Object.keys(effectiveDashboardContext).length,
    ),
    queryKey: [
      "admin-dashboard",
      "resources",
      effectiveDashboardContext.organizationId ?? null,
      effectiveDashboardContext.sessionId ?? null,
      effectiveDashboardContext.sessionCourseId ?? null,
      effectiveDashboardContext.folderId ?? null,
    ],
    queryFn: () => dashboardApi.findSummary(effectiveDashboardContext),
  });
  const contextOptionsQuery = useQuery({
    enabled: Boolean(dashboardQuery.data),
    queryKey: [
      "admin-dashboard",
      "contexts",
      effectiveDashboardContext.organizationId ?? null,
      effectiveDashboardContext.sessionId ?? null,
      effectiveDashboardContext.sessionCourseId ?? null,
      effectiveDashboardContext.folderId ?? null,
    ],
    queryFn: () => dashboardApi.findContextOptions(effectiveDashboardContext),
  });

  const overviewViewModel = useMemo(() => {
    if (!dashboardQuery.data) return null;

    return {
      roles: buildRoles(dashboardQuery.data, router.push),
      statistics: buildStatistics(
        dashboardQuery.data,
        router.push,
        isSuperAdmin,
      ),
    };
  }, [dashboardQuery.data, isSuperAdmin, router.push]);

  const resourceData = resourceQuery.data ?? dashboardQuery.data;
  const quickActions = useMemo(
    () =>
      dashboardQuery.data
        ? buildQuickActions(dashboardQuery.data, router.push, isSuperAdmin)
        : null,
    [dashboardQuery.data, isSuperAdmin, router.push],
  );
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
  }, [collapsedTreeIds, resourceData, router.push, selectedTreeId]);

  const navigateToTreeNode = (id: string) => {
    setSelectedTreeId(id);
    if (id.startsWith("folder-")) {
      const folderId = Number(id.replace("folder-", ""));
      if (resourceData) router.push(resourcePath(resourceData, folderId));
      return;
    }
    if (
      id.startsWith("session-course-") &&
      resourceData?.context.sessionCourseId
    ) {
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
    return <AdminDashboardSkeleton statCount={isSuperAdmin ? 4 : 3} />;
  }

  if (dashboardQuery.isError || !overviewViewModel || !resourceViewModel) {
    return (
      <PageContainer>
        <YStack gap="$3" py="$6" style={{ alignItems: "center" }}>
          <Text color="#B91C1C" fontSize="$body">
            Unable to load dashboard data.
          </Text>
          <Button
            onPress={() => void dashboardQuery.refetch()}
            background="#059669"
            rounded="$3"
          >
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
      selectedContext={effectiveDashboardContext}
      contextOptions={
        contextOptionsQuery.data ?? {
          organizations: [],
          sessions: [],
          sessionCourses: [],
          folders: [],
        }
      }
      contextLoading={contextOptionsQuery.isFetching}
      folders={resourceViewModel.folders}
      roles={overviewViewModel.roles}
      statistics={overviewViewModel.statistics}
      tree={resourceViewModel.tree}
      upload={buildUpload(resourceData!, router.push)}
      quickActions={quickActions!}
      onAddFolder={() =>
        router.push(
          resourceData ? folderPath(resourceData, "create") : "/admin/folders",
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
