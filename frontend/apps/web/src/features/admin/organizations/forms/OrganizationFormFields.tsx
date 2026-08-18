import { AppInput, FormInput, FormTextArea } from "@repo/ui";
import type { OrganizationFormValues } from "@repo/validation";
import { CrudFormSelect } from "../../components/crud";

const ORGANIZATION_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
] as const;

const inputStyleProps = {
  background: "#FCFCFD",
  borderColor: "#D8E1EC",
  fontSize: "$caption",
  fontWeight: "$body",
  rounded: "$3",
} as const;

export const OrganizationFormFields = () => {
  return (
    <div className="lms-organization-form-grid">
      <div className="lms-form-field">
        <FormInput<OrganizationFormValues, "name">
          autoFocus
          label="Name"
          maxLength={120}
          name="name"
          placeholder="Acme Learning Institute"
          {...inputStyleProps}
        />
      </div>

      <div className="lms-form-field">
        <FormInput<OrganizationFormValues, "code">
          label="Code"
          maxLength={20}
          name="code"
          pattern="[A-Z0-9_-]+"
          placeholder="ACME"
          {...inputStyleProps}
        >
          {({ field, fieldState, errorId, inputId }) => (
            <AppInput
              {...inputStyleProps}
              ref={field.ref}
              id={inputId}
              aria-describedby={fieldState.error ? errorId : undefined}
              aria-invalid={fieldState.invalid}
              maxLength={20}
              name={inputId}
              placeholder="ACME"
              value={field.value == null ? "" : String(field.value)}
              onBlur={field.onBlur}
              onChangeText={(value) => field.onChange(value.toUpperCase())}
            />
          )}
        </FormInput>
      </div>

      <div className="lms-form-field">
        <FormInput<OrganizationFormValues, "email">
          autoCapitalize="none"
          autoComplete="email"
          label="Email"
          name="email"
          placeholder="admin@acme-learning.example.com"
          type="email"
          {...inputStyleProps}
        />
      </div>

      <div className="lms-form-field">
        <FormInput<OrganizationFormValues, "phone">
          label="Phone"
          name="phone"
          placeholder="+919999999999"
          {...inputStyleProps}
        />
      </div>

      <div className="lms-form-field">
        <FormInput<OrganizationFormValues, "website">
          autoCapitalize="none"
          autoComplete="url"
          label="Website"
          name="website"
          placeholder="https://acme-learning.example.com"
          type="url"
          {...inputStyleProps}
        />
      </div>

      <div className="lms-form-field">
        <CrudFormSelect<OrganizationFormValues, "status">
          label="Status"
          name="status"
          options={ORGANIZATION_STATUS_OPTIONS}
          placeholder="Select status"
        />
      </div>

      <div className="lms-form-field lms-form-field-wide">
        <FormTextArea<OrganizationFormValues, "description">
          label="Description"
          name="description"
          placeholder="Online learning programs."
          rows={3}
          {...inputStyleProps}
        />
      </div>

      <div className="lms-form-field lms-form-field-wide">
        <FormTextArea<OrganizationFormValues, "address">
          label="Address"
          name="address"
          placeholder="Sector 12, New Delhi"
          rows={2}
          {...inputStyleProps}
        />
      </div>
    </div>
  );
};
