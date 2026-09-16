import { FormInput, XStack } from "@repo/ui";
import { CrudFormSelect } from "../../../components/crud";

export const FolderStatusFields = () => (
  <XStack className="lms-organization-form-grid" gap="$3">
    <div className="lms-form-field">
      <FormInput label="Sort order" name="sortOrder" type="number" />
    </div>
    <div className="lms-form-field">
      <CrudFormSelect
        label="Status"
        name="status"
        options={[
          { label: "Active", value: "ACTIVE" },
          { label: "Archived", value: "ARCHIVED" },
        ]}
      />
    </div>
  </XStack>
);
