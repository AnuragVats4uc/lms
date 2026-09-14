import { StudentVideoProgress } from "@repo/types";
import { formatLastWatched } from "../utils/formatLastWatched";
import { Check, Play } from "lucide-react";

export const VideoProgressCard = ({
  onContinue,
  progress,
}: {
  onContinue: () => void;
  progress: StudentVideoProgress;
}) => {
  const percentage = Math.max(0, Math.min(100, progress.percentage));
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const hasStarted = progress.currentPositionSeconds > 0;

  return (
    <section className="student-video-progress-card">
      <h2>Your Progress</h2>
      <div className="student-video-progress-body">
        <div
          aria-label={`${percentage}% completed`}
          className="student-video-progress-ring"
        >
          <svg aria-hidden="true" viewBox="0 0 104 104">
            <circle className="track" cx="52" cy="52" r={radius} />
            <circle
              className="value"
              cx="52"
              cy="52"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div>
            <strong>{percentage}%</strong>
            <span>Completed</span>
          </div>
        </div>
        <dl>
          <div>
            <dt>Last watched</dt>
            <dd>{formatLastWatched(progress.lastWatchedAt)}</dd>
          </div>
        </dl>
      </div>
      {progress.status !== "COMPLETED" ? (
        <button onClick={onContinue} type="button">
          <Play aria-hidden="true" fill="currentColor" size={14} />
          {hasStarted ? "Continue Watching" : "Start Watching"}
        </button>
      ) : (
        <div className="student-video-complete-label">
          <Check aria-hidden="true" size={15} /> Completed
        </div>
      )}
    </section>
  );
};
