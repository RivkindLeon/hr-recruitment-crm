import { type FormEvent, type Dispatch, type SetStateAction } from 'react';
import type { Candidate, CandidateEditDraft } from '../types';

interface CandidateEditSectionProps {
  selectedCandidate: Candidate;
  selectedVacancyTitle: string;
  isEditingCandidate: boolean;
  setIsEditingCandidate: (editing: boolean) => void;
  candidateEditDraft: CandidateEditDraft;
  setCandidateEditDraft: Dispatch<SetStateAction<CandidateEditDraft>>;
  sourceOptions: string[];
  handleCandidateEdit: (e: FormEvent<HTMLFormElement>) => void;
}

export function CandidateEditSection({
  selectedCandidate,
  selectedVacancyTitle,
  isEditingCandidate,
  setIsEditingCandidate,
  candidateEditDraft,
  setCandidateEditDraft,
  sourceOptions,
  handleCandidateEdit,
}: CandidateEditSectionProps) {
  return (
    <div className="candidate-summary-card">
      <div className="candidate-summary-header">
        <div>
          <span className="detail-label">Candidate details</span>
          <strong>Update sourcing, score, location, and scheduling notes</strong>
        </div>
        <button
          type="button"
          className="stage-action-button"
          onClick={() => {
            if (isEditingCandidate) {
              setCandidateEditDraft({
                source: selectedCandidate.source,
                location: selectedCandidate.location,
                score: String(selectedCandidate.score),
                nextInterview: selectedCandidate.nextInterview ?? '',
                summary: selectedCandidate.summary,
              });
            }
            setIsEditingCandidate(!isEditingCandidate);
          }}
          aria-label={isEditingCandidate ? 'Cancel candidate edit' : 'Edit candidate'}
        >
          {isEditingCandidate ? 'Cancel edit' : 'Edit candidate'}
        </button>
      </div>

      {isEditingCandidate ? (
        <form className="candidate-edit-form" onSubmit={handleCandidateEdit}>
          <div className="form-field-row">
            <label className="form-field">
              <span>Source</span>
              <select
                value={candidateEditDraft.source}
                onChange={(e) =>
                  setCandidateEditDraft((d) => ({
                    ...d,
                    source: e.target.value,
                  }))
                }
              >
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Score</span>
              <input
                type="number"
                min="0"
                max="100"
                value={candidateEditDraft.score}
                onChange={(e) =>
                  setCandidateEditDraft((d) => ({
                    ...d,
                    score: e.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          <label className="form-field">
            <span>Location</span>
            <input
              value={candidateEditDraft.location}
              onChange={(e) =>
                setCandidateEditDraft((d) => ({
                  ...d,
                  location: e.target.value,
                }))
              }
              required
            />
          </label>

          <label className="form-field">
            <span>Next interview / note</span>
            <input
              value={candidateEditDraft.nextInterview}
              onChange={(e) =>
                setCandidateEditDraft((d) => ({
                  ...d,
                  nextInterview: e.target.value,
                }))
              }
              placeholder="Optional scheduling note"
            />
          </label>

          <label className="form-field">
            <span>Summary</span>
            <textarea
              value={candidateEditDraft.summary}
              onChange={(e) =>
                setCandidateEditDraft((d) => ({
                  ...d,
                  summary: e.target.value,
                }))
              }
              rows={4}
              required
            />
          </label>

          <button type="submit" className="stage-action-button primary">
            Save candidate updates
          </button>
        </form>
      ) : (
        <>
          <p className="candidate-summary">{selectedCandidate.summary}</p>
          <p className="candidate-next-step">
            Next interview / note: {selectedCandidate.nextInterview ?? 'Not scheduled'}
          </p>
        </>
      )}
    </div>
  );
}
