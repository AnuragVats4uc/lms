import { Video } from "lucide-react";
import Link from "next/link";

export const VideoUnavailableState = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <div className="student-video-state-card" role="alert">
      <Video aria-hidden="true" size={30} />
      <h1>Video unavailable</h1>
      <p>
        This lesson may not exist, may not be published, or may not belong to
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
