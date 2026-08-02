import { DataTableNumberCell } from "@/components/DataTable";

export const MetricsCell = ({ value }: { value: number }) => {
  return <DataTableNumberCell value={value} />;
};
