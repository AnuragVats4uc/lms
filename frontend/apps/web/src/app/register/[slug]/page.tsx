"use client";

import {
  useState,
  useId,
  type CSSProperties,
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LifeBuoy,
} from "lucide-react";
import { registrationApi } from "@repo/api";
import type {
  PublicRegistrationPage,
  PublicRegistrationSubmitResponse,
  RegistrationField,
} from "@repo/types";

import { CrudSelect } from "@/features/admin/components/crud/CrudSelect";

type FormState = {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  educationOptionUuid: string;
  digitalLibraryLocationUuid: string;
  customAnswers: Record<string, string>;
  selectedSessionCourseUuids: string[];
};

const initialForm: FormState = {
  fullName: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  educationOptionUuid: "",
  digitalLibraryLocationUuid: "",
  customAnswers: {},
  selectedSessionCourseUuids: [],
};

const LOGIN_PREFILL_STORAGE_KEY = "lms.registrationLoginPrefill";

export default function PublicRegistrationRoute() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug ?? "");
  const [form, setForm] = useState<FormState>(initialForm);
  const [clientError, setClientError] = useState<string | null>(null);
  const [success, setSuccess] =
    useState<PublicRegistrationSubmitResponse | null>(null);

  const pageQuery = useQuery({
    queryFn: () => registrationApi.getPublic(slug),
    queryKey: ["public-registration", slug],
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: Parameters<typeof registrationApi.submitPublic>[1]) =>
      registrationApi.submitPublic(slug, payload),
    onSuccess: (data) => {
      setSuccess(data);
      setClientError(null);
    },
    onError: (error) => {
      setClientError(
        errorMessage(error, "Registration could not be submitted."),
      );
    },
  });

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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm(page, form);
    if (validationError) {
      setClientError(validationError);
      return;
    }

    const [firstName, ...lastNameParts] = form.fullName.trim().split(/\s+/);
    submitMutation.mutate({
      firstName,
      lastName: lastNameParts.join(" ") || undefined,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      educationOptionUuid: form.educationOptionUuid,
      digitalLibraryLocationUuid: form.digitalLibraryLocationUuid,
      customAnswers: form.customAnswers,
      selectedSessionCourseUuids: form.selectedSessionCourseUuids,
    });
  };

  return (
    <main className="registration-public-shell" style={theme}>
      <div className="registration-public-page">
        <aside className="registration-brand-panel">
          <div className="registration-brand-lockup">
            <div className="registration-logo-mark">
              {page.organization.logo ? (
                <Image
                  alt={`${page.organization.name} logo`}
                  height={46}
                  unoptimized
                  src={page.organization.logo}
                  width={46}
                />
              ) : (
                <GraduationCap aria-hidden="true" size={24} />
              )}
            </div>
            <div>
              <strong>{page.organization.name}</strong>
              <span>{page.session.name}</span>
            </div>
          </div>
          <div className="registration-brand-copy">
            <span>Student Registration</span>
            <h1>{page.registration.title}</h1>
            {page.registration.description ? (
              <p>{page.registration.description}</p>
            ) : null}
          </div>
          {page.registration.heroImage ? (
            <Image
              alt=""
              className="registration-hero-image"
              height={220}
              unoptimized
              src={page.registration.heroImage}
              width={520}
            />
          ) : (
            <div className="registration-hero-placeholder" aria-hidden="true">
              <BookOpen size={42} />
              <span>Learning access starts here</span>
            </div>
          )}
          {page.organization.email || page.organization.phone ? (
            <div className="registration-support">
              <LifeBuoy aria-hidden="true" size={16} />
              <span>{page.organization.email ?? page.organization.phone}</span>
            </div>
          ) : null}
        </aside>

        <section className="registration-form-panel">
          <form onSubmit={submit}>
            <div className="registration-section-heading">
              <span>Personal Details</span>
              <strong>Complete your student profile</strong>
            </div>

            <div className="registration-form-grid">
              <InputField
                label="Student Name"
                required
                value={form.fullName}
                onChange={(value) =>
                  setForm((current) => ({ ...current, fullName: value }))
                }
              />
              <SelectField
                label="Gender"
                required
                value={form.gender}
                options={[
                  { label: "Male", value: "MALE" },
                  { label: "Female", value: "FEMALE" },
                  { label: "Other", value: "OTHER" },
                ]}
                onChange={(value) =>
                  setForm((current) => ({ ...current, gender: value }))
                }
              />
              <InputField
                label="Email Address"
                inputMode="email"
                required
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm((current) => ({ ...current, email: value }))
                }
              />
              <InputField
                label="Mobile Number"
                required
                inputMode="tel"
                value={form.phone}
                onChange={(value) =>
                  setForm((current) => ({ ...current, phone: value }))
                }
              />
              <InputField
                label="Date of Birth"
                required
                type="date"
                value={form.dateOfBirth}
                onChange={(value) =>
                  setForm((current) => ({ ...current, dateOfBirth: value }))
                }
              />
              <PasswordField
                label="Password"
                required
                value={form.password}
                onChange={(value) =>
                  setForm((current) => ({ ...current, password: value }))
                }
              />
              <PasswordField
                label="Confirm Password"
                required
                value={form.confirmPassword}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    confirmPassword: value,
                  }))
                }
              />
              <SelectField
                label="Education"
                required
                value={form.educationOptionUuid}
                options={page.educationOptions.map((option) => ({
                  label: option.name,
                  value: option.uuid,
                }))}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    educationOptionUuid: value,
                  }))
                }
              />
              <SelectField
                label="Digital Library Location"
                required
                value={form.digitalLibraryLocationUuid}
                options={page.digitalLibraryLocations.map((location) => ({
                  label: location.name,
                  value: location.uuid,
                }))}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    digitalLibraryLocationUuid: value,
                  }))
                }
              />
            </div>

            {page.fields.length ? (
              <>
                <div className="registration-section-heading">
                  <span>Registration Details</span>
                  <strong>Organization-specific information</strong>
                </div>
                <div className="registration-form-grid">
                  {page.fields.map((field) => (
                    <CustomField
                      field={field}
                      key={field.fieldKey}
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
              </>
            ) : null}

            <div className="registration-section-heading">
              <span>Course Selection</span>
              <strong>Which course/exam are you preparing for? *</strong>
              <small>Select one or more.</small>
            </div>
            {page.courses.length ? (
              <div className="registration-course-grid">
                {page.courses.map((course) => {
                  const selected = form.selectedSessionCourseUuids.includes(
                    course.uuid,
                  );
                  return (
                    <button
                      aria-pressed={selected}
                      className={
                        selected
                          ? "registration-course-choice is-selected"
                          : "registration-course-choice"
                      }
                      key={course.uuid}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          selectedSessionCourseUuids: selected
                            ? current.selectedSessionCourseUuids.filter(
                                (uuid) => uuid !== course.uuid,
                              )
                            : [
                                ...current.selectedSessionCourseUuids,
                                course.uuid,
                              ],
                        }))
                      }
                      type="button"
                    >
                      <span>{selected ? <Check size={15} /> : null}</span>
                      <strong>{course.name}</strong>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="registration-inline-state">
                No courses are currently available for this registration.
              </div>
            )}

            {clientError ? (
              <div className="registration-error">{clientError}</div>
            ) : null}

            <button
              className="registration-submit-button"
              disabled={submitMutation.isPending || page.courses.length === 0}
              type="submit"
            >
              {submitMutation.isPending
                ? "Submitting..."
                : page.registration.submitButtonText}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function InputField({
  inputMode,
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="registration-field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <input
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function PasswordField({
  label,
  onChange,
  required,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <label className="registration-field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <div className="registration-password-field">
        <input
          autoComplete="new-password"
          onChange={(event) => onChange(event.target.value)}
          required={required}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <Icon size={16} />
        </button>
      </div>
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  required,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  value: string;
}) {
  const labelId = useId();

  return (
    <div className="registration-field">
      <span id={labelId}>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <CrudSelect
        ariaLabel={label}
        describedBy={labelId}
        onChange={onChange}
        options={options}
        placeholder="Select"
        value={value}
        variant="form"
        width="100%"
      />
    </div>
  );
}

function CustomField({
  field,
  onChange,
  value,
}: {
  field: RegistrationField;
  onChange: (value: string) => void;
  value: string;
}) {
  if (field.fieldType === "SELECT" || field.fieldType === "RADIO") {
    return (
      <SelectField
        label={field.label}
        onChange={onChange}
        options={field.options.map((option) => ({
          label: option.label,
          value: option.optionKey,
        }))}
        required={field.isRequired}
        value={value}
      />
    );
  }

  return (
    <label className="registration-field">
      <span>
        {field.label}
        {field.isRequired ? <b>*</b> : null}
      </span>
      {field.fieldType === "TEXTAREA" ? (
        <textarea
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder ?? undefined}
          required={field.isRequired}
          value={value}
        />
      ) : (
        <input
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder ?? undefined}
          required={field.isRequired}
          value={value}
        />
      )}
      {field.helpText ? <small>{field.helpText}</small> : null}
    </label>
  );
}

function SuccessPanel({
  loginEmail,
  loginPassword,
  page,
  result,
}: {
  loginEmail: string;
  loginPassword: string;
  page: PublicRegistrationPage;
  result: PublicRegistrationSubmitResponse;
}) {
  const loginHref = `/login?email=${encodeURIComponent(loginEmail)}&registered=1`;

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
          onClick={() => {
            if (typeof window === "undefined") return;
            window.sessionStorage.setItem(
              LOGIN_PREFILL_STORAGE_KEY,
              JSON.stringify({
                email: loginEmail,
                password: loginPassword,
                timestamp: Date.now(),
              }),
            );
          }}
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
}

function StatePanel({
  description,
  icon,
  title,
}: {
  description: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <section className="registration-state-panel">
      {icon}
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function validateForm(page: PublicRegistrationPage, form: FormState) {
  if (form.fullName.trim().length < 2) return "Student name is required.";
  if (!form.gender) return "Gender is required.";
  if (!form.email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Enter a valid email address.";
  }
  if (!form.phone.trim()) return "Mobile number is required.";
  if (!/^[+\d()\s-]{7,20}$/.test(form.phone.trim())) {
    return "Enter a valid mobile number.";
  }
  if (!form.dateOfBirth) return "Date of birth is required.";
  if (new Date(form.dateOfBirth).getTime() > Date.now()) {
    return "Date of birth cannot be in the future.";
  }
  if (form.password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (form.password.length > 72) {
    return "Password must be 72 characters or fewer.";
  }
  if (form.password !== form.confirmPassword) {
    return "Password and confirm password must match.";
  }
  if (!form.educationOptionUuid) return "Education is required.";
  if (!form.digitalLibraryLocationUuid) {
    return "Digital Library Location is required.";
  }
  for (const field of page.fields) {
    if (field.isRequired && !form.customAnswers[field.fieldKey]) {
      return `${field.label} is required.`;
    }
  }
  if (!form.selectedSessionCourseUuids.length) {
    return "Select at least one course.";
  }
  return null;
}

function errorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message[0] ?? fallback;
    if (data.message) return data.message;
  }
  return fallback;
}
