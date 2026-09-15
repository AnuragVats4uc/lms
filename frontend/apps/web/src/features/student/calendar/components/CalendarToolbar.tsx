import { Search, SlidersHorizontal, X } from "lucide-react";
import type { StudentCalendarCourse } from "@repo/types";
import styles from "../StudentCalendarPage.module.css";
import { typeFilterOptions } from "../constant";
import type { CalendarView, CourseFilter, TypeFilter } from "../types";

export const CalendarToolbar = (props: {
  courses: StudentCalendarCourse[];
  courseId: CourseFilter;
  search: string;
  setCourseId: (value: CourseFilter) => void;
  setSearch: (value: string) => void;
  setTypeFilter: (value: TypeFilter) => void;
  setView: (value: CalendarView) => void;
  typeFilter: TypeFilter;
  view: CalendarView;
}) => (
  <div className={styles.toolbar}>
    <div className={styles.toolbarPrimary}>
      <label className={styles.searchField}>
        <Search aria-hidden="true" size={17} />
        <span className={styles.srOnly}>Search calendar</span>
        <input
          onChange={(event) => props.setSearch(event.target.value)}
          placeholder="Search exam or course"
          type="search"
          value={props.search}
        />
        {props.search ? (
          <button
            aria-label="Clear calendar search"
            onClick={() => props.setSearch("")}
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
            props.setCourseId(
              event.target.value === "ALL" ? "ALL" : Number(event.target.value),
            )
          }
          value={props.courseId}
        >
          <option value="ALL">All courses</option>
          {props.courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </label>
      <div aria-label="Filter by event type" className={styles.filterPills}>
        {typeFilterOptions.map(([value, label]) => (
          <button
            aria-pressed={props.typeFilter === value}
            className={props.typeFilter === value ? styles.activePill : ""}
            key={value}
            onClick={() => props.setTypeFilter(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
    <div aria-label="Calendar view" className={styles.viewToggle}>
      {(["month", "agenda"] as CalendarView[]).map((view) => (
        <button
          aria-pressed={props.view === view}
          className={props.view === view ? styles.activeView : ""}
          key={view}
          onClick={() => props.setView(view)}
          type="button"
        >
          {view === "month" ? "Month" : "Agenda"}
        </button>
      ))}
    </div>
  </div>
);
