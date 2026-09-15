import { Eye, EyeOff } from "lucide-react";

export const PasswordField = ({
  label,
  onChange,
  onToggleVisibility,
  show,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  show: boolean;
  value: string;
}) => {
  return (
    <label>
      <span>{label}</span>
      <div>
        <input
          autoComplete={
            label === "Current password" ? "current-password" : "new-password"
          }
          maxLength={72}
          minLength={label === "Current password" ? undefined : 8}
          onChange={(event) => onChange(event.target.value)}
          required
          type={show ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={show ? "Hide passwords" : "Show passwords"}
          onClick={onToggleVisibility}
          type="button"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
};
