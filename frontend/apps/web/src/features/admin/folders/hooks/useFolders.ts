import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { foldersApi, sessionCoursesApi } from "@repo/api";

import { flattenFolderTree } from "../utils/folderTree";

export const useFolders = ({
  selectedSessionCourseId,
  selectedSessionId,
}: {
  selectedSessionCourseId: number | null;
  selectedSessionId: number | null;
}) => {
  const sessionCoursesQuery = useQuery({
    enabled: selectedSessionId !== null,
    queryFn: () =>
      sessionCoursesApi.findAll(selectedSessionId as number, {
        limit: 100,
        page: 1,
      }),
    queryKey: ["admin", "folder-session-courses", selectedSessionId],
    staleTime: 60_000,
  });
  const sessionCourses = useMemo(
    () => sessionCoursesQuery.data?.items ?? [],
    [sessionCoursesQuery.data?.items],
  );
  const effectiveSessionCourseId =
    selectedSessionCourseId ?? sessionCourses[0]?.id ?? null;
  const folderTreeQuery = useQuery({
    enabled: effectiveSessionCourseId !== null,
    queryFn: () => foldersApi.findTree(effectiveSessionCourseId as number),
    queryKey: ["admin", "folder-tree", effectiveSessionCourseId],
    staleTime: 30_000,
  });
  const tree = useMemo(
    () => folderTreeQuery.data ?? [],
    [folderTreeQuery.data],
  );
  const folders = useMemo(() => flattenFolderTree(tree), [tree]);
  return {
    effectiveSessionCourseId,
    folders,
    folderTreeQuery,
    sessionCourses,
    sessionCoursesQuery,
    tree,
  };
};
