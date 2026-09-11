import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordFieldProps = {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
};

export const PasswordField = ({
  label,
  onChange,
  required,
  value,
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <label className="registration-field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <div className="registration-password-field">
        <input
          autoComplete="new-password"
          onChange={(event) => onChange(event.target.value)}
          required={required}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <Icon size={16} />
        </button>
      </div>
    </label>
  );
};
