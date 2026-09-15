import { IdCard, LockKeyhole } from "lucide-react";
import type { StudentSelfProfile } from "@repo/types";

import { ProfileDetail } from "../../components/details/ProfileDetail";
import { SectionHeading } from "../../components/SectionHeading";
import styles from "../../StudentProfilePage.module.css";
import { sentenceCase } from "../../utils/profileFormatting";

export const PersonalSummaryCard = ({
  profile,
}: {
  profile: StudentSelfProfile;
}) => (
  <section className={`${styles.card} ${styles.identityCard}`}>
    <SectionHeading
      icon={IdCard}
      kicker="ACCOUNT & IDENTITY"
      title="Student information"
    />
    <div className={styles.detailGrid}>
      <ProfileDetail label="Student ID" value={profile.student.studentCode} />
      <ProfileDetail
        label="Admission number"
        value={profile.student.admissionNumber ?? "Not assigned"}
      />
      <ProfileDetail
        label="Roll number"
        value={profile.student.rollNumber ?? "Not assigned"}
      />
      <ProfileDetail
        label="Status"
        value={sentenceCase(profile.student.status)}
      />
      <ProfileDetail label="Email" value={profile.account.email} />
      <ProfileDetail
        label="Primary phone"
        value={profile.account.phone ?? "Not added"}
      />
    </div>
    <div className={styles.managedNote}>
      <LockKeyhole size={15} />
      <span>
        Student ID, admission details, email, and primary phone are managed by
        your institute.
      </span>
    </div>
  </section>
);
