"use client";

import { useId } from "react";

import { CrudSelect, type CrudSelectOption } from "./CrudSelect";
import styles from "./CrudSelectField.module.css";

export interface CrudMultiSelectFieldProps {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onChange: (value: string[]) => void;
  options: readonly CrudSelectOption[];
  placeholder?: string;
  selectedLabel?: (count: number) => string;
  value: string[];
}

export const CrudMultiSelectField = ({
  disabled = false,
  label,
  loading = false,
  onChange,
  options,
  placeholder = "Select options",
  selectedLabel = (count) => `${count} selected`,
  value,
}: CrudMultiSelectFieldProps) => {
  const id = useId();

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <CrudSelect
        ariaLabel={label}
        disabled={disabled}
        id={id}
        loading={loading}
        multiple
        onChange={() => undefined}
        onMultiChange={onChange}
        options={options}
        placeholder={placeholder}
        selectedLabel={selectedLabel}
        value=""
        values={value}
        variant="form"
        width="100%"
      />
    </div>
  );
};
