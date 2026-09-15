import { Check, CheckCircle2, ChevronRight, IdCard } from "lucide-react";
import type { StudentSelfProfile } from "@repo/types";

import { ProfileDetail } from "../../components/details/ProfileDetail";
import { SectionHeading } from "../../components/SectionHeading";
import styles from "../../StudentProfilePage.module.css";
import { fieldLabel } from "../../utils/profileFormatting";
import { AcademicSummaryCard } from "./AcademicSummaryCard";
import { ContactSummaryCard } from "./ContactSummaryCard";
import { PersonalSummaryCard } from "./PersonalSummaryCard";

export const OverviewTab = ({
  onEdit,
  profile,
}: {
  onEdit: () => void;
  profile: StudentSelfProfile;
}) => {
  const missing = profile.profileCompleteness.missingFields;

  return (
    <div className={styles.overviewGrid}>
      <PersonalSummaryCard profile={profile} />
      <section className={styles.card + " " + styles.completionCard}>
        <SectionHeading
          icon={CheckCircle2}
          kicker="PROFILE HEALTH"
          title="Complete your profile"
        />
        <div className={styles.completionScore}>
          <strong>{profile.profileCompleteness.percentage}%</strong>
          <span>
            {profile.profileCompleteness.completedFields} of{" "}
            {profile.profileCompleteness.totalFields} recommended fields
            complete
          </span>
        </div>
        <div className={styles.progressTrack}>
          <span
            style={{ width: profile.profileCompleteness.percentage + "%" }}
          />
        </div>
        {missing.length ? (
          <div className={styles.missingFields}>
            <span>Still recommended</span>
            <div>
              {missing.slice(0, 4).map((field) => (
                <i key={field}>{fieldLabel(field)}</i>
              ))}
              {missing.length > 4 ? <i>+{missing.length - 4} more</i> : null}
            </div>
          </div>
        ) : (
          <p className={styles.completeMessage}>
            <Check size={15} /> Your recommended profile details are complete.
          </p>
        )}
        <button className={styles.textButton} onClick={onEdit} type="button">
          Update personal details <ChevronRight size={15} />
        </button>
      </section>
      <AcademicSummaryCard profile={profile} />
      <ContactSummaryCard profile={profile} />
      {profile.customRegistrationAnswers.length ? (
        <section className={styles.card + " " + styles.fullWidthCard}>
          <SectionHeading
            icon={IdCard}
            kicker="REGISTRATION DETAILS"
            title="Additional information"
          />
          <div className={styles.registrationGrid}>
            {profile.customRegistrationAnswers.map((answer) => (
              <ProfileDetail
                key={answer.fieldKey}
                label={answer.label}
                value={answer.value || "Not provided"}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
