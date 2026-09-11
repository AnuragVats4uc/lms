import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { PublicRegistrationPage } from "@repo/types";

import { GENDER_OPTIONS } from "../constants";
import type { RegistrationFormState } from "../types";
import { CourseInterestSelector } from "./CourseInterestSelector";
import { CustomField } from "./fields/CustomField";
import { InputField } from "./fields/InputField";
import { PasswordField } from "./fields/PasswordField";
import { SelectField } from "./fields/SelectField";

type RegistrationFormProps = {
  clientError: string | null;
  form: RegistrationFormState;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  page: PublicRegistrationPage;
  setForm: Dispatch<SetStateAction<RegistrationFormState>>;
};

export const RegistrationForm = ({
  clientError,
  form,
  isSubmitting,
  onSubmit,
  page,
  setForm,
}: RegistrationFormProps) => (
  <section className="registration-form-panel">
    <form onSubmit={onSubmit}>
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
          options={GENDER_OPTIONS}
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
            setForm((current) => ({ ...current, confirmPassword: value }))
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

      <CourseInterestSelector
        courses={page.courses}
        onChange={(selectedSessionCourseUuids) =>
          setForm((current) => ({
            ...current,
            selectedSessionCourseUuids,
          }))
        }
        selectedCourseUuids={form.selectedSessionCourseUuids}
      />

      {clientError ? (
        <div className="registration-error">{clientError}</div>
      ) : null}

      <button
        className="registration-submit-button"
        disabled={isSubmitting || page.courses.length === 0}
        type="submit"
      >
        {isSubmitting ? "Submitting..." : page.registration.submitButtonText}
      </button>
    </form>
  </section>
);
