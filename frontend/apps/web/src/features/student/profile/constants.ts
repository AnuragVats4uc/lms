import {
  GraduationCap,
  IdCard,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ProfileTab } from "./types";

export const tabs: Array<{
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

export const reminderOptions = [
  { minutes: 15, label: "15 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 1440, label: "1 day before" },
  { minutes: 10080, label: "1 week before" },
];
