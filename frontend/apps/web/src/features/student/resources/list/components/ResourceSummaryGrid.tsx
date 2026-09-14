import {
  RESOURCE_TYPE_IDS,
  ResourceTypeId,
  StudentResourceList,
} from "@repo/types";
import { ResourceSummaryCard } from "./ResourceSummaryCard";
import { FileText, FolderOpen, Trophy, Video } from "lucide-react";
import { UseQueryResult } from "@tanstack/react-query";
import { percentageLabel } from "../utils/resourceFormatting";

type ResourceSummaryGridProps = {
  data: NoInfer<StudentResourceList> | undefined;
  initialResourceTypeId: ResourceTypeId | undefined;
  resourcesQuery: UseQueryResult<NoInfer<StudentResourceList>, Error>;
};

export const ResourceSummaryGrid = ({
  data,
  initialResourceTypeId,
  resourcesQuery,
}: ResourceSummaryGridProps) => {
  return (
    <div
      className={`student-resource-summary-grid ${
        initialResourceTypeId === RESOURCE_TYPE_IDS.EXAM
          ? "student-exam-summary-grid"
          : ""
      }`.trim()}
    >
      {initialResourceTypeId === RESOURCE_TYPE_IDS.EXAM ? (
        <ResourceSummaryCard
          Icon={Trophy}
          label="Assigned Exams"
          loading={resourcesQuery.isLoading}
          tone="green"
          value={data?.summary.exams ?? 0}
          supportingText="Through your active course enrollments"
        />
      ) : (
        <>
          <ResourceSummaryCard
            Icon={FolderOpen}
            label="Total Resources"
            loading={resourcesQuery.isLoading}
            tone="green"
            value={data?.summary.total ?? 0}
            supportingText="Across your enrolled courses"
          />
          <ResourceSummaryCard
            Icon={Video}
            label="Videos"
            loading={resourcesQuery.isLoading}
            tone="purple"
            value={data?.summary.videos ?? 0}
            supportingText={percentageLabel(
              data?.summary.videos ?? 0,
              data?.summary.total ?? 0,
            )}
          />
          <ResourceSummaryCard
            Icon={FileText}
            label="Documents"
            loading={resourcesQuery.isLoading}
            tone="orange"
            value={data?.summary.documents ?? 0}
            supportingText={percentageLabel(
              data?.summary.documents ?? 0,
              data?.summary.total ?? 0,
            )}
          />
          <ResourceSummaryCard
            Icon={Trophy}
            label="Exams"
            loading={resourcesQuery.isLoading}
            tone="green"
            value={data?.summary.exams ?? 0}
            supportingText={percentageLabel(
              data?.summary.exams ?? 0,
              data?.summary.total ?? 0,
            )}
          />
        </>
      )}
    </div>
  );
};
