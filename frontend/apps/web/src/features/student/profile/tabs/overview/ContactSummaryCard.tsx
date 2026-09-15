import {
  AlertCircle,
  MapPin,
  Phone,
  Smartphone,
  UsersRound,
} from "lucide-react";
import type { StudentSelfProfile } from "@repo/types";

import { ProfileContactRow } from "../../components/details/ProfileContactRow";
import { SectionHeading } from "../../components/SectionHeading";
import styles from "../../StudentProfilePage.module.css";
import { formatAddress, joinContact } from "../../utils/profileFormatting";

export const ContactSummaryCard = ({
  profile,
}: {
  profile: StudentSelfProfile;
}) => (
  <section className={styles.card}>
    <SectionHeading
      icon={Phone}
      kicker="CONTACT & SUPPORT"
      title="Your contact circle"
    />
    <div className={styles.contactList}>
      <ProfileContactRow
        icon={Smartphone}
        label="Alternate phone"
        value={profile.profile.alternatePhone}
      />
      <ProfileContactRow
        icon={UsersRound}
        label="Guardian"
        value={joinContact(
          profile.profile.guardianName,
          profile.profile.guardianPhone,
        )}
      />
      <ProfileContactRow
        icon={AlertCircle}
        label="Emergency contact"
        value={joinContact(
          profile.profile.emergencyContactName,
          profile.profile.emergencyContactPhone,
        )}
      />
      <ProfileContactRow
        icon={MapPin}
        label="Address"
        value={formatAddress(profile.profile)}
      />
    </div>
  </section>
);
