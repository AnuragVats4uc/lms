import { useEffect, useState } from "react";
import type { StudentCalendarEvent } from "@repo/types";

export const useCalendarEventDialog = () => {
  const [selectedEvent, setSelectedEvent] =
    useState<StudentCalendarEvent | null>(null);
  const closeEvent = () => setSelectedEvent(null);
  useEffect(() => {
    if (!selectedEvent) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEvent();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedEvent]);
  return { closeEvent, openEvent: setSelectedEvent, selectedEvent };
};
