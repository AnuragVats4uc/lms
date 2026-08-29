"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileText,
  Inbox,
  Megaphone,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "@repo/api";
import type {
  StudentNotificationCategory,
  StudentNotificationItem,
  StudentNotificationReadStatus,
  StudentNotificationsResponse,
} from "@repo/types";

import styles from "./StudentNotificationsPage.module.css";

type CategoryFilter = "ALL" | StudentNotificationCategory;

const categoryMeta: Record<
  StudentNotificationCategory,
  { icon: LucideIcon; label: string; description: string }
> = {
  EXAM: {
    icon: BookOpenCheck,
    label: "Exams",
    description: "Schedules, deadlines and results",
  },
  RESOURCE: {
    icon: FileText,
    label: "Resources",
    description: "New course learning material",
  },
  ANNOUNCEMENT: {
    icon: Megaphone,
    label: "Announcements",
    description: "Important LMS updates",
  },
  SYSTEM: {
    icon: ShieldCheck,
    label: "System",
    description: "Account and security information",
  },
};

const readFilters: Array<{
  label: string;
  value: StudentNotificationReadStatus;
}> = [
  { label: "All", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Read", value: "READ" },
];

export function StudentNotificationsPage() {
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
        limit: 10,
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

  const data = notificationsQuery.data;
  const groups = useMemo(
    () => groupNotificationsByDate(data?.items ?? []),
    [data?.items],
  );

  const applyCategory = (next: CategoryFilter) => {
    setCategory(next);
    setPage(1);
  };
  const applyReadStatus = (next: StudentNotificationReadStatus) => {
    setReadStatus(next);
    setPage(1);
  };

  if (notificationsQuery.isLoading) return <NotificationsLoadingState />;
  if (notificationsQuery.isError || !data) {
    return (
      <NotificationsErrorState
        onRetry={() => void notificationsQuery.refetch()}
      />
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>STUDENT UPDATES</span>
          <h1>Notification center</h1>
          <p>
            Keep exam deadlines, released results, learning resources and
            important account updates in one focused inbox.
          </p>
        </div>
        <div className={styles.heroActions}>
          <div aria-live="polite" className={styles.unreadSummary}>
            <span className={styles.heroBell}>
              <BellRing aria-hidden="true" size={21} />
            </span>
            <div>
              <strong>{data.summary.unread}</strong>
              <span>unread update{data.summary.unread === 1 ? "" : "s"}</span>
            </div>
          </div>
          <div className={styles.actionRow}>
            <button
              className={styles.secondaryAction}
              disabled={!data.summary.unread || markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              type="button"
            >
              <CheckCheck aria-hidden="true" size={16} />
              {markAllMutation.isPending ? "Updating…" : "Mark all read"}
            </button>
            <Link
              className={styles.settingsAction}
              href="/student/profile#preferences"
            >
              <Settings2 aria-hidden="true" size={16} />
              Preferences
            </Link>
          </div>
        </div>
      </section>

      {!data.delivery.inAppEnabled ? (
        <section className={styles.deliveryNotice}>
          <CircleAlert aria-hidden="true" size={18} />
          <div>
            <strong>In-app notifications are paused</strong>
            <span>
              Existing updates remain available, but new optional notifications
              will not be delivered.
            </span>
          </div>
          <Link href="/student/profile#preferences">Review preferences</Link>
        </section>
      ) : null}

      <section
        aria-label="Notification categories"
        className={styles.categoryGrid}
      >
        <CategoryCard
          active={category === "ALL"}
          count={totalCategoryCount(data)}
          description="Every relevant student update"
          icon={Inbox}
          label="All updates"
          onClick={() => applyCategory("ALL")}
          tone="all"
        />
        {(Object.keys(categoryMeta) as StudentNotificationCategory[]).map(
          (item) => {
            const meta = categoryMeta[item];
            return (
              <CategoryCard
                active={category === item}
                count={data.summary.byType[item]}
                description={meta.description}
                icon={meta.icon}
                key={item}
                label={meta.label}
                onClick={() => applyCategory(item)}
                tone={item.toLocaleLowerCase()}
              />
            );
          },
        )}
      </section>

      <section className={styles.inboxPanel}>
        <div className={styles.inboxHeader}>
          <div>
            <span className={styles.sectionEyebrow}>YOUR INBOX</span>
            <h2>
              {category === "ALL"
                ? "All notifications"
                : categoryMeta[category].label}
            </h2>
            <p aria-live="polite">
              {inboxDescription(category, readStatus, data.meta.total)}
            </p>
          </div>
          <button
            aria-label="Refresh notifications"
            className={styles.refreshButton}
            disabled={notificationsQuery.isFetching}
            onClick={() => void notificationsQuery.refetch()}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={
                notificationsQuery.isFetching ? styles.spinning : undefined
              }
              size={16}
            />
          </button>
        </div>

        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <Search aria-hidden="true" size={17} />
            <span className={styles.srOnly}>Search notifications</span>
            <input
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search title or message"
              type="search"
              value={search}
            />
            {search ? (
              <button
                aria-label="Clear notification search"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                type="button"
              >
                <X aria-hidden="true" size={14} />
              </button>
            ) : null}
          </label>
          <div
            aria-label="Filter notification read state"
            className={styles.statusTabs}
          >
            {readFilters.map((filter) => (
              <button
                aria-pressed={readStatus === filter.value}
                className={
                  readStatus === filter.value ? styles.activeTab : undefined
                }
                key={filter.value}
                onClick={() => applyReadStatus(filter.value)}
                type="button"
              >
                {filter.label}
                {filter.value === "UNREAD" &&
                category === "ALL" &&
                data.summary.unread ? (
                  <span>{data.summary.unread}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {groups.length ? (
          <div className={styles.notificationGroups}>
            {groups.map((group) => (
              <section className={styles.notificationGroup} key={group.label}>
                <div className={styles.groupLabel}>
                  <span>{group.label}</span>
                  <i />
                </div>
                <div className={styles.notificationList}>
                  {group.items.map((notification) => (
                    <NotificationRow
                      isUpdating={
                        updateMutation.isPending &&
                        updateMutation.variables?.notification.uuid ===
                          notification.uuid
                      }
                      key={notification.uuid}
                      notification={notification}
                      onToggleRead={(isRead) =>
                        updateMutation.mutate({ notification, isRead })
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyNotifications
            filtered={Boolean(
              deferredSearch || category !== "ALL" || readStatus !== "ALL",
            )}
            onClear={() => {
              setCategory("ALL");
              setReadStatus("ALL");
              setSearch("");
              setPage(1);
            }}
          />
        )}

        {data.meta.totalPages > 1 ? (
          <div className={styles.pagination}>
            <span>
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <div>
              <button
                aria-label="Previous notification page"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button
                aria-label="Next notification page"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function CategoryCard({
  active,
  count,
  description,
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  count: number;
  description: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone: string;
}) {
  return (
    <button
      aria-pressed={active}
      className={styles.categoryCard}
      data-active={active}
      data-tone={tone}
      onClick={onClick}
      type="button"
    >
      <span className={styles.categoryIcon}>
        <Icon aria-hidden="true" size={18} />
      </span>
      <span className={styles.categoryCopy}>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className={styles.categoryCount}>{count}</span>
    </button>
  );
}

function NotificationRow({
  isUpdating,
  notification,
  onToggleRead,
}: {
  isUpdating: boolean;
  notification: StudentNotificationItem;
  onToggleRead: (isRead: boolean) => void;
}) {
  const meta = categoryMeta[notification.type];
  const Icon = meta.icon;
  return (
    <article
      className={styles.notificationRow}
      data-read={notification.isRead}
      data-tone={notification.type.toLocaleLowerCase()}
    >
      <span className={styles.notificationIcon}>
        <Icon aria-hidden="true" size={19} />
      </span>
      <div className={styles.notificationBody}>
        <div className={styles.notificationTitleRow}>
          <div>
            <span className={styles.notificationType}>{meta.label}</span>
            {!notification.isRead ? (
              <span className={styles.unreadPill}>New</span>
            ) : null}
          </div>
          <time dateTime={notification.createdAt}>
            {relativeTime(notification.createdAt)}
          </time>
        </div>
        <h3>{notification.title}</h3>
        <p>{notification.description}</p>
        <div className={styles.notificationFooter}>
          {notification.action ? (
            <Link
              className={styles.notificationAction}
              href={notification.action.href}
              onClick={() => {
                if (!notification.isRead) onToggleRead(true);
              }}
            >
              {notification.action.label}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          ) : (
            <span className={styles.informationOnly}>Information only</span>
          )}
          <button
            className={styles.readToggle}
            disabled={isUpdating}
            onClick={() => onToggleRead(!notification.isRead)}
            type="button"
          >
            {isUpdating
              ? "Updating…"
              : notification.isRead
                ? "Mark as unread"
                : "Mark as read"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyNotifications({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className={styles.emptyState}>
      <span>
        {filtered ? (
          <Search aria-hidden="true" size={24} />
        ) : (
          <Sparkles aria-hidden="true" size={24} />
        )}
      </span>
      <h3>
        {filtered ? "No matching notifications" : "You are all caught up"}
      </h3>
      <p>
        {filtered
          ? "Try a different search, category or read-status filter."
          : "New exam, resource and account updates will appear here."}
      </p>
      {filtered ? (
        <button onClick={onClear} type="button">
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function NotificationsLoadingState() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading notifications"
      className={styles.page}
    >
      <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className={`${styles.skeleton} ${styles.skeletonCard}`}
            key={index}
          />
        ))}
      </div>
      <div className={`${styles.skeleton} ${styles.skeletonPanel}`} />
    </main>
  );
}

function NotificationsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className={`${styles.page} ${styles.errorPage}`}>
      <section className={styles.errorState}>
        <span>
          <CircleAlert aria-hidden="true" size={25} />
        </span>
        <h1>Notifications could not be loaded</h1>
        <p>Check your connection and try again. Your read state is safe.</p>
        <button onClick={onRetry} type="button">
          <RefreshCw aria-hidden="true" size={16} />
          Try again
        </button>
      </section>
    </main>
  );
}

function groupNotificationsByDate(items: StudentNotificationItem[]) {
  const groups = new Map<string, StudentNotificationItem[]>();
  for (const item of items) {
    const label = dateGroup(item.createdAt);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  return [...groups.entries()].map(([label, groupedItems]) => ({
    label,
    items: groupedItems,
  }));
}

function dateGroup(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const difference = Math.round(
    (today.getTime() - target.getTime()) / 86_400_000,
  );
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  if (difference < 7) return "Earlier this week";
  return "Earlier";
}

function relativeTime(value: string) {
  const differenceSeconds = Math.round(
    (new Date(value).getTime() - Date.now()) / 1000,
  );
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of ranges) {
    if (Math.abs(differenceSeconds) >= seconds) {
      return formatter.format(Math.round(differenceSeconds / seconds), unit);
    }
  }
  return "just now";
}

function totalCategoryCount(data: StudentNotificationsResponse) {
  return Object.values(data.summary.byType).reduce(
    (total, value) => total + value,
    0,
  );
}

function inboxDescription(
  category: CategoryFilter,
  status: StudentNotificationReadStatus,
  total: number,
) {
  const state = status === "ALL" ? "" : `${status.toLocaleLowerCase()} `;
  const categoryLabel =
    category === "ALL"
      ? "updates"
      : categoryMeta[category].label.toLocaleLowerCase();
  const singularLabel = categoryLabel.endsWith("s")
    ? categoryLabel.slice(0, -1)
    : categoryLabel;
  return `${total} ${state}${total === 1 ? singularLabel : categoryLabel}`;
}
