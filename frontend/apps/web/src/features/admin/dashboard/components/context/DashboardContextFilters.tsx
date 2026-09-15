"use client";

import { XStack } from "@repo/ui";
import { useAuthSession } from "@repo/auth";
import type { DashboardContextOptions, DashboardQuery } from "@repo/types";

import { DashboardContextSelect } from "./DashboardContextSelect";

interface DashboardContextFiltersProps {
  contextLoading?: boolean;
  contextOptions: DashboardContextOptions;
  onContextChange?: (context: DashboardQuery) => void;
  selectedContext: DashboardQuery;
}

export const DashboardContextFilters = ({
  contextLoading = false,
  contextOptions,
  onContextChange,
  selectedContext,
}: DashboardContextFiltersProps) => {
  const { currentUser } = useAuthSession();
  const changeContext = (key: keyof DashboardQuery, value: string) => {
    if (!onContextChange) return;
    const id = value ? Number(value) : undefined;
    if (key === "organizationId") {
      onContextChange({ organizationId: id });
    } else if (key === "sessionId") {
      onContextChange({
        organizationId: selectedContext.organizationId,
        sessionId: id,
      });
    } else if (key === "sessionCourseId") {
      onContextChange({
        organizationId: selectedContext.organizationId,
        sessionId: selectedContext.sessionId,
        sessionCourseId: id,
      });
    } else {
      onContextChange({ ...selectedContext, folderId: id });
    }
  };

  return (
    <XStack
      className="lms-dashboard-context-selectors"
      gap="$3"
      style={{ flexWrap: "wrap" }}
    >
      {!currentUser?.organizationId ? (
        <DashboardContextSelect
          ariaLabel="Select organization"
          disabled={!contextOptions.organizations.length}
          label="Organization"
          loading={contextLoading}
          onChange={(value) => changeContext("organizationId", value)}
          options={contextOptions.organizations.map((item) => ({
            label: item.name,
            value: String(item.id),
          }))}
          value={
            selectedContext.organizationId
              ? String(selectedContext.organizationId)
              : ""
          }
          width={220}
        />
      ) : null}
      <DashboardContextSelect
        ariaLabel="Select academic session"
        disabled={!contextOptions.sessions.length}
        label="Session"
        loading={contextLoading}
        onChange={(value) => changeContext("sessionId", value)}
        options={contextOptions.sessions.map((item) => ({
          label: item.code ? `${item.name} · ${item.code}` : item.name,
          value: String(item.id),
        }))}
        value={
          selectedContext.sessionId ? String(selectedContext.sessionId) : ""
        }
        width={190}
      />
      <DashboardContextSelect
        ariaLabel="Select course"
        disabled={!contextOptions.sessionCourses.length}
        label="Course"
        loading={contextLoading}
        onChange={(value) => changeContext("sessionCourseId", value)}
        options={contextOptions.sessionCourses.map((item) => ({
          label: item.displayName ?? item.course.name,
          value: String(item.id),
        }))}
        value={
          selectedContext.sessionCourseId
            ? String(selectedContext.sessionCourseId)
            : ""
        }
        width={240}
      />
      <DashboardContextSelect
        ariaLabel="Select folder"
        disabled={!contextOptions.folders.length}
        label="Folder"
        loading={contextLoading}
        onChange={(value) => changeContext("folderId", value)}
        options={contextOptions.folders.map((item) => ({
          label: item.parentFolderId ? `↳ ${item.name}` : item.name,
          value: String(item.id),
        }))}
        value={selectedContext.folderId ? String(selectedContext.folderId) : ""}
        width={210}
      />
    </XStack>
  );
};
