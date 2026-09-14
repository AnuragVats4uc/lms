import { Clock3, UserRound, Video } from "lucide-react";
import { formatDurationLabel } from "../utils/formatDurationLabel";
import { StudentVideoResourceDetail } from "@repo/types";

export const VideoLessonHeader = ({
  resource,
}: {
  resource: StudentVideoResourceDetail;
}) => {
  return (
    <header className="student-video-heading">
      <h1>{resource.title}</h1>
      <div className="student-video-meta" aria-label="Video details">
        <span>
          <Video aria-hidden="true" size={16} /> Video
        </span>
        {resource.durationInSeconds != null ? (
          <span>
            <Clock3 aria-hidden="true" size={16} />
            {formatDurationLabel(resource.durationInSeconds)}
          </span>
        ) : null}
        {resource.instructor ? (
          <span>
            <UserRound aria-hidden="true" size={16} />
            {resource.instructor.name}
          </span>
        ) : null}
      </div>
    </header>
  );
};
