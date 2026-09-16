import { CrudSelect } from "../../../components/crud";

export const FolderContextSelect = ({
  ariaLabel,
  label,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) => (
  <CrudSelect
    ariaLabel={ariaLabel}
    label={label}
    onChange={onChange}
    options={options}
    value={value}
  />
);
