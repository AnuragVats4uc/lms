import styles from "../StudentProfilePage.module.css";

export const ProfileAvatar = ({
  fullName,
  initials,
  src,
}: {
  fullName: string;
  initials: string;
  src: string | null;
}) => (
  <div className={styles.avatar} aria-label={`${fullName} avatar`}>
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" src={src} />
    ) : (
      <span>{initials}</span>
    )}
    <i aria-hidden="true" />
  </div>
);
