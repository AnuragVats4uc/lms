"use client";

import Image from "next/image";
import { RegistrationSteps } from "./components/RegistrationSteps";
import { RegistrationStatePanel } from "./components/RegistrationStatePanel";
import { RegistrationSuccessPanel } from "./components/RegistrationSuccessPanel";
import { usePublicRegistration } from "./hooks/usePublicRegistration";
import { getRegistrationErrorMessage } from "./utils/getRegistrationErrorMessage";
import "./kdl-registration.css";

export default function KdlRegistrationPage({ slug }: { slug: string }) {
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

  return (
    <main className="kdl-register">
      <div className="kdl-register-content">
        <section
          className="kdl-register-intro"
          aria-labelledby="registration-title"
        >
          <div className="kdl-register-intro-copy">
            <Image
              src="/images/keonjhar-digital-library.jpeg"
              alt="Keonjhar Digital Library"
              width={1254}
              height={1254}
              className="kdl-register-logo"
              priority
              unoptimized
            />
            <span className="kdl-register-eyebrow">
              YOUR NEXT CHAPTER STARTS HERE
            </span>
            <h1 id="registration-title">
              Create your
              <br />
              <em>student account.</em>
            </h1>
            <p>
              Join Keonjhar Digital Library and take the next step in your
              preparation. One account, a world of learning.
            </p>
          </div>
        </section>

        <section
          className="kdl-register-card"
          aria-label="Student registration"
        >
          {pageQuery.isLoading ? (
            <RegistrationStatePanel
              title="Loading registration"
              description="Please wait while we prepare your form."
            />
          ) : pageQuery.isError || !page ? (
            <RegistrationStatePanel
              title="Registration unavailable"
              description={getRegistrationErrorMessage(
                pageQuery.error,
                "Unable to connect to the registration service. Please try again shortly.",
              )}
            />
          ) : success ? (
            <RegistrationSuccessPanel
              loginEmail={success.loginEmail || form.email.trim().toLowerCase()}
              loginPassword={form.password}
              page={page}
              result={success}
              showSession={false}
            />
          ) : (
            <RegistrationSteps
              clientError={clientError}
              form={form}
              isSubmitting={submitMutation.isPending}
              onSubmit={submit}
              page={page}
              setForm={setForm}
            />
          )}
        </section>
      </div>
    </main>
  );
}
