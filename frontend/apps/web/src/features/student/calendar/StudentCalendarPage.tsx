"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  GraduationCap,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { studentsApi } from "@repo/api";
import type {
  StudentCalendarEvent,
  StudentCalendarEventStatus,
  StudentCalendarEventType,
} from "@repo/types";

import styles from "./StudentCalendarPage.module.css";

type CalendarView = "month" | "agenda";
type TypeFilter = "ALL" | StudentCalendarEventType;

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusLabels: Record<StudentCalendarEventStatus, string> = {
  UPCOMING: "Upcoming",
  AVAILABLE: "Available now",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  ACTIVE: "Active session",
  COMPLETED: "Completed",
};

export function StudentCalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [view, setView] = useState<CalendarView>("month");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [courseId, setCourseId] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] =
    useState<StudentCalendarEvent | null>(null);

  const range = useMemo(() => calendarRange(visibleMonth), [visibleMonth]);
  const calendarQuery = useQuery({
    queryKey: ["student-calendar", range.from, range.to],
    queryFn: () => studentsApi.findMyCalendar(range),
    staleTime: 60_000,
  });
  const timezone = calendarQuery.data?.timezone ?? "Asia/Kolkata";
  const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return (calendarQuery.data?.events ?? []).filter((event) => {
      if (typeFilter !== "ALL" && event.type !== typeFilter) return false;
      if (
        courseId !== "ALL" &&
        !event.courses.some((course) => course.id === courseId)
      ) {
        return false;
      }
      if (!normalizedSearch) return true;
      return [
        event.title,
        event.description,
        event.session.name,
        event.session.code,
        event.exam?.code,
        ...event.courses.flatMap((course) => [course.name, course.code]),
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch));
    });
  }, [calendarQuery.data?.events, courseId, search, typeFilter]);
  const examEvents = filteredEvents.filter((event) => event.type === "EXAM");
  const academicEvents = filteredEvents.filter(
    (event) => event.type === "ACADEMIC_SESSION",
  );
  const markersByDate = useMemo(
    () => groupExamMarkersByDate(examEvents, timezone, today),
    [examEvents, timezone, today],
  );
  const upcomingEvents = useMemo(
    () =>
      examEvents
        .filter(
          (event) =>
            event.status === "UPCOMING" || event.status === "AVAILABLE",
        )
        .sort(
          (first, second) =>
            new Date(first.startsAt).getTime() -
            new Date(second.startsAt).getTime(),
        )
        .slice(0, 5),
    [examEvents],
  );

  useEffect(() => {
    if (!selectedEvent) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedEvent(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedEvent]);

  const moveMonth = (offset: number) => {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  if (calendarQuery.isLoading) return <CalendarLoadingState />;
  if (calendarQuery.isError || !calendarQuery.data) {
    return <CalendarErrorState onRetry={() => void calendarQuery.refetch()} />;
  }

  const summary = calendarQuery.data.summary;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>STUDENT PLANNER</span>
          <h1>My calendar</h1>
          <p>
            Keep track of exam windows and your enrolled academic session in one
            reliable view.
          </p>
          <div className={styles.heroMeta}>
            <span>
              <Clock3 aria-hidden="true" size={14} />
              Times shown in {humanizeTimezone(timezone)}
            </span>
            <span>
              <GraduationCap aria-hidden="true" size={14} />
              {calendarQuery.data.availableCourses.length} enrolled course
              {calendarQuery.data.availableCourses.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div
          aria-label={formatFullDate(today, timezone)}
          className={styles.heroDate}
        >
          <CalendarDays aria-hidden="true" size={20} />
          <div>
            <strong>{formatDayNumber(today, timezone)}</strong>
            <span>{formatMonthWeekday(today, timezone)}</span>
          </div>
        </div>
      </section>

      <section aria-label="Calendar summary" className={styles.summaryGrid}>
        <SummaryCard
          icon={CalendarClock}
          label="Exams in view"
          tone="purple"
          value={summary.exams}
        />
        <SummaryCard
          icon={CalendarCheck2}
          label="Available now"
          tone="green"
          value={summary.availableExams}
        />
        <SummaryCard
          icon={CircleAlert}
          label="Closing in 7 days"
          tone="orange"
          value={summary.closingWithinSevenDays}
        />
        <SummaryCard
          icon={BookOpen}
          label="Academic sessions"
          tone="blue"
          value={summary.academicSessions}
        />
      </section>

      <section className={styles.workspace}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarPrimary}>
            <label className={styles.searchField}>
              <Search aria-hidden="true" size={17} />
              <span className={styles.srOnly}>Search calendar</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search exam or course"
                type="search"
                value={search}
              />
              {search ? (
                <button
                  aria-label="Clear calendar search"
                  onClick={() => setSearch("")}
                  type="button"
                >
                  <X aria-hidden="true" size={14} />
                </button>
              ) : null}
            </label>
            <label className={styles.selectField}>
              <SlidersHorizontal aria-hidden="true" size={15} />
              <span className={styles.srOnly}>Filter by course</span>
              <select
                onChange={(event) =>
                  setCourseId(
                    event.target.value === "ALL"
                      ? "ALL"
                      : Number(event.target.value),
                  )
                }
                value={courseId}
              >
                <option value="ALL">All courses</option>
                {calendarQuery.data.availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
            <div
              aria-label="Filter by event type"
              className={styles.filterPills}
            >
              {(
                [
                  ["ALL", "All"],
                  ["EXAM", "Exams"],
                  ["ACADEMIC_SESSION", "Sessions"],
                ] as Array<[TypeFilter, string]>
              ).map(([value, label]) => (
                <button
                  aria-pressed={typeFilter === value}
                  className={typeFilter === value ? styles.activePill : ""}
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div aria-label="Calendar view" className={styles.viewToggle}>
            <button
              aria-pressed={view === "month"}
              className={view === "month" ? styles.activeView : ""}
              onClick={() => setView("month")}
              type="button"
            >
              Month
            </button>
            <button
              aria-pressed={view === "agenda"}
              className={view === "agenda" ? styles.activeView : ""}
              onClick={() => setView("agenda")}
              type="button"
            >
              Agenda
            </button>
          </div>
        </div>

        <div className={styles.calendarHeader}>
          <div>
            <span className={styles.eyebrow}>CALENDAR VIEW</span>
            <h2>{formatMonthTitle(visibleMonth)}</h2>
          </div>
          <div className={styles.monthControls}>
            <button
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <button
              className={styles.todayButton}
              onClick={() =>
                setVisibleMonth(
                  new Date(today.getFullYear(), today.getMonth(), 1),
                )
              }
              type="button"
            >
              Today
            </button>
            <button
              aria-label="Next month"
              onClick={() => moveMonth(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
        </div>

        {academicEvents.length ? (
          <div className={styles.sessionBand}>
            <span className={styles.sessionIcon}>
              <GraduationCap aria-hidden="true" size={18} />
            </span>
            <div>
              <strong>{academicEvents[0]?.title}</strong>
              <span>
                Academic session ·{" "}
                {formatDateRange(academicEvents[0]!, timezone)}
              </span>
            </div>
            <span className={styles.sessionStatus}>
              {statusLabels[academicEvents[0]!.status]}
            </span>
          </div>
        ) : null}

        {view === "month" ? (
          <div className={styles.calendarLayout}>
            <div className={styles.monthPanel}>
              <div className={styles.weekdayRow}>
                {weekdayLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className={styles.monthGrid}>
                {monthDays.map((date) => {
                  const dateKey = localDateKey(date);
                  const markers = markersByDate.get(dateKey) ?? [];
                  const isCurrentMonth =
                    date.getMonth() === visibleMonth.getMonth();
                  const isToday = dateKey === localDateKey(today);
                  return (
                    <div
                      className={`${styles.dayCell} ${
                        isCurrentMonth ? "" : styles.outsideMonth
                      } ${isToday ? styles.todayCell : ""}`}
                      key={dateKey}
                    >
                      <div className={styles.dayNumberRow}>
                        <span className={styles.dayNumber}>
                          {date.getDate()}
                        </span>
                        {isToday ? (
                          <span className={styles.todayLabel}>Today</span>
                        ) : null}
                      </div>
                      <div className={styles.dayEvents}>
                        {markers.slice(0, 3).map((marker) => (
                          <button
                            className={styles.eventPill}
                            data-status={marker.event.status}
                            key={`${marker.event.id}:${marker.kind}`}
                            onClick={() => setSelectedEvent(marker.event)}
                            title={marker.event.title}
                            type="button"
                          >
                            <span />
                            <span className={styles.eventPillCopy}>
                              <small>{marker.kind}</small>
                              {marker.event.title}
                            </span>
                          </button>
                        ))}
                        {markers.length > 3 ? (
                          <button
                            className={styles.moreEvents}
                            onClick={() => setView("agenda")}
                            type="button"
                          >
                            +{markers.length - 3} more
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <aside className={styles.agendaPanel}>
              <div className={styles.panelHeading}>
                <div>
                  <span className={styles.eyebrow}>NEXT UP</span>
                  <h3>Upcoming exams</h3>
                </div>
                <span>{upcomingEvents.length}</span>
              </div>
              <div className={styles.agendaList}>
                {upcomingEvents.length ? (
                  upcomingEvents.map((event) => (
                    <AgendaItem
                      event={event}
                      key={event.id}
                      onOpen={() => setSelectedEvent(event)}
                      timezone={timezone}
                    />
                  ))
                ) : (
                  <CalendarEmptyState
                    filtered={Boolean(
                      search || typeFilter !== "ALL" || courseId !== "ALL",
                    )}
                  />
                )}
              </div>
            </aside>
          </div>
        ) : (
          <AgendaView
            events={filteredEvents}
            onOpen={setSelectedEvent}
            timezone={timezone}
          />
        )}
      </section>

      {selectedEvent ? (
        <EventDialog
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          timezone={timezone}
        />
      ) : null}
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  tone: "purple" | "green" | "orange" | "blue";
  value: number;
}) {
  return (
    <article className={styles.summaryCard} data-tone={tone}>
      <span className={styles.summaryIcon}>
        <Icon aria-hidden="true" size={19} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function AgendaItem({
  event,
  onOpen,
  timezone,
}: {
  event: StudentCalendarEvent;
  onOpen: () => void;
  timezone: string;
}) {
  const displayDate = new Date(
    event.status === "AVAILABLE" ? event.endsAt : event.startsAt,
  );

  return (
    <button className={styles.agendaItem} onClick={onOpen} type="button">
      <span className={styles.agendaDate}>
        <strong>{formatDayNumber(displayDate, timezone)}</strong>
        <small>{formatShortMonth(displayDate, timezone)}</small>
      </span>
      <span className={styles.agendaCopy}>
        <strong>{event.title}</strong>
        <small>{event.courses.map((course) => course.name).join(", ")}</small>
        <span>
          <Clock3 aria-hidden="true" size={12} />
          {event.status === "AVAILABLE"
            ? `Closes ${formatDateTime(event.endsAt, timezone)}`
            : `Opens ${formatDateTime(event.startsAt, timezone)}`}
        </span>
      </span>
      <ChevronRight aria-hidden="true" size={17} />
    </button>
  );
}

function AgendaView({
  events,
  onOpen,
  timezone,
}: {
  events: StudentCalendarEvent[];
  onOpen: (event: StudentCalendarEvent) => void;
  timezone: string;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, StudentCalendarEvent[]>();
    const statusOrder: Record<StudentCalendarEventStatus, number> = {
      AVAILABLE: 0,
      UPCOMING: 1,
      ACTIVE: 2,
      CLOSED: 3,
      COMPLETED: 4,
      CANCELLED: 5,
    };
    for (const event of [...events].sort(
      (first, second) =>
        statusOrder[first.status] - statusOrder[second.status] ||
        new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime(),
    )) {
      const label = agendaGroupLabel(event, timezone);
      map.set(label, [...(map.get(label) ?? []), event]);
    }
    return [...map.entries()];
  }, [events, timezone]);

  if (!groups.length) {
    return (
      <div className={styles.fullEmptyState}>
        <CalendarEmptyState filtered />
      </div>
    );
  }

  return (
    <div className={styles.fullAgenda}>
      {groups.map(([label, items]) => (
        <section className={styles.agendaGroup} key={label}>
          <h3>{label}</h3>
          <div>
            {items.map((event) => (
              <button
                className={styles.fullAgendaItem}
                data-status={event.status}
                key={event.id}
                onClick={() => onOpen(event)}
                type="button"
              >
                <span className={styles.agendaRail} />
                <span className={styles.fullAgendaIcon}>
                  {event.type === "EXAM" ? (
                    <CalendarClock aria-hidden="true" size={18} />
                  ) : (
                    <GraduationCap aria-hidden="true" size={18} />
                  )}
                </span>
                <span className={styles.fullAgendaCopy}>
                  <span>
                    <strong>{event.title}</strong>
                    <em data-status={event.status}>
                      {statusLabels[event.status]}
                    </em>
                  </span>
                  <small>{event.description ?? event.session.name}</small>
                  <span className={styles.agendaMeta}>
                    {formatDateRange(event, timezone)}
                    {event.exam
                      ? ` · ${event.exam.durationMinutes} minutes`
                      : ""}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EventDialog({
  event,
  onClose,
  timezone,
}: {
  event: StudentCalendarEvent;
  onClose: () => void;
  timezone: string;
}) {
  const actionLabel = event.exam
    ? event.exam.activeAttemptUuid
      ? "Resume exam"
      : event.exam.attemptsUsed >= event.exam.attemptLimit
        ? "View exam"
        : event.status === "AVAILABLE"
          ? "Open exam"
          : "View exam"
    : "View details";

  return createPortal(
    <div
      aria-labelledby="calendar-event-title"
      aria-modal="true"
      className={styles.dialogBackdrop}
      onClick={onClose}
      role="dialog"
    >
      <div
        className={styles.dialog}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className={styles.dialogHeader} data-status={event.status}>
          <span className={styles.dialogIcon}>
            {event.type === "EXAM" ? (
              <CalendarClock aria-hidden="true" size={22} />
            ) : (
              <GraduationCap aria-hidden="true" size={22} />
            )}
          </span>
          <div>
            <span>
              {event.type === "EXAM" ? "EXAM SCHEDULE" : "ACADEMIC SESSION"}
            </span>
            <h2 id="calendar-event-title">{event.title}</h2>
          </div>
          <button
            aria-label="Close event details"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className={styles.dialogBody}>
          <span className={styles.dialogStatus} data-status={event.status}>
            {statusLabels[event.status]}
          </span>
          <p>
            {event.description ??
              (event.type === "EXAM"
                ? "Review the schedule and open the exam when its attempt window is available."
                : "Your enrolled academic session period.")}
          </p>
          <dl className={styles.detailGrid}>
            <div>
              <dt>Starts</dt>
              <dd>{formatDateTime(event.startsAt, timezone)}</dd>
            </div>
            <div>
              <dt>Ends</dt>
              <dd>{formatDateTime(event.endsAt, timezone)}</dd>
            </div>
            <div>
              <dt>Course</dt>
              <dd>
                {event.courses.map((course) => course.name).join(", ") ||
                  "All enrolled courses"}
              </dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>{event.session.name}</dd>
            </div>
            {event.exam ? (
              <>
                <div>
                  <dt>Duration</dt>
                  <dd>{event.exam.durationMinutes} minutes</dd>
                </div>
                <div>
                  <dt>Attempts</dt>
                  <dd>
                    {event.exam.attemptsUsed} of {event.exam.attemptLimit} used
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </div>
        <div className={styles.dialogFooter}>
          <button
            className={styles.dialogSecondary}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          {event.href ? (
            <Link className={styles.dialogPrimary} href={event.href}>
              {actionLabel}
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CalendarEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className={styles.emptyState}>
      <span>
        <CalendarCheck2 aria-hidden="true" size={22} />
      </span>
      <strong>{filtered ? "No matching events" : "Nothing upcoming"}</strong>
      <p>
        {filtered
          ? "Try changing the course, type, or search filter."
          : "Your next scheduled exam will appear here."}
      </p>
    </div>
  );
}

function CalendarLoadingState() {
  return (
    <main className={`${styles.page} ${styles.loadingPage}`} aria-busy="true">
      <div className={styles.loadingHero} />
      <div className={styles.loadingSummary}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} />
        ))}
      </div>
      <div className={styles.loadingCalendar} />
    </main>
  );
}

function CalendarErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className={styles.errorState}>
      <span>
        <CircleAlert aria-hidden="true" size={26} />
      </span>
      <h1>Calendar could not be loaded</h1>
      <p>Your schedule is safe. Check your connection and try again.</p>
      <button onClick={onRetry} type="button">
        <RefreshCw aria-hidden="true" size={16} />
        Retry
      </button>
    </main>
  );
}

function calendarRange(month: Date) {
  const grid = buildMonthGrid(month);
  const first = grid[0]!;
  const last = grid[grid.length - 1]!;
  return {
    from: new Date(
      first.getFullYear(),
      first.getMonth(),
      first.getDate(),
    ).toISOString(),
    to: new Date(
      last.getFullYear(),
      last.getMonth(),
      last.getDate() + 1,
    ).toISOString(),
  };
}

function buildMonthGrid(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - firstDay.getDay(),
  );
  return Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + index,
      ),
  );
}

function groupExamMarkersByDate(
  events: StudentCalendarEvent[],
  timezone: string,
  today: Date,
) {
  const markers = new Map<
    string,
    Array<{
      event: StudentCalendarEvent;
      kind: "Exam" | "Opens" | "Closes" | "Available";
    }>
  >();
  for (const event of events) {
    const startKey = timezoneDateKey(event.startsAt, timezone);
    const endKey = timezoneDateKey(event.endsAt, timezone);
    const startKind = startKey === endKey ? "Exam" : "Opens";
    markers.set(startKey, [
      ...(markers.get(startKey) ?? []),
      { event, kind: startKind },
    ]);
    if (endKey !== startKey) {
      markers.set(endKey, [
        ...(markers.get(endKey) ?? []),
        { event, kind: "Closes" },
      ]);
    }
    if (event.status === "AVAILABLE") {
      const todayKey = timezoneDateKey(today.toISOString(), timezone);
      const hasTodayMarker = (markers.get(todayKey) ?? []).some(
        (marker) => marker.event.id === event.id,
      );
      if (!hasTodayMarker) {
        markers.set(todayKey, [
          ...(markers.get(todayKey) ?? []),
          { event, kind: "Available" },
        ]);
      }
    }
  }
  return markers;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timezoneDateKey(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatFullDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDayNumber(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    day: "2-digit",
  }).format(date);
}

function formatMonthWeekday(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    weekday: "short",
  }).format(date);
}

function formatShortMonth(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
  }).format(date);
}

function formatDateTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateRange(event: StudentCalendarEvent, timezone: string) {
  if (event.allDay) {
    const formatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${formatter.format(new Date(event.startsAt))} – ${formatter.format(new Date(event.endsAt))}`;
  }
  return `${formatDateTime(event.startsAt, timezone)} – ${formatDateTime(event.endsAt, timezone)}`;
}

function agendaGroupLabel(event: StudentCalendarEvent, timezone: string) {
  if (event.status === "AVAILABLE") return "Available now";
  if (event.status === "ACTIVE") return "Academic session";
  if (event.status === "CANCELLED") return "Cancelled";
  const value =
    event.status === "CLOSED" || event.status === "COMPLETED"
      ? event.endsAt
      : event.startsAt;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function humanizeTimezone(timezone: string) {
  return timezone.replaceAll("_", " ").replace("/", " / ");
}
