import { type FormEvent } from 'react';
import type { TimelineEntry, TimelineEntryType, TimelineFormDraft } from '../types';
import { timelineEntryTypes } from '../constants';
import { TimelineFormFields } from './TimelineFormFields';

interface TimelineSectionProps {
  selectedTimeline: TimelineEntry[];
  timelineFilter: 'all' | TimelineEntryType;
  setTimelineFilter: (f: 'all' | TimelineEntryType) => void;
  editingTimelineId: string | null;
  setEditingTimelineId: (id: string | null) => void;
  timelineDraft: TimelineFormDraft;
  setTimelineDraft: React.Dispatch<React.SetStateAction<TimelineFormDraft>>;
  timelineEditDraft: TimelineFormDraft;
  setTimelineEditDraft: React.Dispatch<React.SetStateAction<TimelineFormDraft>>;
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
          <TimelineFormFields draft={timelineDraft} setDraft={setTimelineDraft} />
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
                  <TimelineFormFields draft={timelineEditDraft} setDraft={setTimelineEditDraft} />
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
