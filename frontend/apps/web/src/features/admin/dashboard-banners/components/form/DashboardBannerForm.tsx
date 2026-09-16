import type { Dispatch, FormEvent, SetStateAction } from "react";

import type {
  DashboardBannerFormState,
  DashboardBannerMediaType,
} from "../../types";
import styles from "../../DashboardBannersPage.module.css";
import { BannerFileUpload } from "./BannerFileUpload";
import { BannerFormField } from "./BannerFormField";

interface DashboardBannerFormProps {
  form: DashboardBannerFormState;
  imageFile: File | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  posterFile: File | null;
  sessions: { id: number; name: string }[];
  setForm: Dispatch<SetStateAction<DashboardBannerFormState>>;
  setImageFile: (file: File | null) => void;
  setPosterFile: (file: File | null) => void;
}

export const DashboardBannerForm = ({
  form,
  imageFile,
  onSubmit,
  posterFile,
  sessions,
  setForm,
  setImageFile,
  setPosterFile,
}: DashboardBannerFormProps) => {
  const updateForm = (values: Partial<DashboardBannerFormState>) =>
    setForm((current) => ({ ...current, ...values }));

  const toggleSession = (sessionId: number, checked: boolean) =>
    updateForm({
      sessionIds: checked
        ? [...form.sessionIds, sessionId]
        : form.sessionIds.filter((id) => id !== sessionId),
    });

  return (
    <form id="dashboard-banner-form" onSubmit={onSubmit}>
      <div className={styles.formGrid}>
        <BannerFormField
          label={form.mediaType === "VIDEO" ? "Heading (optional)" : "Heading"}
        >
          <input
            maxLength={120}
            required={form.mediaType === "IMAGE"}
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
          />
        </BannerFormField>
        <BannerFormField label="Media type">
          <select
            value={form.mediaType}
            onChange={(event) =>
              updateForm({
                mediaType: event.target.value as DashboardBannerMediaType,
                mediaUrl: "",
                posterUrl: "",
                autoplay: false,
              })
            }
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
          </select>
        </BannerFormField>
        <BannerFormField full label="Description (optional)">
          <textarea
            maxLength={500}
            rows={2}
            value={form.description ?? ""}
            onChange={(event) =>
              updateForm({ description: event.target.value })
            }
          />
        </BannerFormField>
        <BannerFormField label="CTA label (optional)">
          <input
            maxLength={80}
            value={form.ctaLabel ?? ""}
            onChange={(event) => updateForm({ ctaLabel: event.target.value })}
          />
        </BannerFormField>
        <BannerFormField label="Destination URL (optional)">
          <input
            placeholder="/student/my-courses or https://…"
            value={form.destinationUrl ?? ""}
            onChange={(event) =>
              updateForm({ destinationUrl: event.target.value })
            }
          />
        </BannerFormField>
        <BannerFormField
          full
          label={form.mediaType === "IMAGE" ? "Image URL" : "Video URL"}
        >
          <input
            placeholder={
              form.mediaType === "IMAGE"
                ? "https://… or choose an image below"
                : "YouTube, Vimeo, MP4, WebM, HLS or another HTTPS URL"
            }
            required={!imageFile}
            value={form.mediaUrl}
            onChange={(event) => updateForm({ mediaUrl: event.target.value })}
          />
        </BannerFormField>
        {form.mediaType === "IMAGE" ? (
          <BannerFileUpload
            file={imageFile}
            label="Banner image"
            setFile={setImageFile}
          />
        ) : (
          <>
            <BannerFormField full label="Poster URL (optional)">
              <input
                value={form.posterUrl ?? ""}
                onChange={(event) =>
                  updateForm({ posterUrl: event.target.value })
                }
              />
            </BannerFormField>
            <BannerFileUpload
              file={posterFile}
              label="Video poster"
              setFile={setPosterFile}
            />
            <label className={styles.check}>
              <input
                checked={Boolean(form.autoplay)}
                type="checkbox"
                onChange={(event) =>
                  updateForm({ autoplay: event.target.checked })
                }
              />
              Autoplay video (muted)
            </label>
          </>
        )}
        <BannerFormField full label="Media alternative text">
          <input
            maxLength={200}
            value={form.mediaAlt ?? ""}
            onChange={(event) => updateForm({ mediaAlt: event.target.value })}
          />
        </BannerFormField>
        <div className={styles.full}>
          <strong>Sessions</strong>
          <div className={styles.sessions}>
            {sessions.map((session) => (
              <label key={session.id}>
                <input
                  checked={form.sessionIds.includes(session.id)}
                  type="checkbox"
                  onChange={(event) =>
                    toggleSession(session.id, event.target.checked)
                  }
                />
                {session.name}
              </label>
            ))}
          </div>
        </div>
        <BannerFormField label="Show from">
          <input
            type="datetime-local"
            value={form.startsAt ?? ""}
            onChange={(event) =>
              updateForm({ startsAt: event.target.value || null })
            }
          />
        </BannerFormField>
        <BannerFormField label="Show until">
          <input
            type="datetime-local"
            value={form.endsAt ?? ""}
            onChange={(event) =>
              updateForm({ endsAt: event.target.value || null })
            }
          />
        </BannerFormField>
        <label className={styles.check}>
          <input
            checked={Boolean(form.isActive)}
            type="checkbox"
            onChange={(event) => updateForm({ isActive: event.target.checked })}
          />
          Visible to students
        </label>
        <label className={styles.check}>
          <input
            checked={Boolean(form.openInNewTab)}
            type="checkbox"
            onChange={(event) =>
              updateForm({ openInNewTab: event.target.checked })
            }
          />
          Open CTA in new tab
        </label>
      </div>
    </form>
  );
};
