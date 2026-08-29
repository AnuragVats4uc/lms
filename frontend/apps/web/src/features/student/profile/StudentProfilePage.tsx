"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BellRing,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  KeyRound,
  Languages,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { studentsApi } from "@repo/api";
import { useLogout } from "@repo/auth";
import type {
  StudentProfilePreferences,
  StudentSelfProfile,
  UpdateMyStudentProfileRequest,
} from "@repo/types";

import styles from "./StudentProfilePage.module.css";

type ProfileTab =
  "overview" | "personal" | "academic" | "preferences" | "security";

type ProfileForm = {
  [Field in keyof UpdateMyStudentProfileRequest]-?: NonNullable<
    UpdateMyStudentProfileRequest[Field]
  >;
};

type PreferenceForm = Pick<
  StudentProfilePreferences,
  | "timezone"
  | "language"
  | "inAppNotifications"
  | "emailNotifications"
  | "examReminders"
  | "resourceUpdates"
  | "announcementNotifications"
  | "securityAlerts"
  | "examReminderOffsetsMinutes"
>;

type ToastState = {
  id: number;
  title: string;
  message: string;
  tone: "success" | "error";
};

const tabs: Array<{
  id: ProfileTab;
  label: string;
  icon: typeof UserRound;
}> = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "personal", label: "Personal details", icon: IdCard },
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "preferences", label: "Preferences", icon: Settings2 },
  { id: "security", label: "Security", icon: ShieldCheck },
];

