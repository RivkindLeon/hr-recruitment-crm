import type { Candidate, CandidateStage, Vacancy } from '../types';
import { stageOrder } from '../constants';

interface PipelinePanelProps {
  selectedVacancy: Vacancy | undefined;
  vacancyCandidates: Candidate[];
  stageBuckets: Map<CandidateStage, Candidate[]>;
  selectedCandidateId: string;
  setSelectedCandidateId: (id: string) => void;
  setSelectedStageDraft: (stage: CandidateStage) => void;
  setIsEditingCandidate: (editing: boolean) => void;
  setCandidateEditDraft: (draft: {
    source: string;
    location: string;
    score: string;
    nextInterview: string;
    summary: string;
  }) => void;
  setTimelineDraft: (draft: {
    type: 'feedback' | 'interview' | 'communication';
    title: string;
    detail: string;
    date: string;
  }) => void;
}

export function PipelinePanel({
  selectedVacancy,
  vacancyCandidates,
  stageBuckets,
  selectedCandidateId,
  setSelectedCandidateId,
  setSelectedStageDraft,
  setIsEditingCandidate,
  setCandidateEditDraft,
  setTimelineDraft,
}: PipelinePanelProps) {
  return (
    <section className="panel pipeline-panel">
      <div className="panel-header">
        <h2>{selectedVacancy?.title ?? 'No vacancy in this view'}</h2>
        <p>
          {selectedVacancy
            ? `${selectedVacancy.team} pipeline grouped by stage.`
            : 'Adjust the vacancy status view to inspect a hiring pipeline.'}
        </p>
      </div>

      {selectedVacancy ? (
        <>
          <div className="vacancy-summary-banner">
            <div>
              <span className="detail-label">Selected vacancy</span>
              <strong>
                {selectedVacancy.owner} · {selectedVacancy.status}
              </strong>
            </div>
            <span>{vacancyCandidates.length} active candidate records</span>
          </div>

          <div className="pipeline-columns">
            {stageOrder.map((stage) => {
              const stageCandidates = stageBuckets.get(stage) ?? [];
              return (
                <div key={stage} className="stage-column">
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
                          onClick={() => {
                            setSelectedCandidateId(candidate.id);
                            setSelectedStageDraft(candidate.currentStage);
                            setIsEditingCandidate(false);
                            setCandidateEditDraft({
                              source: candidate.source,
                              location: candidate.location,
                              score: String(candidate.score),
                              nextInterview: candidate.nextInterview ?? '',
                              summary: candidate.summary,
                            });
                            setTimelineDraft({
                              type: 'feedback',
                              title: '',
                              detail: '',
                              date: candidate.lastActivityDate,
                            });
                          }}
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
            })}
          </div>
        </>
      ) : (
        <div className="empty-state">
          No vacancy is currently selected because this quick view has no matching openings.
        </div>
      )}
    </section>
  );
}
