import type { RegistrationField } from "@repo/types";

import { SelectField } from "./SelectField";

type CustomFieldProps = {
  field: RegistrationField;
  onChange: (value: string) => void;
  value: string;
};

export const CustomField = ({ field, onChange, value }: CustomFieldProps) => {
  if (field.fieldType === "SELECT" || field.fieldType === "RADIO") {
    return (
      <SelectField
        label={field.label}
        onChange={onChange}
        options={field.options.map((option) => ({
          label: option.label,
          value: option.optionKey,
        }))}
        required={field.isRequired}
        value={value}
      />
    );
  }

  return (
    <label className="registration-field">
      <span>
        {field.label}
        {field.isRequired ? <b>*</b> : null}
      </span>
      {field.fieldType === "TEXTAREA" ? (
        <textarea
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder ?? undefined}
          required={field.isRequired}
          value={value}
        />
      ) : (
        <input
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder ?? undefined}
          required={field.isRequired}
          value={value}
        />
      )}
      {field.helpText ? <small>{field.helpText}</small> : null}
    </label>
  );
};
