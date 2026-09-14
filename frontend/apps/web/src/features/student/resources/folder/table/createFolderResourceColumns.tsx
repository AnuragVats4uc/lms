import {
  CheckCircle2,
  CircleDashed,
  CircleX,
  Clock3,
  Download,
  FileText,
  Play,
  Trophy,
} from "lucide-react";
import { RESOURCE_TYPE_IDS, type StudentFolderResourceItem } from "@repo/types";

import {
  DataTableDateCell,
  DataTableExpandableText,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import { CrudBadge } from "@/features/admin/components/crud";
import {
  getResourceDetail,
  getResourceIconColors,
  getResourceStatus,
  getResourceTypeLabel,
  getResourceTypeTone,
} from "../utils/folderResourceFormatting";

export function createFolderResourceColumns(): DataTableColumn<StudentFolderResourceItem>[] {
  return [
    {
      cell: ({ row }) => <ResourceNameCell resource={row} />,
      header: "Resource",
      id: "title",
      sticky: true,
      width: 225,
    },
    {
      cell: ({ row }) => (
        <DataTableExpandableText color="#52627A" fontSize={11} lineHeight={15}>
          {row.description?.trim() || "No description provided."}
        </DataTableExpandableText>
      ),
      header: "Description",
      id: "description",
      width: 290,
    },
    {
      cell: ({ row }) => <ResourceTypeCell resource={row} />,
      header: "Type",
      id: "type",
      width: 115,
    },
    {
      cell: ({ row }) => <DataTableTextCell primary={getResourceDetail(row)} />,
      header: "Details",
      id: "details",
      width: 175,
    },
    {
      cell: ({ row }) => <ResourceStatusCell resource={row} />,
      header: "Progress / Status",
      id: "status",
      width: 165,
    },
    {
      cell: ({ row }) => <DataTableDateCell value={row.createdAt} />,
      header: "Added",
      id: "createdAt",
      width: 130,
    },
  ];
}

function ResourceNameCell({
  resource,
}: {
  resource: StudentFolderResourceItem;
}) {
  const isVideo = resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO;
  const isDocument = resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT;
  const Icon = isVideo ? Play : isDocument ? FileText : Trophy;
  const tone = isVideo ? "video" : isDocument ? "document" : "exam";
  const colors = getResourceIconColors(tone);
  return (
    <div
      className="student-resource-admin-name"
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
        gap: 9,
        minWidth: 0,
        width: "100%",
      }}
    >
      <span
        className={`student-resource-admin-icon ${tone}`}
        style={{
          alignItems: "center",
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: 7,
          color: colors.color,
          display: "inline-flex",
          flex: "0 0 30px",
          height: 30,
          justifyContent: "center",
          width: 30,
        }}
      >
        <Icon aria-hidden="true" size={15} />
      </span>
      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
        <DataTableTextCell primary={resource.title} />
      </div>
    </div>
  );
}

function ResourceTypeCell({
  resource,
}: {
  resource: StudentFolderResourceItem;
}) {
  const Icon =
    resource.resourceTypeId === RESOURCE_TYPE_IDS.VIDEO
      ? Play
      : resource.resourceTypeId === RESOURCE_TYPE_IDS.DOCUMENT
        ? FileText
        : Trophy;
  return (
    <CrudBadge tone={getResourceTypeTone(resource)}>
      <span
        style={{
          alignItems: "center",
          display: "inline-flex",
          gap: 4,
          whiteSpace: "nowrap",
        }}
      >
        <Icon aria-hidden="true" size={11} strokeWidth={2.2} />
        {getResourceTypeLabel(resource)}
      </span>
    </CrudBadge>
  );
}

function ResourceStatusCell({
  resource,
}: {
  resource: StudentFolderResourceItem;
}) {
  const status = getResourceStatus(resource);
  return (
    <div className="student-resource-admin-status">
      <CrudBadge align="start" tone={status.tone}>
        <span
          style={{
            alignItems: "center",
            display: "inline-flex",
            gap: 4,
            whiteSpace: "nowrap",
          }}
        >
          {renderStatusBadgeIcon(status.label)}
          {status.label}
        </span>
      </CrudBadge>
      {status.percentage != null ? (
        <span
          aria-label={`${status.percentage}% complete`}
          className="student-resource-admin-progress"
        >
          <i style={{ width: `${status.percentage}%` }} />
        </span>
      ) : null}
    </div>
  );
}

function renderStatusBadgeIcon(label: string) {
  const props = { "aria-hidden": true as const, size: 11, strokeWidth: 2.2 };
  if (label === "Completed" || label === "Available")
    return <CheckCircle2 {...props} />;
  if (label === "Downloadable") return <Download {...props} />;
  if (label === "Upcoming") return <Clock3 {...props} />;
  if (label === "Closed" || label === "Unavailable")
    return <CircleX {...props} />;
  return <CircleDashed {...props} />;
}
