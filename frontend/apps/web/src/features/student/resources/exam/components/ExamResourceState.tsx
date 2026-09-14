import { RefreshCw, Trophy } from "lucide-react";

type ExamResourceStateProps =
  { state: "loading" } | { onRetry: () => void; state: "error" };

export const ExamResourceState = (props: ExamResourceStateProps) => {
  const loading = props.state === "loading";

  return (
    <div className="student-folder-state" role={loading ? "status" : "alert"}>
      <Trophy aria-hidden="true" size={34} />
      <strong>
        {loading
          ? "Loading exam..."
          : "This exam is unavailable or is not assigned to you."}
      </strong>
      {props.state === "error" ? (
        <button
          className="student-folder-primary-button"
          onClick={props.onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={15} /> Retry
        </button>
      ) : null}
    </div>
  );
};
