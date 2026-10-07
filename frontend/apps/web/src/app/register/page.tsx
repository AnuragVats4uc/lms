import KdlRegistrationPage from "@/features/registration/public/KdlRegistrationPage";

export default function Page() {
  const slug =
    process.env.DEFAULT_REGISTRATION_SLUG?.trim() || "student-registration";
  return <KdlRegistrationPage slug={slug} />;
}
