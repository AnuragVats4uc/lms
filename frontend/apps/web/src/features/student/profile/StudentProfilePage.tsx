"use client";

import styles from "./StudentProfilePage.module.css";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileTabNavigation } from "./components/ProfileTabNavigation";
import { ProfileToast } from "./components/ProfileToast";
import { ProfileErrorState } from "./components/states/ProfileErrorState";
import { ProfileLoadingState } from "./components/states/ProfileLoadingState";
import { usePersonalProfileForm } from "./hooks/usePersonalProfileForm";
import { useProfileAvatar } from "./hooks/useProfileAvatar";
import { useProfileNavigation } from "./hooks/useProfileNavigation";
import { useProfilePassword } from "./hooks/useProfilePassword";
import { useProfilePreferences } from "./hooks/useProfilePreferences";
import { useProfileToast } from "./hooks/useProfileToast";
import { useStudentProfile } from "./hooks/useStudentProfile";
import { AcademicTab } from "./tabs/academic/AcademicTab";
import { OverviewTab } from "./tabs/overview/OverviewTab";
import { PersonalTab } from "./tabs/personal/PersonalTab";
import { PreferencesTab } from "./tabs/preferences/PreferencesTab";
import { SecurityTab } from "./tabs/security/SecurityTab";
import { readProfileApiError } from "./utils/profileErrors";
import { getInitials } from "./utils/profileFormatting";

export const StudentProfilePage = () => {
  const profileQuery = useStudentProfile();
  const { activeTab, setActiveTab } = useProfileNavigation();
  const { clearToast, showToast, toast } = useProfileToast();
  const personal = usePersonalProfileForm(profileQuery.data, showToast);
  const preferences = useProfilePreferences(profileQuery.data, showToast);
  const password = useProfilePassword(showToast);
  const avatar = useProfileAvatar(profileQuery.data?.profile.avatar, showToast);

  if (profileQuery.isLoading) return <ProfileLoadingState />;
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ProfileErrorState
        message={readProfileApiError(profileQuery.error)}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;
  const fullName = [profile.profile.firstName, profile.profile.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = getInitials(fullName);

  return (
    <main className={styles.page}>
      <ProfileHeader
        avatarSrc={avatar.avatarSrc}
        fullName={fullName}
        initials={initials}
        onEdit={() => setActiveTab("personal")}
        profile={profile}
      />
      <ProfileTabNavigation activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <OverviewTab
          profile={profile}
          onEdit={() => setActiveTab("personal")}
        />
      ) : null}
      {activeTab === "personal" ? (
        <PersonalTab
          avatarSrc={avatar.avatarSrc}
          form={personal.form}
          isAvatarBusy={avatar.isBusy}
          isSaving={personal.isSaving}
          onAvatarDelete={avatar.onDelete}
          onAvatarSelect={avatar.onSelect}
          onChange={personal.onChange}
          onReset={personal.onReset}
          onSubmit={personal.onSubmit}
          profile={profile}
        />
      ) : null}
      {activeTab === "academic" ? <AcademicTab profile={profile} /> : null}
      {activeTab === "preferences" ? (
        <PreferencesTab
          form={preferences.form}
          isSaving={preferences.isSaving}
          onChange={preferences.onChange}
          onSubmit={preferences.onSubmit}
        />
      ) : null}
      {activeTab === "security" ? (
        <SecurityTab
          form={password.form}
          isSaving={password.isSaving}
          onChange={password.onChange}
          onSubmit={password.onSubmit}
          onToggleVisibility={password.onToggleVisibility}
          profile={profile}
          showPasswords={password.showPasswords}
        />
      ) : null}

      <ProfileToast onClose={clearToast} toast={toast} />
    </main>
  );
};
