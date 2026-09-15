import { CrudSelect } from "../../../components/crud";

interface DashboardContextSelectProps {
  ariaLabel: string;
  disabled: boolean;
  label: string;
  loading?: boolean;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
  width: number;
}

export const DashboardContextSelect = ({
  ariaLabel,
  disabled,
  label,
  loading,
  onChange,
  options,
  value,
  width,
}: DashboardContextSelectProps) => (
  <CrudSelect
    ariaLabel={ariaLabel}
    disabled={disabled}
    label={label}
    loading={loading}
    onChange={onChange}
    options={options}
    value={value}
    width={width}
  />
);
