import { buildMonthGrid } from "./buildMonthGrid";

export const calendarRange = (month: Date) => {
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
};
