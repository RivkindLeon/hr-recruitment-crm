import type { TimelineFormDraft } from '../types';

interface TimelineFormFieldsProps {
  draft: TimelineFormDraft;
  setDraft: React.Dispatch<React.SetStateAction<TimelineFormDraft>>;
}

/** Shared field set used by both the create and edit timeline forms. */
export function TimelineFormFields({ draft, setDraft }: TimelineFormFieldsProps) {
  return (
    <>
      <div className="form-field-row">
        <label className="form-field">
          <span>Type</span>
          <select
            value={draft.type}
            onChange={(e) =>
              setDraft((d) => ({ ...d, type: e.target.value as TimelineFormDraft['type'] }))
            }
          >
            <option value="feedback">Feedback</option>
            <option value="interview">Interview</option>
            <option value="communication">Communication</option>
          </select>
        </label>

        <label className="form-field">
          <span>Date</span>
          <input
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            required
          />
        </label>
      </div>

      <label className="form-field">
        <span>Title</span>
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Manager debrief added"
          required
        />
      </label>

      <label className="form-field">
        <span>Detail</span>
        <textarea
          value={draft.detail}
          onChange={(e) => setDraft((d) => ({ ...d, detail: e.target.value }))}
          rows={3}
          placeholder="Capture the key takeaway"
          required
        />
      </label>
    </>
  );
}
