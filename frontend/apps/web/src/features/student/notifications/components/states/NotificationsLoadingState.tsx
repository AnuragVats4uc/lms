import styles from "../../StudentNotificationsPage.module.css";

export const NotificationsLoadingState = () => {
  return (
    <main
      aria-busy="true"
      aria-label="Loading notifications"
      className={styles.page}
    >
      <div className={`${styles.skeleton} ${styles.skeletonHero}`} />

      <div className={styles.skeletonGrid}>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className={`${styles.skeleton} ${styles.skeletonCard}`}
            key={index}
          />
        ))}
      </div>

      <div className={`${styles.skeleton} ${styles.skeletonPanel}`} />
    </main>
  );
};
