import {
  BookOpen,
  CalendarCheck2,
  CalendarClock,
  CircleAlert,
} from "lucide-react";
import type { StudentCalendarResponse } from "@repo/types";
import styles from "../StudentCalendarPage.module.css";
import { CalendarSummaryCard } from "./CalendarSummaryCard";

export const CalendarSummaryGrid = ({
  summary,
}: {
  summary: StudentCalendarResponse["summary"];
}) => (
  <section aria-label="Calendar summary" className={styles.summaryGrid}>
    <CalendarSummaryCard
      icon={CalendarClock}
      label="Exams in view"
      tone="purple"
      value={summary.exams}
    />
    <CalendarSummaryCard
      icon={CalendarCheck2}
      label="Available now"
      tone="green"
      value={summary.availableExams}
    />
    <CalendarSummaryCard
      icon={CircleAlert}
      label="Closing in 7 days"
      tone="orange"
      value={summary.closingWithinSevenDays}
    />
    <CalendarSummaryCard
      icon={BookOpen}
      label="Academic sessions"
      tone="blue"
      value={summary.academicSessions}
    />
  </section>
);
