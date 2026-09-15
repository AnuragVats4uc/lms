import type { StudentCalendarEvent } from "@repo/types";

export const formatMonthTitle = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

export const formatFullDate = (date: Date, timezone: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const formatDayNumber = (date: Date, timezone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    day: "2-digit",
  }).format(date);
};

export const formatMonthWeekday = (date: Date, timezone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    weekday: "short",
  }).format(date);
};

export const formatShortMonth = (date: Date, timezone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
  }).format(date);
};

export const formatDateTime = (value: string, timezone: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatDateRange = (
  event: StudentCalendarEvent,
  timezone: string,
) => {
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
};

export const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const timezoneDateKey = (value: string, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

export const agendaGroupLabel = (
  event: StudentCalendarEvent,
  timezone: string,
) => {
  if (event.status === "AVAILABLE") return "Available now";
  if (event.status === "ACTIVE") return "Academic session";
  if (event.status === "CANCELLED") return "Cancelled";
  const value = ["CLOSED", "COMPLETED"].includes(event.status)
    ? event.endsAt
    : event.startsAt;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

export const humanizeTimezone = (timezone: string) =>
  timezone.replaceAll("_", " ").replace("/", " / ");
