"use client";

import { NotificationCategoryGrid } from "./components/NotificationCategoryGrid";
import { NotificationDeliveryNotice } from "./components/NotificationDeliveryNotice";
import { NotificationsHero } from "./components/NotificationsHero";
import { NotificationsInbox } from "./components/NotificationsInbox";
import { NotificationsErrorState } from "./components/states/NotificationsErrorState";
import { NotificationsLoadingState } from "./components/states/NotificationsLoadingState";
import { useStudentNotifications } from "./hooks/useStudentNotifications";
import styles from "./StudentNotificationsPage.module.css";

export const StudentNotificationsPage = () => {
  const {
    applyCategory,
    applyReadStatus,
    category,
    clearFilters,
    data,
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
  } = useStudentNotifications();

  if (notificationsQuery.isLoading) return <NotificationsLoadingState />;

  if (notificationsQuery.isError || !data) {
    return (
      <NotificationsErrorState
        onRetry={() => void notificationsQuery.refetch()}
      />
    );
  }

  const updatingNotificationUuid = updateMutation.isPending
    ? (updateMutation.variables?.notification.uuid ?? null)
    : null;

  return (
    <main className={styles.page}>
      <NotificationsHero
        isMarkingAllRead={markAllMutation.isPending}
        onMarkAllRead={() => markAllMutation.mutate()}
        unreadCount={data.summary.unread}
      />
      <NotificationDeliveryNotice enabled={data.delivery.inAppEnabled} />
      <NotificationCategoryGrid
        activeCategory={category}
        data={data}
        onCategoryChange={applyCategory}
      />
      <NotificationsInbox
        category={category}
        data={data}
        deferredSearch={deferredSearch}
        groups={groups}
        isFetching={notificationsQuery.isFetching}
        onClearFilters={clearFilters}
        onPageChange={setPage}
        onReadStatusChange={applyReadStatus}
        onRefresh={() => void notificationsQuery.refetch()}
        onSearchChange={updateSearch}
        onToggleRead={(notification, isRead) =>
          updateMutation.mutate({ notification, isRead })
        }
        page={page}
        readStatus={readStatus}
        search={search}
        updatingNotificationUuid={updatingNotificationUuid}
      />
    </main>
  );
};
