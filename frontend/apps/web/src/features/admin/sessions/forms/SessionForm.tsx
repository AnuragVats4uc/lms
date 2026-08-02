import type { FormEvent } from "react";
import { Text } from "@repo/ui";
import type { SessionFormState } from "../types";

export function SessionForm({ error, form, formId, onChange, onSubmit }: {
  error?: string;
  form: SessionFormState;
  formId: string;
  onChange: <K extends keyof SessionFormState>(key: K, value: SessionFormState[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <form className="lms-organization-form" id={formId} onSubmit={onSubmit}>
    <div className="lms-organization-form-grid">
      <label className="lms-form-field"><span>Name</span><input autoFocus minLength={3} onChange={(event) => onChange("name", event.currentTarget.value)} placeholder="2025-2026" required value={form.name} /></label>
      <label className="lms-form-field"><span>Code</span><input maxLength={20} onChange={(event) => onChange("code", event.currentTarget.value.toUpperCase())} placeholder="AY2526" value={form.code} /></label>
      <label className="lms-form-field"><span>Start date</span><input onChange={(event) => onChange("startDate", event.currentTarget.value)} required type="datetime-local" value={form.startDate} /></label>
      <label className="lms-form-field"><span>End date</span><input onChange={(event) => onChange("endDate", event.currentTarget.value)} required type="datetime-local" value={form.endDate} /></label>
      <label className="lms-form-field"><span>Status</span><select onChange={(event) => onChange("status", event.currentTarget.value as SessionFormState["status"])} value={form.status}><option value="UPCOMING">Upcoming</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></label>
      <label className="lms-form-field lms-form-field-wide"><span>Description</span><textarea onChange={(event) => onChange("description", event.currentTarget.value)} placeholder="Academic year session description." rows={4} value={form.description} /></label>
    </div>
    {error ? <Text color="#DC2626" fontSize="$caption" lineHeight="$caption">{error}</Text> : null}
  </form>;
}
