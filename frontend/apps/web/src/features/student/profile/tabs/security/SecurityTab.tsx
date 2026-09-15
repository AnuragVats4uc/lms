import type { FormEvent } from "react";
import styles from "../../StudentProfilePage.module.css";
import type { StudentSelfProfile } from "@repo/types";
import { SectionHeading } from "../../components/SectionHeading";
import { KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { PasswordField } from "../../components/fields/PasswordField";
import { ProfileDetail } from "../../components/details/ProfileDetail";
import { formatDateTime } from "../../utils/profileFormatting";

export const SecurityTab = ({
  form,
  isSaving,
  onChange,
  onSubmit,
  onToggleVisibility,
  profile,
  showPasswords,
}: {
  form: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  isSaving: boolean;
  onChange: (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleVisibility: () => void;
  profile: StudentSelfProfile;
  showPasswords: boolean;
}) => {
  return (
    <div className={styles.securityLayout}>
      <section className={styles.card}>
        <SectionHeading
          icon={ShieldCheck}
          kicker="ACCOUNT STATUS"
          title="Identity and access"
        />
        <div className={styles.securityStatus}>
          <div className={styles.securityIcon}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <strong>
              {profile.account.isVerified
                ? "Account verified"
                : "Verification pending"}
            </strong>
            <span>{profile.account.verification.note}</span>
          </div>
          <i data-verified={profile.account.isVerified}>
            {profile.account.isVerified ? "Verified" : "Pending"}
          </i>
        </div>
        <div className={styles.securityFacts}>
          <ProfileDetail label="Sign-in email" value={profile.account.email} />
          <ProfileDetail
            label="Last login"
            value={
              profile.account.lastLoginAt
                ? formatDateTime(profile.account.lastLoginAt)
                : "No login recorded"
            }
          />
        </div>
      </section>

      <form className={styles.card} onSubmit={onSubmit}>
        <SectionHeading
          icon={KeyRound}
          kicker="PASSWORD"
          title="Change your password"
          description="After this change, all active sessions will be signed out."
        />
        <div className={styles.passwordFields}>
          <PasswordField
            label="Current password"
            onChange={(value) => onChange("currentPassword", value)}
            onToggleVisibility={onToggleVisibility}
            show={showPasswords}
            value={form.currentPassword}
          />
          <PasswordField
            label="New password"
            onChange={(value) => onChange("newPassword", value)}
            onToggleVisibility={onToggleVisibility}
            show={showPasswords}
            value={form.newPassword}
          />
          <PasswordField
            label="Confirm new password"
            onChange={(value) => onChange("confirmPassword", value)}
            onToggleVisibility={onToggleVisibility}
            show={showPasswords}
            value={form.confirmPassword}
          />
        </div>
        <div className={styles.passwordGuidance}>
          <LockKeyhole size={16} />
          <span>
            Use at least 8 characters. Avoid reusing a password from another
            account.
          </span>
        </div>
        <div className={styles.formActions}>
          <span>You will need to sign in again after saving.</span>
          <button
            className={styles.primaryButton}
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? (
              <LoaderCircle className={styles.spin} size={16} />
            ) : (
              <KeyRound size={16} />
            )}
            {isSaving ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
};
