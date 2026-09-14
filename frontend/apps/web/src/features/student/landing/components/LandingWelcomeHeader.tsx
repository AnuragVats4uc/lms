import { YStack } from "@repo/ui";

import styles from "../StudentLandingPage.module.css";

export const LandingWelcomeHeader = ({
  studentName,
}: {
  studentName?: string;
}) => (
  <YStack className={styles.headingBlock}>
    <h1 className={styles.title}>Welcome to The LMS</h1>
    <p className={styles.subtitle}>
      {studentName
        ? `Good to see you, ${studentName}. Choose where you'd like to continue.`
        : "Choose where you'd like to continue."}
    </p>
  </YStack>
);
