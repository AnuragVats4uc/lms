"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BarChart3,
  BookOpen,
  ExternalLink,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Button, Text, XStack, YStack } from "@repo/ui";
import type { Organization } from "@repo/types";

import {
  DataTableAvatarCell,
  DataTableBadgeCell,
  DataTableDateCell,
  DataTableEmailCell,
  DataTableNumberCell,
  DataTablePhoneCell,
  DataTableTextCell,
  DataTableWebsiteCell,
  type DataTableColumn,
} from "@/components/DataTable";

export type OrganizationSyncStatus = "SYNCED" | "PENDING" | "FAILED";

export interface OrganizationAdministrator {
  avatar?: string;
  email: string;
  name: string;
}

export interface OrganizationMetrics {
  courses: number;
  resources: number;
  storageLimitGb: number;
  storageUsedGb: number;
  students: number;
  users: number;
}

export interface OrganizationTableRow extends Organization {
  domain: string | null;
  metrics: OrganizationMetrics;
  primaryAdministrator: OrganizationAdministrator | null;
  syncStatus: OrganizationSyncStatus;
}

export interface OrganizationRowActionHandlers {
  onAssignCourses: (organization: OrganizationTableRow) => void;
  onDelete: (organization: OrganizationTableRow) => void;
  onEdit: (organization: OrganizationTableRow) => void;
  onManageUsers: (organization: OrganizationTableRow) => void;
  onToggleActive: (organization: OrganizationTableRow) => void;
  onView: (organization: OrganizationTableRow) => void;
  onViewAnalytics: (organization: OrganizationTableRow) => void;
}

function normalizeWebsite(value: string | null) {
  if (!value) {
    return null;
  }

  return /^https?:\/\//u.test(value) ? value : `https://${value}`;
}

function getStatusTone(organization: OrganizationTableRow) {
  return organization.status === "ACTIVE" && organization.isActive
    ? "green"
    : "gray";
}

function getSyncTone(syncStatus: OrganizationSyncStatus) {
  if (syncStatus === "FAILED") {
    return "red";
  }

  return syncStatus === "PENDING" ? "orange" : "green";
}

function getSyncLabel(syncStatus: OrganizationSyncStatus) {
  return syncStatus === "SYNCED"
    ? "Synced"
    : syncStatus === "PENDING"
      ? "Pending"
      : "Failed";
}

function EmptyCell() {
  return (
    <Text color="#52627A" fontSize="$caption">
      -
    </Text>
  );
}

const menuActions = [
  {
    destructive: false,
    icon: ExternalLink,
    id: "view",
    label: "View",
  },
  {
    destructive: false,
    icon: Pencil,
    id: "edit",
    label: "Edit",
  },
  {
    destructive: false,
    icon: UsersRound,
    id: "users",
    label: "Manage Users",
  },
  {
    destructive: false,
    icon: BookOpen,
    id: "courses",
    label: "Assign Courses",
  },
  {
    destructive: false,
    icon: BarChart3,
    id: "analytics",
    label: "View Analytics",
  },
  {
    destructive: false,
    icon: Power,
    id: "toggle",
    label: "Deactivate / Activate",
  },
  {
    destructive: true,
    icon: Trash2,
    id: "delete",
    label: "Delete",
  },
] as const;

const OrganizationActionsCell = memo(function OrganizationActionsCell({
  handlers,
  organization,
}: {
  handlers: OrganizationRowActionHandlers;
  organization: OrganizationTableRow;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 206;
    const menuHeight = 292;
    const viewportPadding = 12;
    const left = Math.max(
      viewportPadding,
      Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        rect.right - menuWidth,
      ),
    );
    const hasBottomSpace =
      rect.bottom + menuHeight + viewportPadding <= window.innerHeight;

    setMenuPosition({
      left,
      top: hasBottomSpace
        ? rect.bottom + 8
        : Math.max(viewportPadding, rect.top - menuHeight - 8),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateMenuPosition();

    const handlePointerDown = (event: PointerEvent) => {
      if (
        triggerRef.current &&
        event.target instanceof Node &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleViewportChange = () => updateMenuPosition();

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, updateMenuPosition]);

  const runAction = (actionId: (typeof menuActions)[number]["id"]) => {
    setIsOpen(false);

    if (actionId === "view") handlers.onView(organization);
    if (actionId === "edit") handlers.onEdit(organization);
    if (actionId === "users") handlers.onManageUsers(organization);
    if (actionId === "courses") handlers.onAssignCourses(organization);
    if (actionId === "analytics") handlers.onViewAnalytics(organization);
    if (actionId === "toggle") handlers.onToggleActive(organization);
    if (actionId === "delete") handlers.onDelete(organization);
  };

  return (
    <div
      ref={triggerRef}
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Button
        aria-expanded={isOpen}
        aria-label={`Open actions for ${organization.name}`}
        background="#FFFFFF"
        borderColor="#D8E1EC"
        borderWidth={1}
        height={34}
        hoverStyle={{ background: "#F8FBFD", scale: 1.03 }}
        onPress={() => {
          updateMenuPosition();
          setIsOpen((current) => !current);
        }}
        pressStyle={{ scale: 0.98 }}
        rounded="$3"
        width={34}
      >
        <MoreVertical aria-hidden="true" color="#0F1D3A" size={16} />
      </Button>

      {isOpen ? (
        <YStack
          className="lms-organization-row-menu"
          p="$2"
          role="menu"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FBFDFD 100%)",
            borderColor: "#D8E1EC",
            borderRadius: 12,
            borderWidth: 1,
            boxShadow:
              "0 20px 44px rgba(15, 23, 42, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.92)",
            gap: 2,
            left: menuPosition.left,
            minWidth: 206,
            position: "fixed",
            top: menuPosition.top,
            zIndex: 1000,
          }}
        >
          {menuActions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                aria-label={action.label}
                background="transparent"
                chromeless
                height={36}
                key={action.id}
                onPress={() => runAction(action.id)}
                px="$2"
                rounded="$3"
                style={{ alignItems: "center", justifyContent: "flex-start" }}
              >
                <Icon
                  aria-hidden="true"
                  color={action.destructive ? "#DC2626" : "#435266"}
                  size={15}
                />
                <Button.Text
                  color={action.destructive ? "#DC2626" : "#0F1D3A"}
                  fontSize="$caption"
                  fontWeight="$button"
                >
                  {action.label}
                </Button.Text>
              </Button>
            );
          })}
        </YStack>
      ) : null}
    </div>
  );
});

