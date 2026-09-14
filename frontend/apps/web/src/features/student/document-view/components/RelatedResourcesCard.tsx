import { StudentRelatedResource } from "@repo/types";
import { ChevronRight, FileText, Play } from "lucide-react";
import Link from "next/link";

export const RelatedResourcesCard = ({
  resources,
}: {
  resources: StudentRelatedResource[];
}) => {
  return (
    <section className="student-document-card student-document-related-card">
      <div className="student-document-card-heading">
        <h2>Related Resources</h2>
        <Link href="/student/resources">
          View All <ChevronRight size={13} />
        </Link>
      </div>
      {resources.length ? (
        <ul>
          {resources.map((resource) => (
            <li key={resource.id}>
              <span className={resource.resourceType.code.toLowerCase()}>
                {resource.resourceType.code === "VIDEO" ? (
                  <Play size={13} />
                ) : (
                  <FileText size={13} />
                )}
              </span>
              {resource.resourceType.code === "DOCUMENT" ? (
                <Link href={`/student/resources/${resource.id}`}>
                  {resource.title}
                </Link>
              ) : resource.resourceType.code === "VIDEO" ? (
                <Link href={`/student/resources/${resource.id}/video`}>
                  {resource.title}
                </Link>
              ) : (
                <span>{resource.title}</span>
              )}
              <small>{resource.resourceType.name}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="student-document-related-empty">
          No other published resources are available in this subject.
        </p>
      )}
    </section>
  );
};
