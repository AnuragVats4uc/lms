"use client";

import type { CSSProperties } from "react";
import { AlertCircle } from "lucide-react";

import { RegistrationBrandPanel } from "./components/RegistrationBrandPanel";
import { RegistrationForm } from "./components/RegistrationForm";
import { RegistrationStatePanel as StatePanel } from "./components/RegistrationStatePanel";
import { RegistrationSuccessPanel as SuccessPanel } from "./components/RegistrationSuccessPanel";
import { usePublicRegistration } from "./hooks/usePublicRegistration";
import { getRegistrationErrorMessage } from "./utils/getRegistrationErrorMessage";

type PublicRegistrationProps = {
  slug: string;
  showSession?: boolean;
};

const PublicRegistrationRoute = ({
  slug,
  showSession = true,
}: PublicRegistrationProps) => {
  const {
    clientError,
    form,
    pageQuery,
    setForm,
    submit,
    submitMutation,
    success,
  } = usePublicRegistration(slug);

  const page = pageQuery.data;
  const theme = {
    "--registration-primary": page?.registration.primaryColor ?? "#059669",
    "--registration-accent": page?.registration.accentColor ?? "#2563EB",
  } as CSSProperties;

  if (pageQuery.isLoading) {
    return (
      <main className="registration-public-shell" style={theme}>
        <StatePanel title="Loading registration" description="Please wait." />
      </main>
    );
  }

  if (pageQuery.isError || !page) {
    return (
      <main className="registration-public-shell" style={theme}>
        <StatePanel
          icon={<AlertCircle size={24} />}
          title="Registration unavailable"
          description={getRegistrationErrorMessage(
            pageQuery.error,
            "Unable to connect to the registration service. Please try again shortly.",
          )}
        />
      </main>
    );
  }

  if (success) {
    return (
      <main className="registration-public-shell" style={theme}>
        <SuccessPanel
          loginEmail={success.loginEmail || form.email.trim().toLowerCase()}
          loginPassword={form.password}
          page={page}
          result={success}
          showSession={showSession}
        />
      </main>
    );
  }

  return (
    <main className="registration-public-shell" style={theme}>
      <div className="registration-public-page">
        <RegistrationBrandPanel page={page} showSession={showSession} />
        <RegistrationForm
          clientError={clientError}
          form={form}
          isSubmitting={submitMutation.isPending}
          onSubmit={submit}
          page={page}
          setForm={setForm}
        />
      </div>
    </main>
  );
};

export default PublicRegistrationRoute;