export function createOrganizationColumns(
  handlers: OrganizationRowActionHandlers,
): DataTableColumn<OrganizationTableRow>[] {
  return [
    {
      cell: ({ row }) => (
        <DataTableAvatarCell
          imageSrc={row.logo ?? undefined}
          label={row.name}
          subtitle={`${row.code}${row.description ? ` - ${row.description}` : ""}`}
        />
      ),
      header: "Organization",
      id: "organization",
      searchable: true,
      sticky: true,
      width: 280,
    },
    {
      cell: ({ row }) =>
        row.primaryAdministrator ? (
          <DataTableAvatarCell
            imageSrc={row.primaryAdministrator.avatar}
            label={row.primaryAdministrator.name}
            subtitle={row.primaryAdministrator.email}
          />
        ) : (
          <DataTableTextCell
            primary="Not assigned"
            secondary="No administrator"
          />
        ),
      header: "Primary Administrator",
      id: "administrator",
      width: 240,
    },
    {
      cell: ({ row }) =>
        row.email ? <DataTableEmailCell href={row.email} /> : <EmptyCell />,
      header: "Email",
      id: "email",
      searchable: true,
      width: 240,
    },
    {
      cell: ({ row }) => <DataTablePhoneCell value={row.phone} />,
      header: "Phone",
      id: "phone",
      width: 160,
    },
    {
      cell: ({ row }) => {
        const website = normalizeWebsite(row.website);

        return website ? (
          <DataTableWebsiteCell href={website} label={row.domain ?? website} />
        ) : (
          <EmptyCell />
        );
      },
      header: "Website",
      id: "website",
      width: 180,
    },
    {
      align: "right",
      cell: ({ row }) => <DataTableNumberCell value={row.metrics.users} />,
      header: "Users",
      id: "users",
      width: 96,
    },
    {
      align: "right",
      cell: ({ row }) => <DataTableNumberCell value={row.metrics.courses} />,
      header: "Courses",
      id: "courses",
      width: 104,
    },
    {
      align: "right",
      cell: ({ row }) => <DataTableNumberCell value={row.metrics.students} />,
      header: "Students",
      id: "students",
      width: 104,
    },
    {
      cell: ({ row }) => (
        <DataTableBadgeCell
          label={
            row.status === "ACTIVE" && row.isActive ? "Active" : "Inactive"
          }
          tone={getStatusTone(row)}
        />
      ),
      header: "Status",
      id: "status",
      width: 108,
    },
    {
      cell: ({ row }) => (
        <DataTableBadgeCell
          label={getSyncLabel(row.syncStatus)}
          tone={getSyncTone(row.syncStatus)}
        />
      ),
      header: "Sync Status",
      id: "syncStatus",
      width: 118,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
      header: "Created",
      id: "createdAt",
      width: 126,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.updatedAt} />,
      header: "Updated",
      id: "updatedAt",
      width: 126,
    },
    {
      align: "center",
      cell: ({ row }) => (
        <OrganizationActionsCell handlers={handlers} organization={row} />
      ),
      header: "Actions",
      id: "actions",
      meta: { stickyEnd: true },
      width: 76,
    },
  ];
}

export function OrganizationHeaderAction({
  children,
  icon,
  onPress,
  primary,
}: {
  children: string;
  icon?: ReactNode;
  onPress?: () => void;
  primary?: boolean;
}) {
  return (
    <Button
      aria-label={children}
      background={primary ? "#059669" : "#FFFFFF"}
      borderColor={primary ? "#059669" : "#D8E1EC"}
      borderWidth={1}
      height={42}
      hoverStyle={{
        background: primary ? "#047857" : "#F8FBFD",
        scale: 1.01,
      }}
      onPress={onPress}
      pressStyle={{ scale: 0.98 }}
      px="$4"
      rounded="$4"
      style={{
        boxShadow: primary
          ? "0 10px 18px rgba(5, 150, 105, 0.18)"
          : "0 8px 20px rgba(15, 23, 42, 0.035)",
        transition: "transform 160ms ease, background-color 160ms ease",
      }}
    >
      {icon}
      <Button.Text
        color={primary ? "#FFFFFF" : "#0F1D3A"}
        fontSize="$caption"
        fontWeight="$button"
      >
        {children}
      </Button.Text>
    </Button>
  );
}
