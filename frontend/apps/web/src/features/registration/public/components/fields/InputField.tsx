import type { HTMLAttributes } from "react";

type InputFieldProps = {
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
};

export const InputField = ({
  inputMode,
  label,
  onChange,
  required,
  type = "text",
  value,
}: InputFieldProps) => (
  <label className="registration-field">
    <span>
      {label}
      {required ? <b>*</b> : null}
    </span>
    <input
      inputMode={inputMode}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      type={type}
      value={value}
    />
  </label>
);
