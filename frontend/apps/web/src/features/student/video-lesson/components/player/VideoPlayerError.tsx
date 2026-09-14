import { RotateCcw, Video } from "lucide-react";

export const VideoPlayerError = ({
  onRetryError,
}: {
  onRetryError: () => void;
}) => {
  return (
    <div className="student-video-player-error" role="alert">
      <Video aria-hidden="true" size={34} />
      <strong>Unable to load this video</strong>
      <span>The video source could not be reached.</span>
      <button onClick={onRetryError} type="button">
        <RotateCcw aria-hidden="true" size={15} /> Retry video
      </button>
    </div>
  );
};
