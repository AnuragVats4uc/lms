import { FormInput, FormTextArea, XStack, YStack } from "@repo/ui";

export const FolderAppearanceFields = () => (
  <YStack gap="$3">
    <XStack className="lms-organization-form-grid" gap="$3">
      <div className="lms-form-field">
        <FormInput label="Icon" name="icon" placeholder="book-open" />
      </div>
      <div className="lms-form-field">
        <FormInput label="Color" name="color" placeholder="#2563EB" />
      </div>
    </XStack>
    <div className="lms-form-field lms-form-field-wide">
      <FormTextArea label="Description" name="description" rows={4} />
    </div>
  </YStack>
);
