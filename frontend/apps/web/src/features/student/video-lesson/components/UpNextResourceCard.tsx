import Link from "next/link";
import { FileText, Play } from "lucide-react";
import type { StudentVideoUpNextResource } from "@repo/types";

import { formatDuration } from "../utils/formatDuration";
import { formatResourceType } from "../utils/formatResourceType";

export const UpNextResourceCard = ({
  resource,
}: {
  resource: StudentVideoUpNextResource;
}) => {
  const isVideo = resource.resourceType.code === "VIDEO";
  const href = isVideo
    ? `/student/resources/${resource.id}/video`
    : `/student/resources/${resource.id}`;

  return (
    <article className="student-video-next-card">
      <Link
        aria-label={`Open ${resource.title}`}
        className="student-video-next-visual"
        href={href}
        style={
          resource.thumbnail
            ? { backgroundImage: `url("${resource.thumbnail}")` }
            : undefined
        }
      >
        <span className={isVideo ? "video" : "document"}>
          {isVideo ? (
            <Play aria-hidden="true" fill="currentColor" size={18} />
          ) : (
            <FileText aria-hidden="true" size={20} />
          )}
        </span>
      </Link>
      <div className="student-video-next-copy">
        <Link href={href}>{resource.title}</Link>
        <span>
          {formatResourceType(resource)}
          {isVideo && resource.durationInSeconds != null
            ? ` · ${formatDuration(resource.durationInSeconds)}`
            : ""}
        </span>
        <Link className="student-video-next-action" href={href}>
          {isVideo ? "Play Next" : "View Document"}
        </Link>
      </div>
    </article>
  );
};
