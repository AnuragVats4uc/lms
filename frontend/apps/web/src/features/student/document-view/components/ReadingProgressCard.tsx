import { StudentDocumentProgress } from "@repo/types";
import { formatLastOpened } from "../utils/formatLastOpened";

export const ReadingProgressCard = ({
  progress,
}: {
  progress: StudentDocumentProgress;
}) => {
  const percentage = Math.max(0, Math.min(100, progress.percentage));
  return (
    <section className="student-document-card student-document-progress-card">
      <h2>Reading Progress</h2>
      <div className="student-document-progress-content">
        <div
          aria-label={`${percentage}% course progress`}
          className="student-document-progress-ring"
          style={
            { "--progress": `${percentage * 3.6}deg` } as React.CSSProperties
          }
        >
          <div>
            <strong>{percentage}%</strong>
            <span>Read</span>
          </div>
        </div>
        <div className="student-document-progress-copy">
          <span>Last opened</span>
          <strong>{formatLastOpened(progress.lastOpenedAt)}</strong>
          <small>
            {progress.totalPages
              ? `${progress.pagesRead} of ${progress.totalPages} pages`
              : "Calculating page progress"}
          </small>
          <div aria-hidden="true">
            <span style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
};
