import { UserRound } from "lucide-react";
import styles from "../StudentProfilePage.module.css";

export const SectionHeading = ({
  description,
  icon: Icon,
  kicker,
  title,
}: {
  description?: string;
  icon: typeof UserRound;
  kicker: string;
  title: string;
}) => {
  return (
    <header className={styles.sectionHeading}>
      <span>
        <Icon size={17} />
      </span>
      <div>
        <small>{kicker}</small>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
  );
};
