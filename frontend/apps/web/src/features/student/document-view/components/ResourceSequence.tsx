import { StudentResourceDetail } from "@repo/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export const ResourceSequence = ({
  resource,
}: {
  resource: StudentResourceDetail;
}) => {
  return (
    <nav aria-label="Document sequence" className="student-document-sequence">
      {resource.navigation.previous ? (
        <Link href={`/student/resources/${resource.navigation.previous.id}`}>
          <ChevronLeft aria-hidden="true" size={15} /> Previous Resource
        </Link>
      ) : (
        <span />
      )}
      <strong>
        Resource {resource.navigation.current} of {resource.navigation.total}
      </strong>
      {resource.navigation.next ? (
        <Link
          className="is-next"
          href={`/student/resources/${resource.navigation.next.id}`}
        >
          Next Resource <ChevronRight aria-hidden="true" size={15} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
};
