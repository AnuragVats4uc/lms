import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormInput, FormTextArea, Text } from "@repo/ui";
import { sessionSchema } from "@repo/validation";
import {
  CrudFormDateTimePicker,
  CrudFormSelect,
  fromLocalDateTimeValue,
} from "../../components/crud";
import type { SessionFormState } from "../types";

export function SessionForm({
  error,
  form,
  formId,
  onSubmit,
}: {
  error?: string;
  form: SessionFormState;
  formId: string;
  onSubmit: (values: SessionFormState) => void | Promise<void>;
}) {
  const methods = useForm<SessionFormState>({
    defaultValues: form,
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(sessionSchema),
  });

  useEffect(() => {
    methods.reset(form);
  }, [form, methods]);

  const startDate = useWatch({
    control: methods.control,
    name: "startDate",
  });

  return (
    <FormProvider {...methods}>
      <form
        className="lms-organization-form"
        id={formId}
        onSubmit={methods.handleSubmit((values) => onSubmit(values))}
      >
        <div className="lms-organization-form-grid">
          <div className="lms-form-field">
            <FormInput
              autoFocus
              label="Name"
              name="name"
              placeholder="2025-2026"
            />
          </div>
          <div className="lms-form-field">
            <FormInput
              label="Code"
              name="code"
              placeholder="AY2526"
              transform={(value) => value.toUpperCase()}
            />
          </div>
          <div className="lms-form-field">
            <CrudFormDateTimePicker
              label="Start date"
              name="startDate"
              placeholder="Choose start date and time"
              required
            />
          </div>
          <div className="lms-form-field">
            <CrudFormDateTimePicker
              label="End date"
              minDate={fromLocalDateTimeValue(startDate)}
              name="endDate"
              placeholder="Choose end date and time"
              required
            />
          </div>
          <div className="lms-form-field">
            <CrudFormSelect
              label="Status"
              name="status"
              options={[
                { label: "Upcoming", value: "UPCOMING" },
                { label: "Active", value: "ACTIVE" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Archived", value: "ARCHIVED" },
              ]}
            />
          </div>
          <div className="lms-form-field lms-form-field-wide">
            <FormTextArea
              label="Description"
              name="description"
              placeholder="Academic year session description."
              rows={4}
            />
          </div>
        </div>
        {error ? (
          <Text color="#DC2626" fontSize="$caption" lineHeight="$caption">
            {error}
          </Text>
        ) : null}
      </form>
    </FormProvider>
  );
}
