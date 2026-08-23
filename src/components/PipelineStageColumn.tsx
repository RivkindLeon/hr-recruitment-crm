import type {
  Candidate,
  CandidateStage,
  CandidateEditDraft,
  TimelineFormDraft,
} from '../types';

interface PipelineStageColumnProps {
  stage: CandidateStage;
  stageCandidates: Candidate[];
  selectedCandidateId: string;
  onSelectCandidate: (candidate: Candidate) => void;
}

export function PipelineStageColumn({
  stage,
  stageCandidates,
  selectedCandidateId,
  onSelectCandidate,
}: PipelineStageColumnProps) {
  return (
    <div className="stage-column">
      <div className="stage-header">
        <h3>{stage}</h3>
        <span>{stageCandidates.length}</span>
      </div>

      <div className="candidate-list">
        {stageCandidates.length === 0 ? (
          <p className="empty-state">No candidates in this stage yet.</p>
        ) : (
          stageCandidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={`candidate-card ${selectedCandidateId === candidate.id ? 'selected' : ''}`}
              onClick={() => onSelectCandidate(candidate)}
            >
              <div className="candidate-card-top">
                <strong>{candidate.name}</strong>
                <span className="score-pill">{candidate.score}</span>
              </div>
              <span>{candidate.source}</span>
              <span>Last activity: {candidate.lastActivityDate}</span>
              <span>Next: {candidate.nextInterview ?? 'Not scheduled'}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
