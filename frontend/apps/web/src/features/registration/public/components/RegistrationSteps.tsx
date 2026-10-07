import { Children, useState, type ComponentProps } from "react";
import Link from "next/link";
import {
  RegistrationForm,
  getRegistrationPersonalFields,
} from "./RegistrationForm";
import { CustomField } from "./fields/CustomField";
import { CourseInterestSelector } from "./CourseInterestSelector";
import { validateRegistrationForm } from "../utils/validateRegistrationForm";

export function RegistrationSteps(
  props: ComponentProps<typeof RegistrationForm>,
) {
  const { form, setForm, page, clientError, isSubmitting, onSubmit } = props;
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const personal = Children.toArray(
    getRegistrationPersonalFields(form, setForm, page).props.children,
  );
  const customPages = Math.ceil(page.fields.length / 2);
  const personalSteps = [
    personal.slice(0, 3),
    personal.slice(3, 7),
    personal.slice(7, 9),
  ];
  const lastStep = 3 + customPages;
  const labels = ["About you", "Contact & security", "Your learning profile"];
  const stepError = () => {
    const result = validateRegistrationForm(page, form);
    if (!result) return null;
    const prefixes =
      step === 0
        ? ["Student name", "Gender", "Email", "Enter a valid email"]
        : step === 1
          ? [
              "Mobile",
              "Enter a valid mobile",
              "Date of birth",
              "Password must",
              "Password and confirm",
            ]
          : step === 2
            ? ["Education", "Digital Library"]
            : page.fields
                .slice((step - 3) * 2, (step - 2) * 2)
                .map((field) => field.label);
    return prefixes.some((prefix) => result.startsWith(prefix)) ? result : null;
  };
  return (
    <section className="registration-form-panel kdl-step-panel">
      <div className="kdl-step-heading">
        <span className="kdl-register-eyebrow">STUDENT REGISTRATION</span>
        <span>
          Step {step + 1} of {lastStep + 1}
        </span>
      </div>
      <div className="kdl-step-progress" aria-hidden="true">
        <span style={{ width: `${((step + 1) / (lastStep + 1)) * 100}%` }} />
      </div>
      <form
        onSubmit={(event) => {
          if (step === lastStep) {
            onSubmit(event);
            return;
          }
          event.preventDefault();
          const message = stepError();
          setError(message);
          if (!message) setStep((current) => current + 1);
        }}
      >
        <h2 className="kdl-step-title" tabIndex={-1}>
          {step < 3
            ? labels[step]
            : step < lastStep
              ? "Registration details"
              : "Choose your interests"}
        </h2>
        <div className="kdl-step-fields">
          {step < 3 ? (
            <div
              className={`registration-form-grid${step === 1 ? " kdl-security-grid" : ""}`}
            >
              {personalSteps[step]}
            </div>
          ) : step < lastStep ? (
            <div className="registration-form-grid">
              {page.fields
                .slice((step - 3) * 2, (step - 2) * 2)
                .map((field) => (
                  <CustomField
                    key={field.fieldKey}
                    field={field}
                    value={form.customAnswers[field.fieldKey] ?? ""}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        customAnswers: {
                          ...current.customAnswers,
                          [field.fieldKey]: value,
                        },
                      }))
                    }
                  />
                ))}
            </div>
          ) : (
            <CourseInterestSelector
              courses={page.courses}
              selectedCourseUuids={form.selectedSessionCourseUuids}
              onChange={(selectedSessionCourseUuids) =>
                setForm((current) => ({
                  ...current,
                  selectedSessionCourseUuids,
                }))
              }
            />
          )}
        </div>
        {error || clientError ? (
          <div className="registration-error" role="alert">
            {error || clientError}
          </div>
        ) : null}
        <div className="kdl-step-actions">
          {step > 0 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setStep((current) => current - 1);
                setError(null);
              }}
            >
              Back
            </button>
          ) : null}
          <button
            className="registration-submit-button"
            type="submit"
            disabled={isSubmitting || page.courses.length === 0}
          >
            {isSubmitting
              ? "Submitting..."
              : step === lastStep
                ? page.registration.submitButtonText
                : "Continue"}
          </button>
        </div>
        <div className="kdl-step-login-footer">
          <span>Already have an account?</span>
          <Link className="kdl-step-login" href="/login">
            Log in <span aria-hidden="true">→</span>
          </Link>
        </div>
      </form>
    </section>
  );
}
