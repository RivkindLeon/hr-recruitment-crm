import { useMemo, useState, type FormEvent } from 'react';
import { candidates as initialCandidates, stageOrder, timelineEntries, vacancies } from './data/mockData';
import type { Candidate, CandidateStage } from './types';

const TODAY = '2026-05-10';
const defaultCandidateForm = {
  name: '',
  source: 'LinkedIn',
  location: '',
  score: '70',
  stage: 'New' as CandidateStage,
  nextInterview: '',
  summary: '',
};

const formatDate = (value: string) => value;

const getCandidatesForVacancy = (allCandidates: Candidate[], vacancyId: string) =>
  allCandidates.filter((candidate) => candidate.vacancyId === vacancyId);

export default function App() {
  const [candidateRecords, setCandidateRecords] = useState(initialCandidates);
  const [selectedVacancyId, setSelectedVacancyId] = useState(vacancies[0]?.id ?? '');
  const [candidateDraft, setCandidateDraft] = useState(defaultCandidateForm);
  const vacancyCandidates = useMemo(
    () => getCandidatesForVacancy(candidateRecords, selectedVacancyId),
    [candidateRecords, selectedVacancyId],
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState(vacancyCandidates[0]?.id ?? '');
  const [selectedStageDraft, setSelectedStageDraft] = useState<CandidateStage>(vacancyCandidates[0]?.currentStage ?? 'New');

  const selectedVacancy = vacancies.find((vacancy) => vacancy.id === selectedVacancyId) ?? vacancies[0];

  const selectedCandidate =
    vacancyCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? vacancyCandidates[0];

  const effectiveSelectedStageDraft = selectedCandidate ? selectedStageDraft : stageOrder[0];
  const sourceOptions = useMemo(
    () => Array.from(new Set(candidateRecords.map((candidate) => candidate.source))).sort(),
    [candidateRecords],
  );

  const stageBuckets = useMemo(() => {
    const buckets = new Map<CandidateStage, Candidate[]>();

    stageOrder.forEach((stage) => buckets.set(stage, []));
    vacancyCandidates.forEach((candidate) => {
      buckets.get(candidate.currentStage)?.push(candidate);
    });

    return buckets;
  }, [vacancyCandidates]);

  const selectedTimeline = timelineEntries.filter((entry) => entry.candidateId === selectedCandidate?.id);
  const selectedCandidateStageIndex = selectedCandidate ? stageOrder.indexOf(selectedCandidate.currentStage) : -1;

  const handleVacancySelect = (vacancyId: string) => {
    setSelectedVacancyId(vacancyId);
    const nextCandidate = getCandidatesForVacancy(candidateRecords, vacancyId)[0];
    setSelectedCandidateId(nextCandidate?.id ?? '');
    setSelectedStageDraft(nextCandidate?.currentStage ?? 'New');
    setCandidateDraft((currentDraft) => ({ ...currentDraft, stage: 'New' }));
  };

  const moveCandidateToStage = (candidateId: string, nextStage: CandidateStage) => {
    setCandidateRecords((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              currentStage: nextStage,
              lastActivityDate: TODAY,
              nextInterview: nextStage === 'Rejected' || nextStage === 'Hired' ? undefined : candidate.nextInterview,
            }
          : candidate,
      ),
    );
    setSelectedStageDraft(nextStage);
  };

  const moveSelectedCandidateBy = (direction: -1 | 1) => {
    if (!selectedCandidate || selectedCandidateStageIndex === -1) {
      return;
    }

    const nextStage = stageOrder[selectedCandidateStageIndex + direction];

    if (!nextStage) {
      return;
    }

    moveCandidateToStage(selectedCandidate.id, nextStage);
  };

  const handleCandidateCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedVacancy || !candidateDraft.name.trim() || !candidateDraft.location.trim() || !candidateDraft.summary.trim()) {
      return;
    }

    const newCandidate: Candidate = {
      id: `cand-${candidateRecords.length + 1}`,
      vacancyId: selectedVacancy.id,
      name: candidateDraft.name.trim(),
      currentStage: candidateDraft.stage,
      source: candidateDraft.source,
      lastActivityDate: TODAY,
      nextInterview: candidateDraft.nextInterview.trim() || undefined,
      score: Number(candidateDraft.score),
      location: candidateDraft.location.trim(),
      summary: candidateDraft.summary.trim(),
    };

    setCandidateRecords((currentCandidates) => [...currentCandidates, newCandidate]);
    setSelectedCandidateId(newCandidate.id);
    setSelectedStageDraft(newCandidate.currentStage);
    setCandidateDraft(defaultCandidateForm);
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">First app shell milestone</p>
          <h1>HR Recruitment CRM</h1>
          <p className="page-subtitle">
            Explore vacancies, review the hiring pipeline, move candidates between stages, and inspect activity without backend complexity yet.
          </p>
        </div>
        <div className="summary-card">
          <span>{vacancies.length} vacancies</span>
          <span>{candidateRecords.length} candidates</span>
          <span>{timelineEntries.length} timeline items</span>
        </div>
      </header>

      <main className="layout-grid">
        <section className="panel vacancy-panel">
          <div className="panel-header">
            <h2>Vacancies</h2>
            <p>Select the hiring stream you want to review.</p>
          </div>

          <div className="vacancy-list">
            {vacancies.map((vacancy) => {
              const count = candidateRecords.filter((candidate) => candidate.vacancyId === vacancy.id).length;
              const isSelected = vacancy.id === selectedVacancyId;
              return (
                <button
                  key={vacancy.id}
                  type="button"
                  className={`vacancy-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleVacancySelect(vacancy.id)}
                >
                  <div className="vacancy-card-top">
                    <h3>{vacancy.title}</h3>
                    <span className={`status-chip status-${vacancy.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {vacancy.status}
                    </span>
                  </div>
                  <p>{vacancy.team}</p>
                  <div className="vacancy-meta">
                    <span>Owner: {vacancy.owner}</span>
                    <span>{count} candidates</span>
                  </div>
                </button>
              );
            })}
          </div>

          <form className="candidate-create-card" onSubmit={handleCandidateCreate}>
            <div>
              <span className="detail-label">Add candidate</span>
              <strong>Create a candidate in the selected vacancy</strong>
            </div>

            <label className="form-field">
              <span>Name</span>
              <input
                value={candidateDraft.name}
                onChange={(event) => setCandidateDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
                placeholder="Candidate name"
                required
              />
            </label>

            <div className="form-field-row">
              <label className="form-field">
                <span>Source</span>
                <select
                  value={candidateDraft.source}
                  onChange={(event) => setCandidateDraft((currentDraft) => ({ ...currentDraft, source: event.target.value }))}
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
                  onChange={(event) =>
                    setCandidateDraft((currentDraft) => ({ ...currentDraft, stage: event.target.value as CandidateStage }))
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
                  onChange={(event) =>
                    setCandidateDraft((currentDraft) => ({ ...currentDraft, location: event.target.value }))
                  }
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
                  onChange={(event) => setCandidateDraft((currentDraft) => ({ ...currentDraft, score: event.target.value }))}
                  required
                />
              </label>
            </div>

            <label className="form-field">
              <span>Next interview / note</span>
              <input
                value={candidateDraft.nextInterview}
                onChange={(event) =>
                  setCandidateDraft((currentDraft) => ({ ...currentDraft, nextInterview: event.target.value }))
                }
                placeholder="Optional scheduling note"
              />
            </label>

            <label className="form-field">
              <span>Summary</span>
              <textarea
                value={candidateDraft.summary}
                onChange={(event) => setCandidateDraft((currentDraft) => ({ ...currentDraft, summary: event.target.value }))}
                rows={4}
                placeholder="Why this candidate belongs in the pipeline"
                required
              />
            </label>

            <button type="submit" className="stage-action-button primary">
              Create candidate
            </button>
          </form>
        </section>

        <section className="panel pipeline-panel">
          <div className="panel-header">
            <h2>{selectedVacancy.title}</h2>
            <p>{selectedVacancy.team} pipeline grouped by stage.</p>
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
                          className={`candidate-card ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedCandidateId(candidate.id);
                            setSelectedStageDraft(candidate.currentStage);
                          }}
                        >
                          <div className="candidate-card-top">
                            <strong>{candidate.name}</strong>
                            <span className="score-pill">{candidate.score}</span>
                          </div>
                          <span>{candidate.source}</span>
                          <span>Last activity: {formatDate(candidate.lastActivityDate)}</span>
                          <span>Next: {candidate.nextInterview ?? 'Not scheduled'}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="panel detail-panel">
          {selectedCandidate ? (
            <>
              <div className="panel-header">
                <h2>{selectedCandidate.name}</h2>
                <p>{selectedCandidate.currentStage}</p>
              </div>

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
                    disabled={selectedCandidateStageIndex === -1 || selectedCandidateStageIndex >= stageOrder.length - 1}
                  >
                    Next stage
                  </button>
                </div>
                <div className="stage-picker-row">
                  <label className="stage-picker-field">
                    <span className="detail-label">Set stage directly</span>
                    <select
                      value={effectiveSelectedStageDraft}
                      onChange={(event) => setSelectedStageDraft(event.target.value as CandidateStage)}
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

              <div className="detail-summary">
                <div>
                  <span className="detail-label">Vacancy</span>
                  <strong>{selectedVacancy.title}</strong>
                </div>
                <div>
                  <span className="detail-label">Location</span>
                  <strong>{selectedCandidate.location}</strong>
                </div>
                <div>
                  <span className="detail-label">Source</span>
                  <strong>{selectedCandidate.source}</strong>
                </div>
                <div>
                  <span className="detail-label">Score</span>
                  <strong>{selectedCandidate.score}</strong>
                </div>
              </div>

              <p className="candidate-summary">{selectedCandidate.summary}</p>

              <div className="timeline-section">
                <h3>Activity timeline</h3>
                <div className="timeline-list">
                  {selectedTimeline.map((entry) => (
                    <article key={entry.id} className="timeline-item">
                      <div className="timeline-item-top">
                        <span className={`timeline-type timeline-${entry.type}`}>{entry.type}</span>
                        <span>{entry.date}</span>
                      </div>
                      <strong>{entry.title}</strong>
                      <p>{entry.detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-detail">
              <h2>No candidate selected</h2>
              <p>Choose a vacancy with candidates to inspect the detail view.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
