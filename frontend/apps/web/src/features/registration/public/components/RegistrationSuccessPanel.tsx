import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type {
  PublicRegistrationPage,
  PublicRegistrationSubmitResponse,
} from "@repo/types";

import { storeLoginPrefill } from "@/features/auth/login-prefill";

type RegistrationSuccessPanelProps = {
  loginEmail: string;
  loginPassword: string;
  page: PublicRegistrationPage;
  result: PublicRegistrationSubmitResponse;
};

export const RegistrationSuccessPanel = ({
  loginEmail,
  loginPassword,
  page,
  result,
}: RegistrationSuccessPanelProps) => {
  const loginHref = `/login?email=${encodeURIComponent(
    loginEmail,
  )}&registered=1`;

  return (
    <section className="registration-success-panel">
      <div className="registration-success-icon">
        <CheckCircle2 size={34} />
      </div>
      <h1>{result.successTitle}</h1>
      <p>
        Welcome, {result.student.firstName}. {result.successMessage}
      </p>
      <div className="registration-success-summary">
        <span>{result.organization.name}</span>
        <strong>{result.session.name}</strong>
      </div>
      <div className="registration-success-courses">
        {result.selectedCourses.map((course) => (
          <span key={course.uuid}>{course.name}</span>
        ))}
      </div>
      {result.loginAvailable ? (
        <Link
          className="registration-login-link"
          href={loginHref}
          onClick={() => storeLoginPrefill(loginEmail, loginPassword)}
        >
          Continue to Login
        </Link>
      ) : (
        <div className="registration-inline-state">
          Your organization will share account access details separately.
        </div>
      )}
      <small>{page.organization.name}</small>
    </section>
  );
};
