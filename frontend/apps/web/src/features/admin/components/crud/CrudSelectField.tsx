"use client";

import { useId } from "react";

import { CrudSelect, type CrudSelectOption } from "./CrudSelect";
import styles from "./CrudSelectField.module.css";

export interface CrudSelectFieldProps {
  description?: string;
  disabled?: boolean;
  id?: string;
  label: string;
  loading?: boolean;
  onChange: (value: string) => void;
  options: readonly CrudSelectOption[];
  placeholder?: string;
  value: string;
}

export const CrudSelectField = ({
  description,
  disabled = false,
  id,
  label,
  loading = false,
  onChange,
  options,
  placeholder,
  value,
}: CrudSelectFieldProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <CrudSelect
        ariaLabel={label}
        disabled={disabled}
        id={inputId}
        loading={loading}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        value={value}
        variant="form"
        width="100%"
      />
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
};
