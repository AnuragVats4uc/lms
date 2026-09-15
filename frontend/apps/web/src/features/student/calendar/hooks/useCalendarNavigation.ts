import { useMemo, useState } from "react";

export const useCalendarNavigation = () => {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const moveMonth = (offset: number) =>
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  const goToToday = () =>
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  return { goToToday, moveMonth, today, visibleMonth };
};
