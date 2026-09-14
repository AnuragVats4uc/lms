import type { RefObject } from "react";
import type { StudentResourceDetail } from "@repo/types";
import { Download, Expand } from "lucide-react";

import type { DocumentViewerHandle } from "./viewer/types";

type DocumentQuickActionsProps = {
  resource: StudentResourceDetail;
  viewerRef: RefObject<DocumentViewerHandle | null>;
};

const DocumentQuickActions = ({
  resource,
  viewerRef,
}: DocumentQuickActionsProps) => {
  return (
    <section className="student-document-card student-document-actions-card">
      <h2>Quick Actions</h2>
      <div>
        {resource.isDownloadable ? (
          <button onClick={() => viewerRef.current?.download()} type="button">
            <Download aria-hidden="true" size={16} />
            Download PDF
          </button>
        ) : null}
        <button
          onClick={() => viewerRef.current?.enterFullscreen()}
          type="button"
        >
          <Expand aria-hidden="true" size={16} />
          Open in Full Screen
        </button>
      </div>
    </section>
  );
};

export default DocumentQuickActions;
