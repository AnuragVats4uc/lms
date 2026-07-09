import styles from "./Dashboard.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <span className={styles.eyebrow}>
        Explore Categories
      </span>
      <h1>Find Your Perfect Course</h1>
      <p className={styles.heroSubtitle}>
        Comprehensive preparation for your next big exam
      </p>
      <div className={styles.divider} />
    </section>
  );
}
