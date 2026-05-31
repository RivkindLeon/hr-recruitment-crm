import type { Candidate, CandidateStage, Vacancy } from '../types';
import { stageOrder } from '../constants';

interface StageControlsProps {
  selectedCandidate: Candidate;
  selectedCandidateStageIndex: number;
  effectiveSelectedStageDraft: CandidateStage;
  selectedStageDraft: CandidateStage;
  setSelectedStageDraft: (stage: CandidateStage) => void;
  moveSelectedCandidateBy: (direction: -1 | 1) => void;
  moveCandidateToStage: (id: string, stage: CandidateStage) => void;
}

export function StageControls({
  selectedCandidate,
  selectedCandidateStageIndex,
  effectiveSelectedStageDraft,
  selectedStageDraft,
  setSelectedStageDraft,
  moveSelectedCandidateBy,
  moveCandidateToStage,
}: StageControlsProps) {
  return (
    <div className="stage-movement-card">
      <div>
        <span className="detail-label">Stage controls</span>
        <strong>Move candidate through the pipeline</strong>
      </div>
      <div className="stage-movement-actions">
        <button
          type="button"
          className="stage-action-button"
          onClick={() => moveSelectedCandidateBy(-1)}
          disabled={selectedCandidateStageIndex <= 0}
        >
          Previous stage
        </button>
        <button
          type="button"
          className="stage-action-button primary"
          onClick={() => moveSelectedCandidateBy(1)}
          disabled={
            selectedCandidateStageIndex === -1 ||
            selectedCandidateStageIndex >= stageOrder.length - 1
          }
        >
          Next stage
        </button>
      </div>
      <div className="stage-picker-row">
        <label className="stage-picker-field">
          <span className="detail-label">Set stage directly</span>
          <select
            value={effectiveSelectedStageDraft}
            onChange={(e) => setSelectedStageDraft(e.target.value as CandidateStage)}
          >
            {stageOrder.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="stage-action-button"
          onClick={() => moveCandidateToStage(selectedCandidate.id, effectiveSelectedStageDraft)}
          disabled={effectiveSelectedStageDraft === selectedCandidate.currentStage}
        >
          Apply stage
        </button>
      </div>
    </div>
  );
}
