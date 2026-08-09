import type { CandidateFormDraft } from '../types';
import { stageOrder } from '../constants';

interface CandidateCreateFormProps {
  candidateDraft: CandidateFormDraft;
  setCandidateDraft: React.Dispatch<React.SetStateAction<CandidateFormDraft>>;
  sourceOptions: string[];
  handleCandidateCreate: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function CandidateCreateForm({
  candidateDraft,
  setCandidateDraft,
  sourceOptions,
  handleCandidateCreate,
}: CandidateCreateFormProps) {
  return (
    <form className="candidate-create-card" onSubmit={handleCandidateCreate}>
      <div>
        <span className="detail-label">Add candidate</span>
        <strong>Create a candidate in the selected vacancy</strong>
      </div>

      <label className="form-field">
        <span>Name</span>
        <input
          value={candidateDraft.name}
          onChange={(e) => setCandidateDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Candidate name"
          required
        />
      </label>

      <div className="form-field-row">
        <label className="form-field">
          <span>Source</span>
          <select
            value={candidateDraft.source}
            onChange={(e) => setCandidateDraft((d) => ({ ...d, source: e.target.value }))}
          >
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Stage</span>
          <select
            value={candidateDraft.stage}
            onChange={(e) =>
              setCandidateDraft((d) => ({
                ...d,
                stage: e.target.value as CandidateStage,
              }))
            }
          >
            {stageOrder.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-field-row">
        <label className="form-field">
          <span>Location</span>
          <input
            value={candidateDraft.location}
            onChange={(e) => setCandidateDraft((d) => ({ ...d, location: e.target.value }))}
            placeholder="Tel Aviv"
            required
          />
        </label>

        <label className="form-field">
          <span>Score</span>
          <input
            type="number"
            min="0"
            max="100"
            value={candidateDraft.score}
            onChange={(e) => setCandidateDraft((d) => ({ ...d, score: e.target.value }))}
            required
          />
        </label>
      </div>

      <label className="form-field">
        <span>Next interview / note</span>
        <input
          value={candidateDraft.nextInterview}
          onChange={(e) => setCandidateDraft((d) => ({ ...d, nextInterview: e.target.value }))}
          placeholder="Optional scheduling note"
        />
      </label>

      <label className="form-field">
        <span>Summary</span>
        <textarea
          value={candidateDraft.summary}
          onChange={(e) => setCandidateDraft((d) => ({ ...d, summary: e.target.value }))}
          rows={4}
          placeholder="Why this candidate belongs in the pipeline"
          required
        />
      </label>

      <button type="submit" className="stage-action-button primary">
        Create candidate
      </button>
    </form>
  );
}
