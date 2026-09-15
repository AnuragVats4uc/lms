import { ArrowRight, type LucideIcon } from "lucide-react";
import type { StudentActivityResourceBreakdown } from "@repo/types";
import styles from "../../styles/StudentActivityReportPage.module.css";
import {
  formatDateTime,
  formatDuration,
  formatLabel,
} from "../../utils/activityReportFormatting";
import { resourceTone } from "../../utils/resourcePresentation";

export const ResourceTableRows = ({
  expanded,
  onToggle,
  resource,
  resourceIcon: Icon,
  engagement,
}: {
  expanded: boolean;
  onToggle: () => void;
  resource: StudentActivityResourceBreakdown;
  resourceIcon: LucideIcon;
  engagement: number;
}) => {
  return (
    <>
      <tr className={expanded ? styles.expandedResource : undefined}>
        <td>
          <div className={styles.resourceName}>
            <span
              className={`${styles.resourceIcon} ${styles[resourceTone(resource.resourceType)]}`}
            >
              <Icon aria-hidden="true" size={15} />
            </span>
            <strong>{resource.resourceTitle}</strong>
          </div>
        </td>
        <td>
          <span
            className={`${styles.typeBadge} ${styles[resourceTone(resource.resourceType)]}`}
          >
            {formatLabel(resource.resourceType)}
          </span>
        </td>
        <td>{resource.courseName ?? "—"}</td>
        <td>{resource.sessionCount}</td>
        <td>{formatDuration(resource.activeDurationSeconds)}</td>
        <td>{formatDuration(resource.idleDurationSeconds)}</td>
        <td>
          <div className={styles.engagementCell}>
            <strong>{engagement}%</strong>
            <span>
              <i style={{ width: `${engagement}%` }} />
            </span>
          </div>
        </td>
        <td>
          {resource.lastActivityAt
            ? formatDateTime(resource.lastActivityAt)
            : "—"}
        </td>
        <td>
          <button
            aria-expanded={expanded}
            aria-label={`View ${resource.resourceTitle} details`}
            className={styles.rowAction}
            onClick={onToggle}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={15} />
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className={styles.resourceDetailRow}>
          <td colSpan={9}>
            <div>
              <span>
                <strong>{engagement}%</strong> engagement
              </span>
              <span>
                <strong>{resource.sessionCount}</strong> resource sessions
              </span>
              <span>
                <strong>
                  {formatDuration(
                    resource.activeDurationSeconds +
                      resource.idleDurationSeconds,
                  )}
                </strong>{" "}
                total tracked time
              </span>
              <small>
                Engagement is active time divided by active plus idle time.
                Session, page, video, and exam details remain available in the
                exported workbook.
              </small>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
};
