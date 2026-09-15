"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DataTableColumn } from "@/components/DataTable";
import type { StudentActivityTimelineItem } from "@repo/types";
import { PageContainer } from "@repo/ui/dashboard";
import { ReportFilters } from "./components/ReportFilters";
import { ReportHero } from "./components/ReportHero";
import { ReportTabs } from "./components/ReportTabs";
import { ReportErrorState } from "./components/states/ReportErrorState";
import { ReportLoadingState } from "./components/states/ReportLoadingState";
import { useActivityReportExport } from "./hooks/useActivityReportExport";
import { useActivityReportFilters } from "./hooks/useActivityReportFilters";
import { useActivityReportPagination } from "./hooks/useActivityReportPagination";
import { useActivityReportTabs } from "./hooks/useActivityReportTabs";
import { useStudentActivityReport } from "./hooks/useStudentActivityReport";
import { StudentAccessActivity } from "./sections/access/StudentAccessActivity";
import { StudentActivityOverview } from "./sections/overview/StudentActivityOverview";
import { StudentResourceActivity } from "./sections/resources/StudentResourceActivity";
import { StudentActivityTimeline } from "./sections/timeline/StudentActivityTimeline";
import { createActivityColumns } from "./sections/timeline/createActivityColumns";
import styles from "./styles/StudentActivityReportPage.module.css";

export const StudentActivityReportPage = () => {
  const router = useRouter();
  const pagination = useActivityReportPagination();
  const filterState = useActivityReportFilters(pagination.resetPage);
  const tabs = useActivityReportTabs();
  const { meta, report, reportQuery, studentId, studentUuid } =
    useStudentActivityReport(
      filterState.filters,
      pagination.page,
      pagination.limit,
    );
  const exportState = useActivityReportExport({
    filters: filterState.filters,
    report,
    studentId,
    studentUuid,
  });
  const columns = useMemo<DataTableColumn<StudentActivityTimelineItem>[]>(
    () => createActivityColumns(),
    [],
  );

  if (reportQuery.isLoading) return <ReportLoadingState />;
  if (reportQuery.isError || !report) {
    return (
      <ReportErrorState
        error={reportQuery.error}
        onGoBack={() => router.back()}
        onRetry={() => void reportQuery.refetch()}
      />
    );
  }

  return (
    <PageContainer>
      <div className={styles.reportPage}>
        <ReportHero
          exporting={exportState.exporting}
          isFetching={reportQuery.isFetching}
          onExport={exportState.downloadReport}
          onRefresh={() => void reportQuery.refetch()}
          report={report}
        />
        {exportState.exportError ? (
          <div className={styles.exportError}>{exportState.exportError}</div>
        ) : null}
        <ReportTabs activeTab={tabs.activeTab} onSelect={tabs.selectTab} />
        <ReportFilters
          draftFilters={filterState.draftFilters}
          onApply={filterState.applyFilters}
          onChange={filterState.setDraftFilters}
          onReset={filterState.resetFilters}
          report={report}
        />
        {tabs.activeTab === "overview" ? (
          <StudentActivityOverview
            onSelectTab={tabs.selectTab}
            report={report}
          />
        ) : null}
        {tabs.activeTab === "timeline" ? (
          <StudentActivityTimeline
            columns={columns}
            isFetching={reportQuery.isFetching}
            limit={pagination.limit}
            meta={meta}
            onLimitChange={pagination.changeLimit}
            onPageChange={pagination.setPage}
            page={pagination.page}
            report={report}
          />
        ) : null}
        {tabs.activeTab === "resources" ? (
          <StudentResourceActivity report={report} />
        ) : null}
        {tabs.activeTab === "access" ? (
          <StudentAccessActivity report={report} />
        ) : null}
      </div>
    </PageContainer>
  );
};
