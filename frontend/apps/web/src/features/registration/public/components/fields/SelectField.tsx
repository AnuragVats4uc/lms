import { useId } from "react";

import { CrudSelect } from "@/features/shared/forms/CrudSelect";

type SelectFieldProps = {
  label: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  required?: boolean;
  value: string;
};

export const SelectField = ({
  label,
  onChange,
  options,
  required,
  value,
}: SelectFieldProps) => {
  const labelId = useId();

  return (
    <div className="registration-field">
      <span id={labelId}>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <CrudSelect
        ariaLabel={label}
        describedBy={labelId}
        onChange={onChange}
        options={options}
        placeholder="Select"
        value={value}
        variant="form"
        width="100%"
      />
    </div>
  );
};
