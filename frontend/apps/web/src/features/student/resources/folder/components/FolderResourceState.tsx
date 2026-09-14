import { RefreshCw } from "lucide-react";

export const FolderResourceState = ({
  label,
  onRetry,
}: {
  label: string;
  onRetry: () => void;
}) =>{
  return (
    <div className="student-folder-state" role="alert">
      <RefreshCw aria-hidden="true" size={22} />
      <strong>{label}</strong>
      <button onClick={onRetry} type="button">
        Retry
      </button>
    </div>
  );
}
