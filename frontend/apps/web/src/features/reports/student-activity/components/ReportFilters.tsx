import styles from "../styles/StudentActivityReportPage.module.css";
import {
  StudentActivityReportData,
  StudentReportActivityType,
} from "@repo/types";
import {
  ActivityReportFilterState,
  activityReportToday,
} from "../hooks/useActivityReportFilters";
import { formatLabel } from "../utils/activityReportFormatting";
import { ReportFilterField } from "./ReportFilterField";

export const ReportFilters = ({
  draftFilters,
  onApply,
  onChange,
  onReset,
  report,
}: {
  draftFilters: ActivityReportFilterState;
  onApply: () => void;
  onChange: React.Dispatch<React.SetStateAction<ActivityReportFilterState>>;
  onReset: () => void;
  report: StudentActivityReportData;
}) => {
  return (
    <form
      className={styles.filters}
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <ReportFilterField label="From">
        <input
          max={draftFilters.to}
          onChange={(event) =>
            onChange((current) => ({ ...current, from: event.target.value }))
          }
          type="date"
          value={draftFilters.from}
        />
      </ReportFilterField>
      <ReportFilterField label="To">
        <input
          max={activityReportToday}
          min={draftFilters.from}
          onChange={(event) =>
            onChange((current) => ({ ...current, to: event.target.value }))
          }
          type="date"
          value={draftFilters.to}
        />
      </ReportFilterField>
      <ReportFilterField label="Course">
        <select
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              sessionCourseId: event.target.value,
            }))
          }
          value={draftFilters.sessionCourseId}
        >
          <option value="">All courses</option>
          {report.filterOptions.courses.map((course) => (
            <option key={course.sessionCourseId} value={course.sessionCourseId}>
              {course.name} · {course.sessionName}
            </option>
          ))}
        </select>
      </ReportFilterField>
      <ReportFilterField label="Resource type">
        <select
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              resourceType: event.target.value,
            }))
          }
          value={draftFilters.resourceType}
        >
          <option value="">All resource types</option>
          {["DOCUMENT", "VIDEO", "EXAM", ...report.filterOptions.resourceTypes]
            .filter((value, index, values) => values.indexOf(value) === index)
            .map((resourceType) => (
              <option key={resourceType} value={resourceType}>
                {formatLabel(resourceType)}
              </option>
            ))}
        </select>
      </ReportFilterField>
      <ReportFilterField label="Activity type">
        <select
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              activityType: event.target.value as
                "" | StudentReportActivityType,
            }))
          }
          value={draftFilters.activityType}
        >
          <option value="">All activity</option>
          {report.filterOptions.activityTypes.map((activityType) => (
            <option key={activityType} value={activityType}>
              {formatLabel(activityType)}
            </option>
          ))}
        </select>
      </ReportFilterField>
      <div className={styles.filterActions}>
        <button className={styles.resetButton} onClick={onReset} type="button">
          Reset
        </button>
        <button className={styles.applyButton} type="submit">
          Apply filters
        </button>
      </div>
    </form>
  );
};
