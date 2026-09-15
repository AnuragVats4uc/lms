import type { Course } from "@repo/types";
import {
  FormCheckbox,
  FormInput,
  FormTextArea,
  Text,
  XStack,
  YStack,
} from "@repo/ui";
import { CrudFormSelect } from "../../../components/crud";
import type { ResourceFormContext } from "../../../components/crud/CrudManagementPage";
import { sessionCourseFormStatusOptions } from "../../constants";
import type { SessionCourseForm } from "../../types";

export const SessionCourseFormFields = ({
  courses,
  error,
}: ResourceFormContext<SessionCourseForm> & { courses: Course[] }) => (
  <YStack className="lms-organization-form" gap="$3">
    {error ? (
      <Text color="#B42318" fontSize="$caption">
        {error}
      </Text>
    ) : null}
    <div className="lms-form-field">
      <CrudFormSelect
        label="Course"
        name="courseId"
        options={courses.map((course) => ({
          label: `${course.name} (${course.code})`,
          value: String(course.id),
        }))}
        placeholder="Select course"
      />
    </div>
    <XStack className="lms-organization-form-grid" gap="$3">
      <div className="lms-form-field">
        <FormInput
          label="Display name"
          name="displayName"
          placeholder="JEE Foundation - Morning"
        />
      </div>
      <div className="lms-form-field">
        <FormInput label="Sort order" name="sortOrder" type="number" />
      </div>
    </XStack>
    <XStack className="lms-organization-form-grid" gap="$3">
      <div className="lms-form-field">
        <CrudFormSelect
          label="Status"
          name="status"
          options={sessionCourseFormStatusOptions}
        />
      </div>
      <FormCheckbox checkboxLabel="Published in session" name="isPublished" />
    </XStack>
    <div className="lms-form-field lms-form-field-wide">
      <FormTextArea label="Description" name="description" rows={4} />
    </div>
  </YStack>
);
