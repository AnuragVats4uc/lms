import type { StudentActivityDeviceBreakdown } from "@repo/types";
import type { AggregatedDevice } from "../types";

export const aggregateDevices = (rows: StudentActivityDeviceBreakdown[]) => {
  const result = new Map<string, AggregatedDevice>();
  rows.forEach((row) => {
    const item = result.get(row.deviceType) ?? {
      deviceType: row.deviceType,
      sessionCount: 0,
      activeDurationSeconds: 0,
      idleDurationSeconds: 0,
    };
    item.sessionCount += row.sessionCount;
    item.activeDurationSeconds += row.activeDurationSeconds;
    item.idleDurationSeconds += row.idleDurationSeconds;
    result.set(row.deviceType, item);
  });
  return [...result.values()].sort(
    (left, right) => right.sessionCount - left.sessionCount,
  );
};
