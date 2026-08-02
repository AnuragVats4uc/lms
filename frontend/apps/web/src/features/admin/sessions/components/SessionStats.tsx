import { Activity, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { CrudStats, type CrudStat } from "../../components/crud";

export const SessionStats = ({
  isLoading,
  rows,
  total,
}: {
  isLoading: boolean;
  rows: Array<{ status: string; isActive: boolean }>;
  total: number;
}) => {
  const active = rows.filter(
    (row) => row.status === "ACTIVE" && row.isActive,
  ).length;
  const upcoming = rows.filter((row) => row.status === "UPCOMING").length;
  const completed = rows.filter((row) => row.status === "COMPLETED").length;
  const stats: CrudStat[] = [
    {
      icon: <CalendarDays aria-hidden="true" color="#059669" size={20} />,
      label: "Total Sessions",
      value: total,
    },
    {
      icon: <CheckCircle2 aria-hidden="true" color="#059669" size={20} />,
      label: "Active Sessions",
      value: active,
    },
    {
      icon: <Clock3 aria-hidden="true" color="#2563EB" size={20} />,
      label: "Upcoming Sessions",
      value: upcoming,
    },
    {
      icon: <Activity aria-hidden="true" color="#7C3AED" size={20} />,
      label: "Completed Sessions",
      value: completed,
    },
  ];
  return <CrudStats isLoading={isLoading} stats={stats} />;
};
