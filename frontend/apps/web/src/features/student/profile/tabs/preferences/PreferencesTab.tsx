import type { FormEvent } from "react";
import type { PreferenceForm } from "../../types";
import styles from "../../StudentProfilePage.module.css";
import { SectionHeading } from "../../components/SectionHeading";
import { BellRing, Clock3, Languages, LoaderCircle, Save } from "lucide-react";
import { PreferenceToggle } from "../../components/fields/PreferenceToggle";
import { ProfileField } from "../../components/fields/ProfileField";
import { ReminderOptions } from "./ReminderOptions";

export const PreferencesTab = ({
  form,
  isSaving,
  onChange,
  onSubmit,
}: {
  form: PreferenceForm;
  isSaving: boolean;
  onChange: <K extends keyof PreferenceForm>(
    field: K,
    value: PreferenceForm[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  const toggleReminder = (minutes: number) => {
    const exists = form.examReminderOffsetsMinutes.includes(minutes);
    const next = exists
      ? form.examReminderOffsetsMinutes.filter((item) => item !== minutes)
      : [...form.examReminderOffsetsMinutes, minutes];
    if (next.length) onChange("examReminderOffsetsMinutes", next);
  };

  return (
    <form className={styles.preferenceLayout} onSubmit={onSubmit}>
      <section className={styles.card}>
        <SectionHeading
          icon={Languages}
          kicker="REGIONAL SETTINGS"
          title="Language and timezone"
          description="Times across exams, calendars, and reminders use this timezone."
        />
        <div className={styles.formGrid}>
          <ProfileField label="Language">
            <select
              onChange={(event) => onChange("language", event.target.value)}
              value={form.language}
            >
              <option value="en">English</option>
              <option value="hi-IN">Hindi</option>
            </select>
          </ProfileField>
          <ProfileField label="Timezone">
            <select
              onChange={(event) => onChange("timezone", event.target.value)}
              value={form.timezone}
            >
              <option value="Asia/Kolkata">India Standard Time</option>
              <option value="UTC">Coordinated Universal Time</option>
              <option value="Asia/Dubai">Gulf Standard Time</option>
              <option value="Asia/Singapore">Singapore Standard Time</option>
            </select>
          </ProfileField>
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeading
          icon={BellRing}
          kicker="NOTIFICATIONS"
          title="Choose what reaches you"
          description="These choices apply to LMS activity relevant to your account."
        />
        <div className={styles.toggleList}>
          <PreferenceToggle
            checked={form.inAppNotifications}
            description="Show notifications inside the LMS notification center."
            label="In-app notifications"
            onChange={(value) => onChange("inAppNotifications", value)}
          />
          <PreferenceToggle
            checked={form.emailNotifications}
            description="Allow eligible LMS updates to be delivered by email when the channel is configured."
            label="Email notifications"
            onChange={(value) => onChange("emailNotifications", value)}
          />
          <PreferenceToggle
            checked={form.examReminders}
            description="Receive reminders for upcoming assigned exams and closing windows."
            label="Exam reminders"
            onChange={(value) => onChange("examReminders", value)}
          />
          <PreferenceToggle
            checked={form.resourceUpdates}
            description="Know when a course receives a new or updated learning resource."
            label="Resource updates"
            onChange={(value) => onChange("resourceUpdates", value)}
          />
          <PreferenceToggle
            checked={form.announcementNotifications}
            description="Receive organization and academic-session announcements."
            label="Announcements"
            onChange={(value) => onChange("announcementNotifications", value)}
          />
          <PreferenceToggle
            checked={form.securityAlerts}
            description="Important account and security messages. Recommended."
            label="Security alerts"
            onChange={(value) => onChange("securityAlerts", value)}
          />
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeading
          icon={Clock3}
          kicker="EXAM REMINDERS"
          title="Reminder timing"
          description="Select up to four useful moments before an exam begins."
        />
        <ReminderOptions
          onToggle={toggleReminder}
          selected={form.examReminderOffsetsMinutes}
        />
      </section>

      <div className={styles.formActions}>
        <span>Changes apply to this student account only.</span>
        <button
          className={styles.primaryButton}
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? (
            <LoaderCircle className={styles.spin} size={16} />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </form>
  );
};
