import { BookOpen, GraduationCap, ShieldCheck } from "lucide-react";
import type { StudentSelfProfile } from "@repo/types";

import styles from "../StudentProfilePage.module.css";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileCompletionCard } from "./ProfileCompletionCard";

export const ProfileHeader = ({
  avatarSrc,
  fullName,
  initials,
  onEdit,
  profile,
}: {
  avatarSrc: string | null;
  fullName: string;
  initials: string;
  onEdit: () => void;
  profile: StudentSelfProfile;
}) => {
  const activeEnrollment = profile.academic.enrollments[0];
  return (
    <section className={styles.hero}>
      <div className={styles.heroIdentity}>
        <ProfileAvatar
          fullName={fullName}
          initials={initials}
          src={avatarSrc}
        />
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>STUDENT PROFILE</span>
          <div className={styles.titleRow}>
            <h1>{fullName}</h1>
            {profile.account.isVerified ? (
              <span className={styles.verifiedBadge}>
                <ShieldCheck size={14} /> Verified account
              </span>
            ) : null}
          </div>
          <p>
            {profile.student.studentCode}
            <span aria-hidden="true">•</span>
            {profile.student.organization?.name ?? "Independent learner"}
          </p>
          <div className={styles.heroMeta}>
            <span>
              <GraduationCap size={15} />
              {activeEnrollment?.session.name ?? "No active academic session"}
            </span>
            <span>
              <BookOpen size={15} />
              {activeEnrollment?.courses.length ?? 0} assigned course
              {(activeEnrollment?.courses.length ?? 0) === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
      <ProfileCompletionCard
        onEdit={onEdit}
        percentage={profile.profileCompleteness.percentage}
      />
    </section>
  );
};
