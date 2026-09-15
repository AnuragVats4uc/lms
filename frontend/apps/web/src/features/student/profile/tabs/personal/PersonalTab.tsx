import type { FormEvent } from "react";
import { FormActions } from "../../components/fields/FormActions";
import type { ProfileForm } from "../../types";
import type { StudentSelfProfile } from "@repo/types";
import styles from "../../StudentProfilePage.module.css";
import { SectionHeading } from "../../components/SectionHeading";
import {
  Camera,
  Mail,
  Phone,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { ReadOnlyField } from "../../components/fields/ReadOnlyProfileField";
import { ProfileField } from "../../components/fields/ProfileField";
import { getInitials } from "../../utils/profileFormatting";

export const PersonalTab = ({
  avatarSrc,
  form,
  isAvatarBusy,
  isSaving,
  onAvatarDelete,
  onAvatarSelect,
  onChange,
  onReset,
  onSubmit,
  profile,
}: {
  avatarSrc: string | null;
  form: ProfileForm;
  isAvatarBusy: boolean;
  isSaving: boolean;
  onAvatarDelete: () => void;
  onAvatarSelect: (file: File) => void;
  onChange: (field: keyof ProfileForm, value: string) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  profile: StudentSelfProfile;
}) => {
  return (
    <form className={styles.formLayout} onSubmit={onSubmit}>
      <section className={styles.card}>
        <SectionHeading
          icon={UserRound}
          kicker="PERSONAL DETAILS"
          title="About you"
          description="Keep your name and personal details accurate."
        />
        <div className={styles.avatarEditor}>
          <div className={styles.avatarPreview}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Your profile" src={avatarSrc} />
            ) : (
              <span>{getInitials(`${form.firstName} ${form.lastName}`)}</span>
            )}
          </div>
          <div className={styles.avatarEditorCopy}>
            <strong>Profile photo</strong>
            <span>JPEG, PNG, or WebP. Maximum file size 5 MB.</span>
            <div>
              <label className={styles.secondaryButton}>
                <Camera size={15} />
                {isAvatarBusy ? "Updating..." : "Choose photo"}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.hiddenFileInput}
                  disabled={isAvatarBusy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onAvatarSelect(file);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
              {profile.profile.avatar ? (
                <button
                  className={styles.avatarRemoveButton}
                  disabled={isAvatarBusy}
                  onClick={onAvatarDelete}
                  type="button"
                >
                  <Trash2 size={14} /> Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div className={styles.formGrid}>
          <ProfileField label="First name" required>
            <input
              maxLength={100}
              minLength={2}
              onChange={(event) => onChange("firstName", event.target.value)}
              required
              value={form.firstName}
            />
          </ProfileField>
          <ProfileField label="Last name">
            <input
              maxLength={100}
              onChange={(event) => onChange("lastName", event.target.value)}
              value={form.lastName}
            />
          </ProfileField>
          <ProfileField label="Date of birth">
            <input
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => onChange("dateOfBirth", event.target.value)}
              type="date"
              value={form.dateOfBirth}
            />
          </ProfileField>
          <ProfileField label="Gender">
            <select
              onChange={(event) => onChange("gender", event.target.value)}
              value={form.gender}
            >
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
            </select>
          </ProfileField>
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeading
          icon={Phone}
          kicker="CONTACT DETAILS"
          title="How we can reach you"
          description="Primary identity contacts remain institute-managed."
        />
        <div className={styles.readOnlyContacts}>
          <ReadOnlyField
            icon={Mail}
            label="Primary email"
            value={profile.account.email}
          />
          <ReadOnlyField
            icon={Phone}
            label="Primary phone"
            value={profile.account.phone ?? "Not added"}
          />
        </div>
        <div className={styles.formGrid}>
          <ProfileField label="Alternate phone">
            <input
              maxLength={30}
              onChange={(event) =>
                onChange("alternatePhone", event.target.value)
              }
              placeholder="Add another contact number"
              type="tel"
              value={form.alternatePhone}
            />
          </ProfileField>
          <ProfileField label="Postal code">
            <input
              maxLength={20}
              onChange={(event) => onChange("postalCode", event.target.value)}
              value={form.postalCode}
            />
          </ProfileField>
          <ProfileField label="Address" wide>
            <textarea
              maxLength={1000}
              onChange={(event) => onChange("address", event.target.value)}
              rows={3}
              value={form.address}
            />
          </ProfileField>
          <ProfileField label="City">
            <input
              maxLength={100}
              onChange={(event) => onChange("city", event.target.value)}
              value={form.city}
            />
          </ProfileField>
          <ProfileField label="State">
            <input
              maxLength={100}
              onChange={(event) => onChange("state", event.target.value)}
              value={form.state}
            />
          </ProfileField>
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeading
          icon={UsersRound}
          kicker="SUPPORT CONTACTS"
          title="Guardian and emergency details"
        />
        <div className={styles.formGrid}>
          <ProfileField label="Guardian name">
            <input
              maxLength={150}
              onChange={(event) => onChange("guardianName", event.target.value)}
              value={form.guardianName}
            />
          </ProfileField>
          <ProfileField label="Guardian phone">
            <input
              maxLength={30}
              onChange={(event) =>
                onChange("guardianPhone", event.target.value)
              }
              type="tel"
              value={form.guardianPhone}
            />
          </ProfileField>
          <ProfileField label="Emergency contact name">
            <input
              maxLength={150}
              onChange={(event) =>
                onChange("emergencyContactName", event.target.value)
              }
              value={form.emergencyContactName}
            />
          </ProfileField>
          <ProfileField label="Emergency contact phone">
            <input
              maxLength={30}
              onChange={(event) =>
                onChange("emergencyContactPhone", event.target.value)
              }
              type="tel"
              value={form.emergencyContactPhone}
            />
          </ProfileField>
        </div>
      </section>

      <FormActions isSaving={isSaving} onReset={onReset} />
    </form>
  );
};
