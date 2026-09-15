import styles from "../../StudentCalendarPage.module.css";

export const CalendarLoadingState = () => {
  return (
    <main className={`${styles.page} ${styles.loadingPage}`} aria-busy="true">
      <div className={styles.loadingHero} />
      <div className={styles.loadingSummary}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} />
        ))}
      </div>
      <div className={styles.loadingCalendar} />
    </main>
  );
};
