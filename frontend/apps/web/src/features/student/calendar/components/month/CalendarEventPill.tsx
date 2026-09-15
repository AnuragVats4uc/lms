import type { CalendarMarker } from "../../types";
import styles from "../../StudentCalendarPage.module.css";

export const CalendarEventPill = ({
  marker,
  onOpen,
}: {
  marker: CalendarMarker;
  onOpen: () => void;
}) => (
  <button
    className={styles.eventPill}
    data-status={marker.event.status}
    onClick={onOpen}
    title={marker.event.title}
    type="button"
  >
    <span />
    <span className={styles.eventPillCopy}>
      <small>{marker.kind}</small>
      {marker.event.title}
    </span>
  </button>
);
