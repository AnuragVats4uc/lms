import type { FormEvent } from "react";
import { Button } from "@repo/ui";
import { AppModal } from "@/components/AppModal";
import type { SessionFormState } from "../types";
import { SessionForm } from "./SessionForm";

function SessionModal({ error, form, formId, isOpen, isSubmitting, onChange, onClose, onSubmit, title, submitLabel }: {
  error?: string;
  form: SessionFormState;
  formId: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onChange: <K extends keyof SessionFormState>(key: K, value: SessionFormState[K]) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  title: string;
}) {
  const submit = () => { const element = document.getElementById(formId); if (element instanceof HTMLFormElement) element.requestSubmit(); };
  return <AppModal className="lms-organization-create-modal" description="Save session details and refresh the current organization list." footer={<><Button background="#FFFFFF" borderColor="#D8E1EC" borderWidth={1} disabled={isSubmitting} height={38} onPress={onClose} rounded="$3"><Button.Text fontSize="$caption" fontWeight="$button">Cancel</Button.Text></Button><Button background="#059669" borderColor="#059669" borderWidth={1} disabled={isSubmitting} height={38} onPress={submit} rounded="$3"><Button.Text color="#FFFFFF" fontSize="$caption" fontWeight="$button">{isSubmitting ? "Saving..." : submitLabel}</Button.Text></Button></>} isOpen={isOpen} onClose={onClose} title={title}><SessionForm error={error} form={form} formId={formId} onChange={onChange} onSubmit={onSubmit} /></AppModal>;
}

export function AddSessionModal(props: Omit<Parameters<typeof SessionModal>[0], "formId" | "submitLabel" | "title">) {
  return <SessionModal {...props} formId="session-add-form" submitLabel="Create Session" title="Add Session" />;
}

export function EditSessionModal(props: Omit<Parameters<typeof SessionModal>[0], "formId" | "submitLabel" | "title">) {
  return <SessionModal {...props} formId="session-edit-form" submitLabel="Update Session" title="Edit Session" />;
}
