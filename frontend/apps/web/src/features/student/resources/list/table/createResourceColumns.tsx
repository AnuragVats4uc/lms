import Link from "next/link";
import { FileText, MoreVertical, Play, Trophy } from "lucide-react";
import type { ResourceTypeCode, StudentResourceItem } from "@repo/types";
import { XStack, YStack } from "@repo/ui";
import { AppBadge } from "@repo/ui/primitives";

import {
  DataTableAvatarCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import {
  formatEnum,
  formatSizeOrDuration,
  resourceFormat,
  resourcePath,
  statusTone,
} from "../utils/resourceFormatting";

export function createResourceColumns(): DataTableColumn<StudentResourceItem>[] {
  return [
    {
      cell: ({ row }) => <ResourceCell resource={row} />,
      header: "Resource",
      id: "resource",
      sticky: true,
      width: 280,
    },
    {
      cell: ({ row }) => (
        <ResourceTypeCell
          label={row.resourceType.name}
          type={row.resourceType.code}
        />
      ),
      header: "Type",
      id: "type",
      width: 100,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell
          primary={row.course.name}
          secondary={row.course.sessionName}
        />
      ),
      header: "Course",
      id: "course",
      width: 165,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell primary={row.subject.name || "—"} />
      ),
      header: "Subject",
      id: "subject",
      width: 135,
    },
    {
      cell: ({ row }) =>
        row.uploadedBy ? (
          <DataTableAvatarCell
            imageSrc={row.uploadedBy.avatar ?? undefined}
            label={row.uploadedBy.name}
          />
        ) : (
          <DataTableTextCell primary="—" />
        ),
      header: "Uploaded By",
      id: "uploadedBy",
      width: 120,
    },
    {
      cell: ({ row }) => <UploadDateCell value={row.createdAt} />,
      header: "Upload Date",
      id: "createdAt",
      width: 130,
    },
    {
      cell: ({ row }) => (
        <DataTableTextCell primary={formatSizeOrDuration(row)} />
      ),
      header: "Size / Duration",
      id: "sizeOrDuration",
      width: 120,
    },
    {
      cell: ({ row }) => (
        <AppBadge tone={statusTone(row.status)}>
          {formatEnum(row.status)}
        </AppBadge>
      ),
      header: "Status",
      id: "status",
      width: 105,
    },
    {
      align: "center",
      cell: ({ row }) => <ResourceAction resource={row} />,
      header: "Actions",
      id: "actions",
      meta: { stickyEnd: true },
      width: 76,
    },
  ];
}

function ResourceCell({ resource }: { resource: StudentResourceItem }) {
  const path = resourcePath(resource);

  return (
    <XStack className="student-resource-cell">
      {resource.resourceType.code === "VIDEO" && resource.thumbnail ? (
        <div
          aria-label={`${resource.title} thumbnail`}
          className="student-resource-thumbnail"
          role="img"
          style={{ backgroundImage: `url("${resource.thumbnail}")` }}
        >
          <span>
            <Play aria-hidden="true" fill="currentColor" size={12} />
          </span>
        </div>
      ) : (
        <div
          className={`student-resource-file-icon ${resource.resourceType.code.toLowerCase()}`}
        >
          {resource.resourceType.code === "EXAM" ? (
            <Trophy aria-hidden="true" size={18} />
          ) : (
            <FileText aria-hidden="true" size={18} />
          )}
          <small>{resourceFormat(resource)}</small>
        </div>
      )}
      <YStack className="student-resource-cell-copy">
        {path ? (
          <Link href={path}>{resource.title}</Link>
        ) : (
          <strong>{resource.title}</strong>
        )}
        <span>
          {resource.resourceType.name} · {resourceFormat(resource)}
        </span>
      </YStack>
    </XStack>
  );
}

function ResourceTypeCell({
  label,
  type,
}: {
  label: string;
  type: ResourceTypeCode;
}) {
  const Icon = type === "VIDEO" ? Play : type === "EXAM" ? Trophy : FileText;
  return (
    <XStack className={`student-resource-type-cell ${type.toLowerCase()}`}>
      <span className="student-resource-type-icon">
        <Icon aria-hidden="true" size={13} strokeWidth={2.2} />
      </span>
      <span className="student-resource-type-label">{label}</span>
    </XStack>
  );
}

function UploadDateCell({ value }: { value: string }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <DataTableTextCell primary="—" />;

  return (
    <DataTableTextCell
      primary={new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date)}
      secondary={new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date)}
    />
  );
}

function ResourceAction({ resource }: { resource: StudentResourceItem }) {
  const path = resourcePath(resource);
  return path ? (
    <Link
      aria-label={`Open ${resource.title}`}
      className="student-resource-action"
      href={path}
    >
      <MoreVertical aria-hidden="true" size={18} strokeWidth={2.2} />
    </Link>
  ) : (
    <span className="student-resource-no-action">—</span>
  );
}
