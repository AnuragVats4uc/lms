import { FileText } from "lucide-react";
import Link from "next/link";

export const DocumentUnavailableState = ({
  onRetry,
}: {
  onRetry: () => void;
}) => {
  return (
    <div className="student-document-state-card" role="alert">
      <FileText aria-hidden="true" size={28} />
      <h1>Document unavailable</h1>
      <p>
        This resource may not exist, may not be published, or may not belong to
        one of your enrolled courses.
      </p>
      <div>
        <button onClick={onRetry} type="button">
          Try again
        </button>
        <Link href="/student/resources">Back to resources</Link>
      </div>
    </div>
  );
};
