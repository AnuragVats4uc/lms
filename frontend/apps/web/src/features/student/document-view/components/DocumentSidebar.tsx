import type { RefObject } from "react";
import type { StudentResourceDetail } from "@repo/types";

import type { DocumentViewerHandle } from "./viewer/types";
import { DocumentDetailsCard } from "./DocumentDetailsCard";
import { ReadingProgressCard } from "./ReadingProgressCard";
import { RelatedResourcesCard } from "./RelatedResourcesCard";
import DocumentQuickActions from "./DocumentQuickActions";

type DocumentSidebarProps = {
  pageCount: number | null;
  resource: StudentResourceDetail;
  viewerRef: RefObject<DocumentViewerHandle | null>;
};

export const DocumentSidebar = ({
  pageCount,
  resource,
  viewerRef,
}: DocumentSidebarProps) => {
  return (
    <aside
      className="student-document-side-column"
      aria-label="Document information"
    >
      <DocumentDetailsCard resource={resource} pageCount={pageCount} />
      <ReadingProgressCard progress={resource.progress} />
      <DocumentQuickActions resource={resource} viewerRef={viewerRef} />
      <RelatedResourcesCard resources={resource.relatedResources} />
    </aside>
  );
};
