import type { StudentActivityDeviceBreakdown } from "@repo/types";

export const aggregateBrowsers = (rows: StudentActivityDeviceBreakdown[]) => {
  const result = new Map<string, number>();
  rows.forEach((row) => {
    const browser = row.browser ?? "Unknown browser";
    result.set(browser, (result.get(browser) ?? 0) + row.sessionCount);
  });
  return [...result.entries()]
    .map(([browser, sessions]) => ({ browser, sessions }))
    .sort((left, right) => right.sessions - left.sessions);
};
