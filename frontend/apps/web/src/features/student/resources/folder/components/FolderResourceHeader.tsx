import { ResourceSummaryItem } from "./ResourceSummaryItem";
import { FileText, FolderOpen, Play, Trophy } from "lucide-react";
import { StudentFolderResourceList } from "@repo/types";

type FolderResourceHeaderProps = {
  data: NoInfer<StudentFolderResourceList> | undefined;
};

export const FolderResourceHeader = ({ data }: FolderResourceHeaderProps) => {
  return (
    <header className="student-resource-list-hero">
      <div className="student-resource-list-hero-copy">
        <span className="student-folder-eyebrow">Course resources</span>
        <h1>{data?.folder.name ?? "Loading folder..."}</h1>
        <p>
          {data?.folder.description ??
            data?.course.name ??
            "Videos, documents and exams assigned to this folder."}
        </p>
      </div>

      <div
        className="student-resource-list-summary"
        aria-label="Resource totals"
      >
        <ResourceSummaryItem
          icon={FolderOpen}
          label="Total"
          tone="total"
          value={data?.summary.total ?? 0}
        />
        <ResourceSummaryItem
          icon={Play}
          label="Videos"
          tone="video"
          value={data?.summary.videos ?? 0}
        />
        <ResourceSummaryItem
          icon={FileText}
          label="Documents"
          tone="document"
          value={data?.summary.documents ?? 0}
        />
        <ResourceSummaryItem
          icon={Trophy}
          label="Exams"
          tone="exam"
          value={data?.summary.exams ?? 0}
        />
      </div>
    </header>
  );
};
