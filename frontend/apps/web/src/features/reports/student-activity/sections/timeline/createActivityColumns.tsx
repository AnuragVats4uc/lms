import type { StudentActivityTimelineItem } from "@repo/types";
import {
  DataTableDateCell,
  DataTableTextCell,
  type DataTableColumn,
} from "@/components/DataTable";
import styles from "../../styles/StudentActivityReportPage.module.css";
import {
  formatDuration,
  formatLabel,
} from "../../utils/activityReportFormatting";

export const createActivityColumns =
  (): DataTableColumn<StudentActivityTimelineItem>[] => {
    return [
      {
        cell: ({ row }) => (
          <DataTableDateCell
            options={{ dateStyle: "medium", timeStyle: "short" }}
            value={row.occurredAt}
          />
        ),
        header: "Date & time",
        id: "occurredAt",
        sticky: true,
        width: 180,
      },
      {
        cell: ({ row }) => (
          <div className={styles.activityCell}>
            <span
              className={`${styles.categoryBadge} ${styles[row.category.toLowerCase()]}`}
            >
              {row.category}
            </span>
            <strong>{row.title}</strong>
            {row.reason ? <small>{formatLabel(row.reason)}</small> : null}
          </div>
        ),
        header: "Activity",
        id: "activity",
        width: 220,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={
              row.landingCardTitle ??
              row.resourceTitle ??
              row.courseName ??
              "Student session"
            }
            secondary={[
              row.landingCardCta ? `CTA: ${row.landingCardCta}` : null,
              row.courseName && row.resourceTitle ? row.courseName : null,
              row.pageNumber ? `Page ${row.pageNumber}` : null,
              row.videoPositionSeconds != null
                ? `Position ${formatDuration(row.videoPositionSeconds)}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        ),
        header: "Context",
        id: "context",
        width: 270,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={
              row.activeDurationDeltaSeconds
                ? formatDuration(row.activeDurationDeltaSeconds)
                : "—"
            }
            secondary="Active duration"
          />
        ),
        header: "Duration",
        id: "duration",
        width: 140,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={
              [row.deviceType, row.browser]
                .filter((value): value is string => Boolean(value))
                .map(formatLabel)
                .join(" · ") || "Unknown device"
            }
            secondary={row.operatingSystem ?? row.userAgent ?? "—"}
          />
        ),
        header: "Device",
        id: "device",
        width: 230,
      },
      {
        cell: ({ row }) => (
          <DataTableTextCell
            primary={row.ipAddress ?? "—"}
            secondary={row.outcome ?? ""}
          />
        ),
        header: "IP address",
        id: "ipAddress",
        width: 160,
      },
    ];
  };
