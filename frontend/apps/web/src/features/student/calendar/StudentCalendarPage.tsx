"use client";

import styles from "./StudentCalendarPage.module.css";
import { AcademicSessionBand } from "./components/AcademicSessionBand";
import { CalendarHero } from "./components/CalendarHero";
import { CalendarMonthHeader } from "./components/CalendarMonthHeader";
import { CalendarSummaryGrid } from "./components/CalendarSummaryGrid";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { CalendarAgendaView } from "./components/agenda/CalendarAgendaView";
import { CalendarEventDialog } from "./components/dialog/CalendarEventDialog";
import { CalendarMonthView } from "./components/month/CalendarMonthView";
import { CalendarErrorState } from "./components/states/CalendarErrorState";
import { CalendarLoadingState } from "./components/states/CalendarLoadingState";
import { useCalendarEventDialog } from "./hooks/useCalendarEventDialog";
import { useCalendarFilters } from "./hooks/useCalendarFilters";
import { useCalendarNavigation } from "./hooks/useCalendarNavigation";
import { useStudentCalendar } from "./hooks/useStudentCalendar";

export const StudentCalendarPage = () => {
  const navigation = useCalendarNavigation();
  const filters = useCalendarFilters();
  const eventDialog = useCalendarEventDialog();
  const calendar = useStudentCalendar({
    courseId: filters.courseId,
    search: filters.search,
    today: navigation.today,
    typeFilter: filters.typeFilter,
    visibleMonth: navigation.visibleMonth,
  });

  if (calendar.query.isLoading) return <CalendarLoadingState />;
  if (calendar.query.isError || !calendar.query.data) {
    return <CalendarErrorState onRetry={() => void calendar.query.refetch()} />;
  }

  return (
    <main className={styles.page}>
      <CalendarHero
        courseCount={calendar.query.data.availableCourses.length}
        timezone={calendar.timezone}
        today={navigation.today}
      />
      <CalendarSummaryGrid summary={calendar.query.data.summary} />
      <section className={styles.workspace}>
        <CalendarToolbar
          courses={calendar.query.data.availableCourses}
          courseId={filters.courseId}
          search={filters.search}
          setCourseId={filters.setCourseId}
          setSearch={filters.setSearch}
          setTypeFilter={filters.setTypeFilter}
          setView={filters.setView}
          typeFilter={filters.typeFilter}
          view={filters.view}
        />
        <CalendarMonthHeader
          goToToday={navigation.goToToday}
          moveMonth={navigation.moveMonth}
          visibleMonth={navigation.visibleMonth}
        />
        <AcademicSessionBand
          event={calendar.academicEvents[0]}
          timezone={calendar.timezone}
        />
        {filters.view === "month" ? (
          <CalendarMonthView
            filtered={filters.isFiltered}
            markersByDate={calendar.markersByDate}
            monthDays={calendar.monthDays}
            onAgenda={() => filters.setView("agenda")}
            onOpen={eventDialog.openEvent}
            timezone={calendar.timezone}
            today={navigation.today}
            upcomingEvents={calendar.upcomingEvents}
            visibleMonth={navigation.visibleMonth}
          />
        ) : (
          <CalendarAgendaView
            events={calendar.filteredEvents}
            onOpen={eventDialog.openEvent}
            timezone={calendar.timezone}
          />
        )}
      </section>
      {eventDialog.selectedEvent ? (
        <CalendarEventDialog
          event={eventDialog.selectedEvent}
          onClose={eventDialog.closeEvent}
          timezone={calendar.timezone}
        />
      ) : null}
    </main>
  );
};
