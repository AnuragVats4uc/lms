import { Check, Clock3 } from "lucide-react";

import { reminderOptions } from "../../constants";
import styles from "../../StudentProfilePage.module.css";

export const ReminderOptions = ({
  onToggle,
  selected,
}: {
  onToggle: (minutes: number) => void;
  selected: number[];
}) => (
  <div className={styles.reminderGrid}>
    {reminderOptions.map((option) => {
      const checked = selected.includes(option.minutes);
      return (
        <label data-selected={checked} key={option.minutes}>
          <input
            checked={checked}
            disabled={!checked && selected.length >= 4}
            onChange={() => onToggle(option.minutes)}
            type="checkbox"
          />
          <span>
            <Clock3 size={17} />
            <strong>{option.label}</strong>
          </span>
          <i>{checked ? <Check size={14} /> : null}</i>
        </label>
      );
    })}
  </div>
);