const reminderOptions = [
  { minutes: 15, label: "15 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 1440, label: "1 day before" },
  { minutes: 10080, label: "1 week before" },
];

export function StudentProfilePage() {
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [preferenceForm, setPreferenceForm] =
    useState<PreferenceForm>(emptyPreferenceForm);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const profileQuery = useQuery({
    queryKey: ["student-profile"],
    queryFn: studentsApi.findMyProfile,
    staleTime: 60_000,
  });

  useEffect(() => {
    const selectHashTab = () => {
      const requestedTab = window.location.hash.slice(1) as ProfileTab;
      if (tabs.some((tab) => tab.id === requestedTab)) {
        setActiveTab(requestedTab);
      }
    };
    selectHashTab();
    window.addEventListener("hashchange", selectHashTab);
    return () => window.removeEventListener("hashchange", selectHashTab);
  }, []);

  useEffect(() => {
    if (!profileQuery.data) return;
    setProfileForm(toProfileForm(profileQuery.data));
    setPreferenceForm(toPreferenceForm(profileQuery.data.preferences));
  }, [profileQuery.data]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const profileMutation = useMutation({
    mutationFn: studentsApi.updateMyProfile,
    onSuccess: async (profile) => {
      queryClient.setQueryData(["student-profile"], profile);
      await queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      showToast("Profile updated", "Your personal details are now up to date.");
    },
    onError: (error) =>
      showToast("Could not save profile", readApiError(error), "error"),
  });

  const preferenceMutation = useMutation({
    mutationFn: studentsApi.updateMyPreferences,
    onSuccess: async (preferences) => {
      queryClient.setQueryData<StudentSelfProfile>(
        ["student-profile"],
        (current) => (current ? { ...current, preferences } : current),
      );
      setPreferenceForm(toPreferenceForm(preferences));
      await queryClient.invalidateQueries({
        queryKey: ["student-notifications"],
      });
      showToast(
        "Preferences saved",
        "Your language, timezone, and notification choices were updated.",
      );
    },
    onError: (error) =>
      showToast("Could not save preferences", readApiError(error), "error"),
  });

  const passwordMutation = useMutation({
    mutationFn: studentsApi.changeMyPassword,
    onSuccess: async (result) => {
      showToast("Password changed", result.message);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      window.setTimeout(() => void logoutMutation.mutateAsync(), 900);
    },
    onError: (error) =>
      showToast("Could not change password", readApiError(error), "error"),
  });

  const showToast = (
    title: string,
    message: string,
    tone: ToastState["tone"] = "success",
  ) => setToast({ id: Date.now(), title, message, tone });

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    profileMutation.mutate({
      ...profileForm,
      dateOfBirth: profileForm.dateOfBirth || null,
    });
  };

  const handlePreferenceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    preferenceMutation.mutate(preferenceForm);
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      showToast(
        "Password is too short",
        "Use at least 8 characters for your new password.",
        "error",
      );
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(
        "Passwords do not match",
        "Re-enter the same new password in both fields.",
        "error",
      );
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (profileQuery.isLoading) return <ProfileLoadingState />;
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ProfileErrorState
        message={readApiError(profileQuery.error)}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;
  const fullName = [profile.profile.firstName, profile.profile.lastName]
    .filter(Boolean)
    .join(" ");
  const activeEnrollment = profile.academic.enrollments[0];
  const initials = getInitials(fullName);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <div className={styles.avatar} aria-label={`${fullName} avatar`}>
            {profile.profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={profile.profile.avatar} />
            ) : (
              <span>{initials}</span>
            )}
            <i aria-hidden="true" />
          </div>
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
        <div className={styles.heroActions}>
          <div
            className={styles.completenessRing}
            style={
              {
                "--profile-progress": `${profile.profileCompleteness.percentage * 3.6}deg`,
              } as CSSProperties
            }
          >
            <div>
              <strong>{profile.profileCompleteness.percentage}%</strong>
              <span>complete</span>
            </div>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => setActiveTab("personal")}
            type="button"
          >
            <PencilLine size={16} /> Edit profile
          </button>
        </div>
      </section>

      <nav aria-label="Profile sections" className={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={activeTab === tab.id ? styles.activeTab : undefined}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" ? (
        <OverviewTab
          profile={profile}
          onEdit={() => setActiveTab("personal")}
        />
      ) : null}
      {activeTab === "personal" ? (
        <PersonalTab
          form={profileForm}
          isSaving={profileMutation.isPending}
          onChange={(field, value) =>
            setProfileForm((current) => ({ ...current, [field]: value }))
          }
          onReset={() => setProfileForm(toProfileForm(profile))}
          onSubmit={handleProfileSubmit}
          profile={profile}
        />
      ) : null}
      {activeTab === "academic" ? <AcademicTab profile={profile} /> : null}
      {activeTab === "preferences" ? (
        <PreferencesTab
          form={preferenceForm}
          isSaving={preferenceMutation.isPending}
          onChange={(field, value) =>
            setPreferenceForm((current) => ({ ...current, [field]: value }))
          }
          onSubmit={handlePreferenceSubmit}
        />
      ) : null}
      {activeTab === "security" ? (
        <SecurityTab
          form={passwordForm}
          isSaving={passwordMutation.isPending || logoutMutation.isPending}
          onChange={(field, value) =>
            setPasswordForm((current) => ({ ...current, [field]: value }))
          }
          onSubmit={handlePasswordSubmit}
          onToggleVisibility={() => setShowPasswords((current) => !current)}
          profile={profile}
          showPasswords={showPasswords}
        />
      ) : null}

      <ProfileToast onClose={() => setToast(null)} toast={toast} />
    </main>
  );
}

