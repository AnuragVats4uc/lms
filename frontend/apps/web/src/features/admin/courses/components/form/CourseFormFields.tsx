import { FormInput, FormTextArea, Text, XStack, YStack } from "@repo/ui";
import { CrudFormSelect } from "../../../components/crud";
import type { ResourceFormContext } from "../../../components/crud/CrudManagementPage";
import { courseFormStatusOptions } from "../../constants";
import type { CourseForm } from "../../types";

export const CourseFormFields = ({
  error,
}: ResourceFormContext<CourseForm>) => (
  <YStack className="lms-organization-form" gap="$3">
    {error ? (
      <Text color="#B42318" fontSize="$caption">
        {error}
      </Text>
    ) : null}
    <XStack className="lms-organization-form-grid" gap="$3">
      <div className="lms-form-field">
        <FormInput
          autoFocus
          label="Name"
          name="name"
          placeholder="JEE Foundation"
        />
      </div>
    </XStack>
    <XStack className="lms-organization-form-grid" gap="$3">
      <div className="lms-form-field">
        <FormInput
          label="Duration (days)"
          name="durationInDays"
          placeholder="365"
          type="number"
        />
      </div>
      <div className="lms-form-field">
        <CrudFormSelect
          label="Status"
          name="status"
          options={courseFormStatusOptions}
        />
      </div>
    </XStack>
    <XStack className="lms-organization-form-grid" gap="$3">
      <div className="lms-form-field">
        <FormInput
          label="Price"
          name="price"
          placeholder="9999.00"
          type="number"
        />
      </div>
      <div className="lms-form-field">
        <FormInput
          label="Discount"
          name="discount"
          placeholder="1000.00"
          type="number"
        />
      </div>
    </XStack>
    <div className="lms-form-field">
      <FormInput
        label="Thumbnail URL"
        name="thumbnail"
        placeholder="https://cdn.example.com/course.png"
        type="url"
      />
    </div>
    <div className="lms-form-field lms-form-field-wide">
      <FormTextArea
        label="Description"
        name="description"
        placeholder="Course description."
        rows={4}
      />
    </div>
  </YStack>
);
