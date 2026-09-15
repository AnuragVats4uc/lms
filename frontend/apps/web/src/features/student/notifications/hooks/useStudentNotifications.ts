import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type {
  StudentNotificationItem,
  StudentNotificationReadStatus,
} from "@repo/types";

import type { CategoryFilter } from "../types";
import { groupNotificationsByDate } from "../utils/groupNotificationsByDate";
import { NOTIFICATIONS_PAGE_SIZE } from "../constants";


export const useStudentNotifications = () => {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [readStatus, setReadStatus] =
    useState<StudentNotificationReadStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());

  const notificationsQuery = useQuery({
    queryKey: [
      "student-notifications",
      "list",
      category,
      readStatus,
      deferredSearch,
      page,
    ],
    queryFn: () =>
      studentsApi.findMyNotifications({
        page,
        limit: NOTIFICATIONS_PAGE_SIZE,
        types: category === "ALL" ? undefined : [category],
        status: readStatus,
        search: deferredSearch || undefined,
      }),
    staleTime: 20_000,
  });

  const refreshNotificationQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student-notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: ({
      notification,
      isRead,
    }: {
      notification: StudentNotificationItem;
      isRead: boolean;
    }) => studentsApi.updateMyNotification(notification.uuid, { isRead }),
    onSuccess: refreshNotificationQueries,
  });

  const markAllMutation = useMutation({
    mutationFn: studentsApi.markAllMyNotificationsRead,
    onSuccess: refreshNotificationQueries,
  });

  const groups = useMemo(
    () => groupNotificationsByDate(notificationsQuery.data?.items ?? []),
    [notificationsQuery.data?.items],
  );

  const applyCategory = (nextCategory: CategoryFilter) => {
    setCategory(nextCategory);
    setPage(1);
  };

  const applyReadStatus = (nextStatus: StudentNotificationReadStatus) => {
    setReadStatus(nextStatus);
    setPage(1);
  };

  const updateSearch = (nextSearch: string) => {
    setSearch(nextSearch);
    setPage(1);
  };

  const clearFilters = () => {
    setCategory("ALL");
    setReadStatus("ALL");
    setSearch("");
    setPage(1);
  };

  return {
    applyCategory,
    applyReadStatus,
    category,
    clearFilters,
    data: notificationsQuery.data,
    deferredSearch,
    groups,
    markAllMutation,
    notificationsQuery,
    page,
    readStatus,
    search,
    setPage,
    updateMutation,
    updateSearch,
  };
}
