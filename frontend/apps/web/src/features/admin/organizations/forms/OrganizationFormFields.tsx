import type { AddOrganizationFormState } from "../types";

export type OrganizationFormChangeHandler = <
  K extends keyof AddOrganizationFormState,
>(
  key: K,
  value: AddOrganizationFormState[K],
) => void;

export const OrganizationFormFields = ({
  form,
  onChange,
}: {
  form: AddOrganizationFormState;
  onChange: OrganizationFormChangeHandler;
}) => {
  return (
    <div className="lms-organization-form-grid">
      <label className="lms-form-field">
        <span>Name</span>
        <input
          autoFocus
          minLength={3}
          onChange={(event) => onChange("name", event.currentTarget.value)}
          placeholder="Acme Learning Institute"
          required
          value={form.name}
        />
      </label>

      <label className="lms-form-field">
        <span>Code</span>
        <input
          maxLength={20}
          onChange={(event) =>
            onChange("code", event.currentTarget.value.toUpperCase())
          }
          pattern="[A-Z0-9_-]+"
          placeholder="ACME"
          required
          value={form.code}
        />
      </label>

      <label className="lms-form-field">
        <span>Email</span>
        <input
          onChange={(event) => onChange("email", event.currentTarget.value)}
          placeholder="admin@acme-learning.example.com"
          type="email"
          value={form.email}
        />
      </label>

      <label className="lms-form-field">
        <span>Phone</span>
        <input
          onChange={(event) => onChange("phone", event.currentTarget.value)}
          placeholder="+919999999999"
          value={form.phone}
        />
      </label>

      <label className="lms-form-field">
        <span>Website</span>
        <input
          onChange={(event) => onChange("website", event.currentTarget.value)}
          placeholder="https://acme-learning.example.com"
          type="url"
          value={form.website}
        />
      </label>

      <label className="lms-form-field">
        <span>Status</span>
        <select
          onChange={(event) =>
            onChange(
              "status",
              event.currentTarget.value === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            )
          }
          value={form.status}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </label>

      <label className="lms-form-field">
        <span>Description</span>
        <textarea
          onChange={(event) =>
            onChange("description", event.currentTarget.value)
          }
          placeholder="Online learning programs."
          rows={3}
          value={form.description}
        />
      </label>

      <label className="lms-form-field">
        <span>Address</span>
        <textarea
          onChange={(event) => onChange("address", event.currentTarget.value)}
          placeholder="Sector 12, New Delhi"
          rows={2}
          value={form.address}
        />
      </label>
    </div>
  );
};