function OverviewTab({
  onEdit,
  profile,
}: {
  onEdit: () => void;
  profile: StudentSelfProfile;
}) {
  const enrollment = profile.academic.enrollments[0];
  const missing = profile.profileCompleteness.missingFields;

  return (
    <div className={styles.overviewGrid}>
      <section className={`${styles.card} ${styles.identityCard}`}>
        <SectionHeading
          icon={IdCard}
          kicker="ACCOUNT & IDENTITY"
          title="Student information"
        />
        <div className={styles.detailGrid}>
          <Detail label="Student ID" value={profile.student.studentCode} />
          <Detail
            label="Admission number"
            value={profile.student.admissionNumber ?? "Not assigned"}
          />
          <Detail
            label="Roll number"
            value={profile.student.rollNumber ?? "Not assigned"}
          />
          <Detail label="Status" value={sentenceCase(profile.student.status)} />
          <Detail label="Email" value={profile.account.email} />
          <Detail
            label="Primary phone"
            value={profile.account.phone ?? "Not added"}
          />
        </div>
        <div className={styles.managedNote}>
          <LockKeyhole size={15} />
          <span>
            Student ID, admission details, email, and primary phone are managed
            by your institute.
          </span>
        </div>
      </section>

      <section className={`${styles.card} ${styles.completionCard}`}>
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
            style={{ width: `${profile.profileCompleteness.percentage}%` }}
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

      <section className={styles.card}>
        <SectionHeading
          icon={GraduationCap}
          kicker="ACADEMIC SNAPSHOT"
          title={enrollment?.session.name ?? "Academic information"}
        />
        <div className={styles.academicSummary}>
          <div>
            <Building2 size={18} />
            <span>
              <small>Institution</small>
              <strong>
                {profile.student.organization?.name ?? "Not assigned"}
              </strong>
            </span>
          </div>
          <div>
            <GraduationCap size={18} />
            <span>
              <small>Education</small>
              <strong>
                {profile.academic.education?.name ?? "Not configured"}
              </strong>
            </span>
          </div>
          <div>
            <MapPin size={18} />
            <span>
              <small>Digital library</small>
              <strong>
                {profile.academic.digitalLibraryLocation?.name ??
                  "Not configured"}
              </strong>
            </span>
          </div>
        </div>
        <div className={styles.courseStrip}>
          {(enrollment?.courses ?? []).map((course) => (
            <span key={course.sessionCourseId}>
              <BookOpen size={14} /> {course.name}
            </span>
          ))}
          {!enrollment?.courses.length ? <em>No courses assigned</em> : null}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeading
          icon={Phone}
          kicker="CONTACT & SUPPORT"
          title="Your contact circle"
        />
        <div className={styles.contactList}>
          <ContactRow
            icon={Smartphone}
            label="Alternate phone"
            value={profile.profile.alternatePhone}
          />
          <ContactRow
            icon={UsersRound}
            label="Guardian"
            value={joinContact(
              profile.profile.guardianName,
              profile.profile.guardianPhone,
            )}
          />
          <ContactRow
            icon={AlertCircle}
            label="Emergency contact"
            value={joinContact(
              profile.profile.emergencyContactName,
              profile.profile.emergencyContactPhone,
            )}
          />
          <ContactRow
            icon={MapPin}
            label="Address"
            value={formatAddress(profile.profile)}
          />
        </div>
      </section>

      {profile.customRegistrationAnswers.length ? (
        <section className={`${styles.card} ${styles.fullWidthCard}`}>
          <SectionHeading
            icon={IdCard}
            kicker="REGISTRATION DETAILS"
            title="Additional information"
          />
          <div className={styles.registrationGrid}>
            {profile.customRegistrationAnswers.map((answer) => (
              <Detail
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
}

function PersonalTab({
  form,
  isSaving,
  onChange,
  onReset,
  onSubmit,
  profile,
}: {
  form: ProfileForm;
  isSaving: boolean;
  onChange: (field: keyof ProfileForm, value: string) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  profile: StudentSelfProfile;
}) {
  return (
    <form className={styles.formLayout} onSubmit={onSubmit}>
      <section className={styles.card}>
        <SectionHeading
          icon={UserRound}
          kicker="PERSONAL DETAILS"
          title="About you"
          description="Keep your name and personal details accurate."
        />
        <div className={styles.formGrid}>
          <Field label="First name" required>
            <input
              maxLength={100}
              minLength={2}
              onChange={(event) => onChange("firstName", event.target.value)}
              required
              value={form.firstName}
            />
          </Field>
          <Field label="Last name">
            <input
              maxLength={100}
              onChange={(event) => onChange("lastName", event.target.value)}
              value={form.lastName}
            />
          </Field>
          <Field label="Date of birth">
            <input
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => onChange("dateOfBirth", event.target.value)}
              type="date"
              value={form.dateOfBirth}
            />
          </Field>
          <Field label="Gender">
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
          </Field>
          <Field label="Avatar image URL" wide>
            <input
              maxLength={2048}
              onChange={(event) => onChange("avatar", event.target.value)}
              placeholder="https://example.com/my-photo.jpg"
              type="url"
              value={form.avatar}
            />
          </Field>
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
          <Field label="Alternate phone">
            <input
              maxLength={30}
              onChange={(event) =>
                onChange("alternatePhone", event.target.value)
              }
              placeholder="Add another contact number"
              type="tel"
              value={form.alternatePhone}
            />
          </Field>
          <Field label="Postal code">
            <input
              maxLength={20}
              onChange={(event) => onChange("postalCode", event.target.value)}
              value={form.postalCode}
            />
          </Field>
          <Field label="Address" wide>
            <textarea
              maxLength={1000}
              onChange={(event) => onChange("address", event.target.value)}
              rows={3}
              value={form.address}
            />
          </Field>
          <Field label="City">
            <input
              maxLength={100}
              onChange={(event) => onChange("city", event.target.value)}
              value={form.city}
            />
          </Field>
          <Field label="State">
            <input
              maxLength={100}
              onChange={(event) => onChange("state", event.target.value)}
              value={form.state}
            />
          </Field>
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeading
          icon={UsersRound}
          kicker="SUPPORT CONTACTS"
          title="Guardian and emergency details"
        />
        <div className={styles.formGrid}>
          <Field label="Guardian name">
            <input
              maxLength={150}
              onChange={(event) => onChange("guardianName", event.target.value)}
              value={form.guardianName}
            />
          </Field>
          <Field label="Guardian phone">
            <input
              maxLength={30}
              onChange={(event) =>
                onChange("guardianPhone", event.target.value)
              }
              type="tel"
              value={form.guardianPhone}
            />
          </Field>
          <Field label="Emergency contact name">
            <input
              maxLength={150}
              onChange={(event) =>
                onChange("emergencyContactName", event.target.value)
              }
              value={form.emergencyContactName}
            />
          </Field>
          <Field label="Emergency contact phone">
            <input
              maxLength={30}
              onChange={(event) =>
                onChange("emergencyContactPhone", event.target.value)
              }
              type="tel"
              value={form.emergencyContactPhone}
            />
          </Field>
        </div>
      </section>

      <FormActions isSaving={isSaving} onReset={onReset} />
    </form>
  );
}

function AcademicTab({ profile }: { profile: StudentSelfProfile }) {
  return (
    <div className={styles.academicLayout}>
      <div className={styles.readOnlyBanner}>
        <LockKeyhole size={18} />
        <div>
          <strong>Academic details are institute-managed</strong>
          <span>
            Contact your administrator if your student ID, enrollment, or course
            assignment is incorrect.
          </span>
        </div>
      </div>
      <section className={styles.card}>
        <SectionHeading
          icon={Building2}
          kicker="INSTITUTION"
          title={profile.student.organization?.name ?? "Institution details"}
        />
        <div className={styles.detailGrid}>
          <Detail label="Student ID" value={profile.student.studentCode} />
          <Detail
            label="Admission number"
            value={profile.student.admissionNumber ?? "Not assigned"}
          />
          <Detail
            label="Roll number"
            value={profile.student.rollNumber ?? "Not assigned"}
          />
          <Detail
            label="Education"
            value={profile.academic.education?.name ?? "Not configured"}
          />
          <Detail
            label="Digital library"
            value={
              profile.academic.digitalLibraryLocation?.name ?? "Not configured"
            }
          />
          <Detail
            label="Enrollment status"
            value={sentenceCase(profile.student.status)}
          />
        </div>
      </section>
      {profile.academic.enrollments.map((enrollment) => (
        <section className={styles.card} key={enrollment.id}>
          <div className={styles.sessionHeader}>
            <SectionHeading
              icon={CalendarDays}
              kicker="ACADEMIC SESSION"
              title={enrollment.session.name}
            />
            <span>{sentenceCase(enrollment.status)}</span>
          </div>
          <div className={styles.sessionDates}>
            <span>
              <CalendarDays size={15} />
              {formatDate(enrollment.session.startDate)} –{" "}
              {formatDate(enrollment.session.endDate)}
            </span>
            {enrollment.session.code ? (
              <span>{enrollment.session.code}</span>
            ) : null}
          </div>
          <div className={styles.courseGrid}>
            {enrollment.courses.map((course) => (
              <article key={course.sessionCourseId}>
                <div>
                  <BookOpen size={19} />
                </div>
                <span>
                  <small>{course.course.code}</small>
                  <strong>{course.name}</strong>
                  <em>Enrolled course</em>
                </span>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PreferencesTab({
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
}) {
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
          <Field label="Language">
            <select
              onChange={(event) => onChange("language", event.target.value)}
              value={form.language}
            >
              <option value="en">English</option>
              <option value="hi-IN">Hindi</option>
            </select>
          </Field>
          <Field label="Timezone">
            <select
              onChange={(event) => onChange("timezone", event.target.value)}
              value={form.timezone}
            >
              <option value="Asia/Kolkata">India Standard Time</option>
              <option value="UTC">Coordinated Universal Time</option>
              <option value="Asia/Dubai">Gulf Standard Time</option>
              <option value="Asia/Singapore">Singapore Standard Time</option>
            </select>
          </Field>
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
        <div className={styles.reminderGrid}>
          {reminderOptions.map((option) => {
            const checked = form.examReminderOffsetsMinutes.includes(
              option.minutes,
            );
            return (
              <label data-selected={checked} key={option.minutes}>
                <input
                  checked={checked}
                  disabled={
                    !checked && form.examReminderOffsetsMinutes.length >= 4
                  }
                  onChange={() => toggleReminder(option.minutes)}
                  type="checkbox"
                />
                <span>
                  <Clock3 size={17} />
                  <strong>{option.label}</strong>
                </span>
                <i>{checked ? <Check size={14} /> : null}</i>
              </label>
            );
          })}
        </div>
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
}

function SecurityTab({
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
}) {
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
          <Detail label="Sign-in email" value={profile.account.email} />
          <Detail
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
}

function SectionHeading({
  description,
  icon: Icon,
  kicker,
  title,
}: {
  description?: string;
  icon: typeof UserRound;
  kicker: string;
  title: string;
}) {
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
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detail}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <span>
        <Icon size={16} />
      </span>
      <p>
        <small>{label}</small>
        <strong>{value || "Not provided"}</strong>
      </p>
    </div>
  );
}

function Field({
  children,
  label,
  required,
  wide,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? styles.wideField : undefined}>
      <span>
        {label} {required ? <i>*</i> : null}
      </span>
      {children}
    </label>
  );
}

function ReadOnlyField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div>
      <Icon size={16} />
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <LockKeyhole size={14} />
    </div>
  );
}

function PreferenceToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        role="switch"
        type="checkbox"
      />
    </label>
  );
}

function PasswordField({
  label,
  onChange,
  onToggleVisibility,
  show,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  show: boolean;
  value: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <div>
        <input
          autoComplete={
            label === "Current password" ? "current-password" : "new-password"
          }
          maxLength={72}
          minLength={label === "Current password" ? undefined : 8}
          onChange={(event) => onChange(event.target.value)}
          required
          type={show ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={show ? "Hide passwords" : "Show passwords"}
          onClick={onToggleVisibility}
          type="button"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}

function FormActions({
  isSaving,
  onReset,
}: {
  isSaving: boolean;
  onReset: () => void;
}) {
  return (
    <div className={styles.formActions}>
      <span>Only student-editable fields will be changed.</span>
      <div>
        <button
          className={styles.secondaryButton}
          disabled={isSaving}
          onClick={onReset}
          type="button"
        >
          Reset changes
        </button>
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
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </div>
    </div>
  );
}

function ProfileLoadingState() {
  return (
    <div className={styles.loadingState}>
      <LoaderCircle className={styles.spin} size={28} />
      <strong>Loading your profile</strong>
      <span>Gathering your account and academic details...</span>
    </div>
  );
}

function ProfileErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.loadingState}>
      <AlertCircle size={28} />
      <strong>We could not load your profile</strong>
      <span>{message}</span>
      <button className={styles.primaryButton} onClick={onRetry} type="button">
        <RefreshCw size={15} /> Try again
      </button>
    </div>
  );
}

function ProfileToast({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: ToastState | null;
}) {
  if (!toast) return null;
  const Icon = toast.tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={styles.toast}
      data-tone={toast.tone}
      key={toast.id}
      role="status"
    >
      <Icon size={19} />
      <span>
        <strong>{toast.title}</strong>
        <small>{toast.message}</small>
      </span>
      <button aria-label="Dismiss message" onClick={onClose} type="button">
        <X size={14} />
      </button>
    </div>
  );
}

function toProfileForm(profile: StudentSelfProfile): ProfileForm {
  return {
    firstName: profile.profile.firstName,
    lastName: profile.profile.lastName ?? "",
    dateOfBirth: profile.profile.dateOfBirth?.slice(0, 10) ?? "",
    gender: profile.profile.gender ?? "",
    alternatePhone: profile.profile.alternatePhone ?? "",
    address: profile.profile.address ?? "",
    city: profile.profile.city ?? "",
    state: profile.profile.state ?? "",
    postalCode: profile.profile.postalCode ?? "",
    avatar: profile.profile.avatar ?? "",
    guardianName: profile.profile.guardianName ?? "",
    guardianPhone: profile.profile.guardianPhone ?? "",
    emergencyContactName: profile.profile.emergencyContactName ?? "",
    emergencyContactPhone: profile.profile.emergencyContactPhone ?? "",
  };
}

function toPreferenceForm(
  preferences: StudentProfilePreferences,
): PreferenceForm {
  return {
    timezone: preferences.timezone,
    language: preferences.language,
    inAppNotifications: preferences.inAppNotifications,
    emailNotifications: preferences.emailNotifications,
    examReminders: preferences.examReminders,
    resourceUpdates: preferences.resourceUpdates,
    announcementNotifications: preferences.announcementNotifications,
    securityAlerts: preferences.securityAlerts,
    examReminderOffsetsMinutes: preferences.examReminderOffsetsMinutes,
  };
}

const emptyProfileForm: ProfileForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  alternatePhone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  avatar: "",
  guardianName: "",
  guardianPhone: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

const emptyPreferenceForm: PreferenceForm = {
  timezone: "Asia/Kolkata",
  language: "en",
  inAppNotifications: true,
  emailNotifications: false,
  examReminders: true,
  resourceUpdates: true,
  announcementNotifications: true,
  securityAlerts: true,
  examReminderOffsetsMinutes: [1440, 60],
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function sentenceCase(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function fieldLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function formatAddress(profile: StudentSelfProfile["profile"]) {
  return [profile.address, profile.city, profile.state, profile.postalCode]
    .filter(Boolean)
    .join(", ");
}

function joinContact(name: string | null, phone: string | null) {
  return [name, phone].filter(Boolean).join(" · ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function readApiError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(" ");
    if (data.message) return data.message;
  }
  return "Please try again. If the problem continues, contact your administrator.";
}
