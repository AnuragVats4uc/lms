import { useState } from "react";

import { DESCRIPTION_PREVIEW_LENGTH } from "../constants/videoLesson.constants";

export const VideoAboutCard = ({
  description: rawDescription,
}: {
  description?: string | null;
}) => {
  const [expanded, setExpanded] = useState(false);
  const description = rawDescription?.trim() ?? "";
  const isLong = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription =
    isLong && !expanded
      ? `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`
      : description;

  return (
    <section className="student-video-about-card">
      <h2>About this video</h2>
      {visibleDescription ? (
        <p>{visibleDescription}</p>
      ) : (
        <p className="student-video-muted-copy">
          No description has been provided for this lesson.
        </p>
      )}
      {isLong ? (
        <button
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded ? "Show Less" : "Show More"}
        </button>
      ) : null}
    </section>
  );
};
