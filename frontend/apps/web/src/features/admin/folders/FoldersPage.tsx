"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { foldersApi } from "@repo/api";
import type {
  CreateFolderRequest,
  Folder,
  FolderStatus,
  UpdateFolderRequest,
} from "@repo/types";
import { folderSchema } from "@repo/validation";

import { CrudManagementPage } from "../components/crud/CrudManagementPage";
import { useAcademicSessions } from "../academic/useAcademicSessions";
import { FolderContextFilters } from "./components/context/FolderContextFilters";
import { FolderDetails } from "./components/details/FolderDetails";
import { FolderForm } from "./components/form/FolderForm";
import { FolderHierarchyPanel } from "./components/hierarchy/FolderHierarchyPanel";
import { FOLDER_STATUS_OPTIONS, INITIAL_FOLDER_FORM } from "./constants";
import { FoldersView } from "./FoldersView";
import { useFolderHierarchy } from "./hooks/useFolderHierarchy";
import { useFolderContext } from "./hooks/useFolderContext";
import { useFolders } from "./hooks/useFolders";
import { useFolderSelection } from "./hooks/useFolderSelection";
import { useFolderUrlContext } from "./hooks/useFolderUrlContext";
import { folderColumns } from "./table/folderColumns";
import { buildFolderStatistics } from "./table/folderStatistics";
import type { FolderForm as FolderFormValues } from "./types";
import { folderToForm } from "./utils/folderFormMapper";
import {
  toCreateFolderPayload,
  toUpdateFolderPayload,
} from "./utils/folderPayload";

export const FoldersPage = () => {
  const academic = useAcademicSessions();
  const { requestedSessionCourseId } = useFolderUrlContext({
    selectedOrganizationId: academic.selectedOrganizationId,
    selectedSessionId: academic.selectedSessionId,
    setSelectedOrganizationId: academic.setSelectedOrganizationId,
    setSelectedSessionId: academic.setSelectedSessionId,
  });
  const { selectedSessionCourseId, setSelectedSessionCourseId } =
    useFolderContext(requestedSessionCourseId);
  const selection = useFolderSelection();
  const { effectiveSessionCourseId, folders, sessionCourses, tree } =
    useFolders({
      selectedSessionCourseId,
      selectedSessionId: academic.selectedSessionId,
    });
  const selectedSessionCourse = sessionCourses.find(
    (item) => item.id === effectiveSessionCourseId,
  );
  const hierarchy = useFolderHierarchy({
    organizationId: academic.selectedOrganizationId,
    organizationName:
      academic.organizations.find(
        (item) => item.id === academic.selectedOrganizationId,
      )?.name ?? "Organization",
    selectedFolderId: selection.selectedFolderId,
    selectedSessionCourse,
    sessionName:
      academic.sessions.find(
        (item) => item.id === selectedSessionCourse?.sessionId,
      )?.name ?? "Session",
    tree,
  });

  const resetFolderState = () => {
    selection.clearSelection();
    hierarchy.resetExpanded();
  };
  const requireSessionCourse = <T,>(
    operation: (sessionCourseId: number) => Promise<T>,
  ) =>
    effectiveSessionCourseId === null
      ? Promise.reject(new Error("Select a session course first."))
      : operation(effectiveSessionCourseId);

  return (
    <FoldersView>
      <CrudManagementPage<
        Folder,
        FolderFormValues,
        CreateFolderRequest,
        UpdateFolderRequest
      >
        columns={folderColumns}
        create={(payload) =>
          requireSessionCourse((id) => foldersApi.create(id, payload))
        }
        description="Organize session-course content with unlimited nested folders."
        emptyDescription={
          effectiveSessionCourseId === null
            ? "Select a session course to manage folders."
            : "Create the first folder for this session course."
        }
        enabled={effectiveSessionCourseId !== null}
        entityLabel="Folder"
        formResolver={zodResolver(folderSchema)}
        getCreateForm={() => ({
          ...INITIAL_FOLDER_FORM,
          parentFolderId: selection.selectedFolderId
            ? String(selection.selectedFolderId)
            : "",
        })}
        getDisplayName={(folder) => folder.name}
        getIsActive={(folder) => folder.isActive}
        getRowId={(folder) => folder.id}
        getStats={buildFolderStatistics}
        initialForm={INITIAL_FOLDER_FORM}
        onSelectedItemChange={(folder) => {
          selection.setSelectedFolder(folder);
          selection.setSelectedFolderId(folder?.id ?? null);
        }}
        permissionPrefix="folder"
        queryFn={(query) =>
          requireSessionCourse((id) =>
            foldersApi.findAll(id, {
              limit: query.limit,
              page: query.page,
              search: query.search,
              status: query.status as FolderStatus | undefined,
            }),
          )
        }
        queryKey={["admin", "folders", effectiveSessionCourseId]}
        remove={(id) =>
          requireSessionCourse((sessionCourseId) =>
            foldersApi.remove(sessionCourseId, id),
          )
        }
        renderContext={() => (
          <FolderContextFilters
            effectiveSessionCourseId={effectiveSessionCourseId}
            onOrganizationChange={(id) => {
              academic.setSelectedOrganizationId(id);
              academic.setSelectedSessionId(null);
              setSelectedSessionCourseId(null);
              resetFolderState();
            }}
            onSessionChange={(id) => {
              academic.setSelectedSessionId(id);
              setSelectedSessionCourseId(null);
              resetFolderState();
            }}
            onSessionCourseChange={(id) => {
              setSelectedSessionCourseId(id);
              resetFolderState();
            }}
            organizations={academic.organizations}
            selectedOrganizationId={academic.selectedOrganizationId}
            selectedSessionId={academic.selectedSessionId}
            sessionCourses={sessionCourses}
            sessions={academic.sessions}
          />
        )}
        renderDetails={(folder) => <FolderDetails folder={folder} />}
        renderForm={(formContext) => (
          <FolderForm
            {...formContext}
            folders={folders.filter(
              (folder) =>
                !formContext.isEdit ||
                folder.id !== Number(formContext.form.parentFolderId),
            )}
          />
        )}
        renderTableAside={({ openCreate }) => (
          <FolderHierarchyPanel
            items={hierarchy.items}
            onAddFolder={openCreate}
            onSelectFolder={(id) => {
              selection.setSelectedFolderId(id);
              selection.setSelectedFolder(
                folders.find((folder) => folder.id === id) ?? null,
              );
            }}
            onToggleFolder={hierarchy.toggleFolder}
          />
        )}
        selectedItem={selection.selectedFolder}
        setActive={(id, active) =>
          requireSessionCourse((sessionCourseId) =>
            foldersApi.update(sessionCourseId, id, { isActive: active }),
          )
        }
        statusOptions={FOLDER_STATUS_OPTIONS}
        title="Folders"
        toCreatePayload={toCreateFolderPayload}
        toForm={folderToForm}
        toUpdatePayload={toUpdateFolderPayload}
        update={(id, payload) =>
          requireSessionCourse((sessionCourseId) =>
            foldersApi.update(sessionCourseId, id, payload),
          )
        }
      />
    </FoldersView>
  );
};

export default FoldersPage;
