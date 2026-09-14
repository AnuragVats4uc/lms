import type { StudentVideoUpNextResource } from "@repo/types";

import { UpNextResourceCard } from "./UpNextResourceCard";

export const UpNextSection = ({
  resources,
}: {
  resources: StudentVideoUpNextResource[];
}) => (
  <section className="student-video-up-next">
    <h2>Up Next</h2>
    {resources.length ? (
      <div className="student-video-up-next-grid">
        {resources.map((resource) => (
          <UpNextResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    ) : (
      <p className="student-video-up-next-empty">
        You have reached the end of the published resources in this course.
      </p>
    )}
  </section>
);
