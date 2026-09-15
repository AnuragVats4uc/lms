import type { StudentActivityResourceBreakdown } from "@repo/types";
import styles from "../../styles/StudentActivityReportPage.module.css";
import { engagementPercent } from "../../utils/engagementPercent";
import {
  formatDuration,
  formatLabel,
} from "../../utils/activityReportFormatting";
import {
  resourceIcon,
  resourceKey,
  resourceTone,
} from "../../utils/resourcePresentation";

export const ResourceEngagementRows = ({
  resources,
}: {
  resources: StudentActivityResourceBreakdown[];
}) => {
  return (
    <div className={styles.engagementRows}>
      {resources.length ? (
        resources.map((resource, index) => {
          const Icon = resourceIcon(resource.resourceType);
          const engagement = engagementPercent(resource);
          const total =
            resource.activeDurationSeconds + resource.idleDurationSeconds;
          const idle = total ? 100 - engagement : 0;
          return (
            <article key={resourceKey(resource, index)}>
              <div className={styles.resourceName}>
                <span
                  className={`${styles.resourceIcon} ${styles[resourceTone(resource.resourceType)]}`}
                >
                  <Icon aria-hidden="true" size={15} />
                </span>
                <div>
                  <strong>{resource.resourceTitle}</strong>
                  <small>
                    {formatLabel(resource.resourceType)} ·{" "}
                    {resource.sessionCount} visits
                  </small>
                </div>
              </div>
              <span>{formatDuration(resource.activeDurationSeconds)}</span>
              <span>{formatDuration(resource.idleDurationSeconds)}</span>
              <div
                className={styles.splitBar}
                title={`${engagement}% active, ${idle}% idle`}
              >
                <i style={{ width: `${engagement}%` }} />
                <b style={{ width: `${idle}%` }} />
              </div>
            </article>
          );
        })
      ) : (
        <div className={styles.chartEmpty}>
          Activity will appear after this student opens a document or starts a
          video.
        </div>
      )}
    </div>
  );
};
