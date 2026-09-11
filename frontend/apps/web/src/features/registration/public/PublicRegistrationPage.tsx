"use client";

import type { CSSProperties } from "react";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { RegistrationBrandPanel } from "./components/RegistrationBrandPanel";
import { RegistrationForm } from "./components/RegistrationForm";
import { RegistrationStatePanel as StatePanel } from "./components/RegistrationStatePanel";
import { RegistrationSuccessPanel as SuccessPanel } from "./components/RegistrationSuccessPanel";
import { usePublicRegistration } from "./hooks/usePublicRegistration";

const PublicRegistrationRoute = () => {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug ?? "");
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
          title="Registration page not found."
          description="Check the link and try again."
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
        />
      </main>
    );
  }

  return (
    <main className="registration-public-shell" style={theme}>
      <div className="registration-public-page">
        <RegistrationBrandPanel page={page} />
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
