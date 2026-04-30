import { useMemo, useState } from 'react';
import { candidates, stageOrder, timelineEntries, vacancies } from './data/mockData';
import type { Candidate, CandidateStage } from './types';

const formatDate = (value: string) => value;

const getCandidatesForVacancy = (vacancyId: string) =>
  candidates.filter((candidate) => candidate.vacancyId === vacancyId);

export default function App() {
  const [selectedVacancyId, setSelectedVacancyId] = useState(vacancies[0]?.id ?? '');
  const vacancyCandidates = useMemo(() => getCandidatesForVacancy(selectedVacancyId), [selectedVacancyId]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(vacancyCandidates[0]?.id ?? '');

  const selectedVacancy = vacancies.find((vacancy) => vacancy.id === selectedVacancyId) ?? vacancies[0];

  const selectedCandidate =
    vacancyCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? vacancyCandidates[0];

  const stageBuckets = useMemo(() => {
    const buckets = new Map<CandidateStage, Candidate[]>();

    stageOrder.forEach((stage) => buckets.set(stage, []));
    vacancyCandidates.forEach((candidate) => {
      buckets.get(candidate.currentStage)?.push(candidate);
    });

    return buckets;
  }, [vacancyCandidates]);

  const selectedTimeline = timelineEntries.filter((entry) => entry.candidateId === selectedCandidate?.id);

  const handleVacancySelect = (vacancyId: string) => {
    setSelectedVacancyId(vacancyId);
    const nextCandidate = getCandidatesForVacancy(vacancyId)[0];
    setSelectedCandidateId(nextCandidate?.id ?? '');
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">First app shell milestone</p>
          <h1>HR Recruitment CRM</h1>
          <p className="page-subtitle">
            Explore vacancies, review the hiring pipeline, and inspect candidate activity without backend complexity yet.
          </p>
        </div>
        <div className="summary-card">
          <span>{vacancies.length} vacancies</span>
          <span>{candidates.length} candidates</span>
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
              const count = candidates.filter((candidate) => candidate.vacancyId === vacancy.id).length;
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
                          onClick={() => setSelectedCandidateId(candidate.id)}
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
