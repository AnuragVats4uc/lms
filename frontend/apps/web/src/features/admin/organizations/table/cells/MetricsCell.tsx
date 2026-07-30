import { DataTableNumberCell } from "@/components/DataTable";

export function MetricsCell({ value }: { value: number }) {
  return <DataTableNumberCell value={value} />;
}
