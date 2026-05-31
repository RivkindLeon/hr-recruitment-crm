import { type FormEvent } from 'react';
import type { TimelineEntry, TimelineEntryType } from '../types';
import { timelineEntryTypes } from '../constants';

interface TimelineSectionProps {
  selectedTimeline: TimelineEntry[];
  timelineFilter: 'all' | TimelineEntryType;
  setTimelineFilter: (f: 'all' | TimelineEntryType) => void;
  editingTimelineId: string | null;
  setEditingTimelineId: (id: string | null) => void;
  timelineDraft: {
    type: TimelineEntryType;
    title: string;
    detail: string;
    date: string;
  };
  setTimelineDraft: React.Dispatch<
    React.SetStateAction<{
      type: TimelineEntryType;
      title: string;
      detail: string;
      date: string;
    }>
  >;
  timelineEditDraft: {
    type: TimelineEntryType;
    title: string;
    detail: string;
    date: string;
  };
  setTimelineEditDraft: React.Dispatch<
    React.SetStateAction<{
      type: TimelineEntryType;
      title: string;
      detail: string;
      date: string;
    }>
  >;
  handleTimelineCreate: (e: FormEvent<HTMLFormElement>) => void;
  handleTimelineEdit: (e: FormEvent<HTMLFormElement>) => void;
}

export function TimelineSection({
  selectedTimeline,
  timelineFilter,
  setTimelineFilter,
  editingTimelineId,
  setEditingTimelineId,
  timelineDraft,
  setTimelineDraft,
  timelineEditDraft,
  setTimelineEditDraft,
  handleTimelineCreate,
  handleTimelineEdit,
}: TimelineSectionProps) {
  return (
    <div className="timeline-section">
      <div className="timeline-section-header">
        <h3>Activity timeline</h3>
        <p>Keep the loop current with updates.</p>
      </div>

      <div className="timeline-controls">
        <div className="timeline-filters">
          <button
            type="button"
            className={`filter-chip ${timelineFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimelineFilter('all')}
          >
            All
          </button>
          {timelineEntryTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`filter-chip ${timelineFilter === type ? 'active' : ''}`}
              onClick={() => setTimelineFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {!editingTimelineId && (
        <form className="timeline-create-card" onSubmit={handleTimelineCreate}>
          <div className="form-field-row">
            <label className="form-field">
              <span>Type</span>
              <select
                value={timelineDraft.type}
                onChange={(e) =>
                  setTimelineDraft((d) => ({
                    ...d,
                    type: e.target.value as TimelineEntryType,
                  }))
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
                value={timelineDraft.date}
                onChange={(e) => setTimelineDraft((d) => ({ ...d, date: e.target.value }))}
                required
              />
            </label>
          </div>

          <label className="form-field">
            <span>Title</span>
            <input
              value={timelineDraft.title}
              onChange={(e) => setTimelineDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Manager debrief added"
              required
            />
          </label>

          <label className="form-field">
            <span>Detail</span>
            <textarea
              value={timelineDraft.detail}
              onChange={(e) => setTimelineDraft((d) => ({ ...d, detail: e.target.value }))}
              rows={3}
              placeholder="Capture the key takeaway"
              required
            />
          </label>

          <button type="submit" className="stage-action-button primary">
            Add timeline note
          </button>
        </form>
      )}

      <div className="timeline-list">
        {selectedTimeline.length === 0 ? (
          <p className="empty-state">No timeline entries match the filter.</p>
        ) : (
          selectedTimeline.map((entry) => (
            <article key={entry.id} className="timeline-item">
              {editingTimelineId === entry.id ? (
                <form className="timeline-edit-form" onSubmit={handleTimelineEdit}>
                  <div className="form-field-row">
                    <label className="form-field">
                      <span>Type</span>
                      <select
                        value={timelineEditDraft.type}
                        onChange={(e) =>
                          setTimelineEditDraft((d) => ({
                            ...d,
                            type: e.target.value as TimelineEntryType,
                          }))
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
                        value={timelineEditDraft.date}
                        onChange={(e) =>
                          setTimelineEditDraft((d) => ({
                            ...d,
                            date: e.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                  </div>

                  <label className="form-field">
                    <span>Title</span>
                    <input
                      value={timelineEditDraft.title}
                      onChange={(e) =>
                        setTimelineEditDraft((d) => ({
                          ...d,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label className="form-field">
                    <span>Detail</span>
                    <textarea
                      value={timelineEditDraft.detail}
                      onChange={(e) =>
                        setTimelineEditDraft((d) => ({
                          ...d,
                          detail: e.target.value,
                        }))
                      }
                      rows={3}
                      required
                    />
                  </label>

                  <div className="form-field-row">
                    <button type="submit" className="stage-action-button primary">
                      Save
                    </button>
                    <button
                      type="button"
                      className="stage-action-button"
                      onClick={() => setEditingTimelineId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="timeline-item-top">
                    <span className={`timeline-type timeline-${entry.type}`}>{entry.type}</span>
                    <div className="timeline-meta">
                      <span>{entry.date}</span>
                      <button
                        type="button"
                        className="text-action"
                        onClick={() => {
                          setEditingTimelineId(entry.id);
                          setTimelineEditDraft({
                            type: entry.type,
                            title: entry.title,
                            detail: entry.detail,
                            date: entry.date,
                          });
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <strong>{entry.title}</strong>
                  <p>{entry.detail}</p>
                </>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
