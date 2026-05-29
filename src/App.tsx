import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { candidates as initialCandidates, stageOrder, timelineEntries, vacancies as initialVacancies } from './data/mockData';
import type { Candidate, CandidateStage, TimelineEntry, TimelineEntryType, VacancyStatus } from './types';

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
const defaultTimelineForm = {
  type: 'feedback' as TimelineEntryType,
  title: '',
  detail: '',
  date: TODAY,
};

const formatDate = (value: string) => value;

const getCandidatesForVacancy = (allCandidates: Candidate[], vacancyId: string) =>
  allCandidates.filter((candidate) => candidate.vacancyId === vacancyId);

const getStageCounts = (candidates: Candidate[]) =>
  stageOrder.reduce(
    (counts, stage) => ({
      ...counts,
      [stage]: candidates.filter((candidate) => candidate.currentStage === stage).length,
    }),
    {} as Record<CandidateStage, number>,
  );

const getCandidateDraft = (candidate: Candidate | undefined) => ({
  source: candidate?.source ?? 'LinkedIn',
  location: candidate?.location ?? '',
  score: String(candidate?.score ?? 70),
  nextInterview: candidate?.nextInterview ?? '',
  summary: candidate?.summary ?? '',
});

const vacancyStatusOptions = ['all', 'Active', 'Paused', 'Closing Soon'] as const;
type VacancyStatusFilter = (typeof vacancyStatusOptions)[number];

const getVacancyDraft = (vacancy: (typeof initialVacancies)[number] | undefined) => ({
  title: vacancy?.title ?? '',
  team: vacancy?.team ?? '',
  owner: vacancy?.owner ?? '',
  status: vacancy?.status ?? ('Active' as VacancyStatus),
});

export default function App() {
  const [vacancyRecords, setVacancyRecords] = useState(initialVacancies);
  const [candidateRecords, setCandidateRecords] = useState(initialCandidates);
  const [timelineRecords, setTimelineRecords] = useState(timelineEntries);
  const [selectedVacancyId, setSelectedVacancyId] = useState(initialVacancies[0]?.id ?? '');
  const [candidateDraft, setCandidateDraft] = useState(defaultCandidateForm);
  const [vacancyFilter, setVacancyFilter] = useState<VacancyStatusFilter>('all');
  const filteredVacancies = useMemo(() => {
    if (vacancyFilter === 'all') {
      return vacancyRecords;
    }

    return vacancyRecords.filter((vacancy) => vacancy.status === vacancyFilter);
  }, [vacancyFilter, vacancyRecords]);
  const vacancyCandidates = useMemo(
    () => getCandidatesForVacancy(candidateRecords, selectedVacancyId),
    [candidateRecords, selectedVacancyId],
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState(vacancyCandidates[0]?.id ?? '');
  const [selectedStageDraft, setSelectedStageDraft] = useState<CandidateStage>(vacancyCandidates[0]?.currentStage ?? 'New');
  const [isEditingCandidate, setIsEditingCandidate] = useState(false);
  const [candidateEditDraft, setCandidateEditDraft] = useState(() => getCandidateDraft(vacancyCandidates[0]));
  const [timelineDraft, setTimelineDraft] = useState(defaultTimelineForm);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [timelineEditDraft, setTimelineEditDraft] = useState(defaultTimelineForm);
  const [timelineFilter, setTimelineFilter] = useState<TimelineEntryType | 'all'>('all');
  const [isEditingVacancy, setIsEditingVacancy] = useState(false);
  const [vacancyEditDraft, setVacancyEditDraft] = useState(() => getVacancyDraft(initialVacancies[0]));

  const selectedVacancy = vacancyRecords.find((vacancy) => vacancy.id === selectedVacancyId) ?? filteredVacancies[0] ?? vacancyRecords[0];

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

  const selectedTimeline = useMemo(() => {
    const candidateTimeline = timelineRecords.filter((entry) => entry.candidateId === selectedCandidate?.id);
    if (timelineFilter === 'all') return candidateTimeline;
    return candidateTimeline.filter((entry) => entry.type === timelineFilter);
  }, [timelineRecords, selectedCandidate?.id, timelineFilter]);
  const selectedCandidateStageIndex = selectedCandidate ? stageOrder.indexOf(selectedCandidate.currentStage) : -1;
  const filteredCandidateCount = useMemo(
    () => filteredVacancies.reduce((count, vacancy) => count + candidateRecords.filter((candidate) => candidate.vacancyId === vacancy.id).length, 0),
    [candidateRecords, filteredVacancies],
  );
  const vacancyFilterLabel = vacancyFilter === 'all' ? 'All vacancies' : vacancyFilter;
  const vacancyStageSnapshots = useMemo(
    () =>
      vacancyRecords.reduce(
        (snapshots, vacancy) => ({
          ...snapshots,
          [vacancy.id]: getStageCounts(getCandidatesForVacancy(candidateRecords, vacancy.id)),
        }),
        {} as Record<string, Record<CandidateStage, number>>,
      ),
    [candidateRecords, vacancyRecords],
  );

  useEffect(() => {
    if (filteredVacancies.length === 0) {
      if (selectedVacancyId !== '') {
        setSelectedVacancyId('');
        setSelectedCandidateId('');
      }
      return;
    }

    const selectedStillVisible = filteredVacancies.some((vacancy) => vacancy.id === selectedVacancyId);
    if (selectedStillVisible) {
      return;
    }

    handleVacancySelect(filteredVacancies[0].id);
  }, [filteredVacancies, selectedVacancyId]);

  const handleVacancySelect = (vacancyId: string) => {
    setSelectedVacancyId(vacancyId);
    const nextCandidate = getCandidatesForVacancy(candidateRecords, vacancyId)[0];
    const nextVacancy = vacancyRecords.find((vacancy) => vacancy.id === vacancyId);
    setSelectedCandidateId(nextCandidate?.id ?? '');
    setSelectedStageDraft(nextCandidate?.currentStage ?? 'New');
    setIsEditingCandidate(false);
    setCandidateEditDraft(getCandidateDraft(nextCandidate));
    setIsEditingVacancy(false);
    setVacancyEditDraft(getVacancyDraft(nextVacancy));
    setTimelineDraft(defaultTimelineForm);
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
    setIsEditingCandidate(false);
    setCandidateEditDraft(getCandidateDraft(newCandidate));
    setTimelineDraft(defaultTimelineForm);
    setCandidateDraft(defaultCandidateForm);
  };

  const handleCandidateEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCandidate || !candidateEditDraft.location.trim() || !candidateEditDraft.summary.trim()) {
      return;
    }

    setCandidateRecords((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === selectedCandidate.id
          ? {
              ...candidate,
              source: candidateEditDraft.source,
              location: candidateEditDraft.location.trim(),
              score: Number(candidateEditDraft.score),
              nextInterview: candidateEditDraft.nextInterview.trim() || undefined,
              summary: candidateEditDraft.summary.trim(),
              lastActivityDate: TODAY,
            }
          : candidate,
      ),
    );
    setIsEditingCandidate(false);
  };

  const handleVacancyEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedVacancy || !vacancyEditDraft.title.trim() || !vacancyEditDraft.team.trim() || !vacancyEditDraft.owner.trim()) {
      return;
    }

    setVacancyRecords((currentVacancies) =>
      currentVacancies.map((vacancy) =>
        vacancy.id === selectedVacancy.id
          ? {
              ...vacancy,
              title: vacancyEditDraft.title.trim(),
              team: vacancyEditDraft.team.trim(),
              owner: vacancyEditDraft.owner.trim(),
              status: vacancyEditDraft.status,
            }
          : vacancy,
      ),
    );
    setIsEditingVacancy(false);
  };

  const handleTimelineCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCandidate || !timelineDraft.title.trim() || !timelineDraft.detail.trim() || !timelineDraft.date.trim()) {
      return;
    }

    const entryDate = timelineDraft.date.trim();
    const newTimelineEntry: TimelineEntry = {
      id: `t${Date.now()}`,
      candidateId: selectedCandidate.id,
      type: timelineDraft.type,
      title: timelineDraft.title.trim(),
      detail: timelineDraft.detail.trim(),
      date: entryDate,
    };

    setTimelineRecords((currentEntries) => [newTimelineEntry, ...currentEntries]);
    setCandidateRecords((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === selectedCandidate.id
          ? {
              ...candidate,
              lastActivityDate: entryDate,
            }
          : candidate,
      ),
    );
    setTimelineDraft(defaultTimelineForm);
  };

  const handleTimelineEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingTimelineId || !timelineEditDraft.title.trim() || !timelineEditDraft.detail.trim()) {
      return;
    }

    setTimelineRecords((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === editingTimelineId
          ? {
              ...entry,
              type: timelineEditDraft.type,
              title: timelineEditDraft.title.trim(),
              detail: timelineEditDraft.detail.trim(),
              date: timelineEditDraft.date.trim(),
            }
          : entry,
      ),
    );
    setEditingTimelineId(null);
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">First app shell milestone</p>
          <h1>HR Recruitment CRM</h1>
          <p className="page-subtitle">
            Explore vacancies, review the hiring pipeline, update opening details, move candidates between stages, and capture timeline updates without backend complexity yet.
          </p>
        </div>
        <div className="summary-card">
          <span>{vacancyRecords.length} vacancies</span>
          <span>{candidateRecords.length} candidates</span>
          <span>{timelineRecords.length} timeline items</span>
        </div>
      </header>

      <main className="layout-grid">
        <section className="panel vacancy-panel">
          <div className="panel-header">
            <h2>Vacancies</h2>
            <p>Select the hiring stream you want to review.</p>
          </div>

          <div className="vacancy-filter-card">
            <div>
              <span className="detail-label">Quick views</span>
              <strong>{vacancyFilterLabel}</strong>
            </div>
            <span>{filteredCandidateCount} candidates in view</span>
            <div className="timeline-filters vacancy-filters">
              {vacancyStatusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`filter-chip ${vacancyFilter === status ? 'active' : ''}`}
                  onClick={() => setVacancyFilter(status)}
                >
                  {status === 'all' ? 'All' : status}
                  <span className="filter-count">
                    {status === 'all'
                      ? vacancyRecords.length
                      : vacancyRecords.filter((vacancy) => vacancy.status === status).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="vacancy-list">
            {filteredVacancies.length === 0 ? (
              <div className="empty-state">
                No vacancies match this status view yet. Switch filters or update a vacancy status to keep the hiring board moving.
              </div>
            ) : (
              filteredVacancies.map((vacancy) => {
                const count = candidateRecords.filter((candidate) => candidate.vacancyId === vacancy.id).length;
                const isSelected = vacancy.id === selectedVacancyId;
                const stageSnapshot = vacancyStageSnapshots[vacancy.id] ?? getStageCounts([]);
                const visibleStageSummary = stageOrder.filter((stage) => stageSnapshot[stage] > 0).slice(0, 4);

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
                    <div className="vacancy-stage-summary" aria-label={`${vacancy.title} stage summary`}>
                      {visibleStageSummary.length > 0 ? (
                        visibleStageSummary.map((stage) => (
                          <span key={stage} className="stage-summary-pill">
                            {stage}: {stageSnapshot[stage]}
                          </span>
                        ))
                      ) : (
                        <span className="detail-label">No stage activity yet</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
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
            <h2>{selectedVacancy?.title ?? 'No vacancy in this view'}</h2>
            <p>{selectedVacancy ? `${selectedVacancy.team} pipeline grouped by stage.` : 'Adjust the vacancy status view to inspect a hiring pipeline.'}</p>
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
                          className={`candidate-card ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedCandidateId(candidate.id);
                            setSelectedStageDraft(candidate.currentStage);
                            setIsEditingCandidate(false);
                            setCandidateEditDraft(getCandidateDraft(candidate));
                            setTimelineDraft(defaultTimelineForm);
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
            </>
          ) : (
            <div className="empty-state">
              No vacancy is currently selected because this quick view has no matching openings.
            </div>
          )}
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

              <div className="candidate-summary-card">
                <div className="candidate-summary-header">
                  <div>
                    <span className="detail-label">Vacancy details</span>
                    <strong>Adjust title, owner, team, or status without leaving the hiring view</strong>
                  </div>
                  <button
                    type="button"
                    className="stage-action-button"
                    onClick={() => {
                      if (isEditingVacancy) {
                        setVacancyEditDraft(getVacancyDraft(selectedVacancy));
                      }
                      setIsEditingVacancy((currentValue) => !currentValue);
                    }}
                  >
                    {isEditingVacancy ? 'Cancel edit' : 'Edit vacancy'}
                  </button>
                </div>

                {isEditingVacancy ? (
                  <form className="candidate-edit-form" onSubmit={handleVacancyEdit}>
                    <label className="form-field">
                      <span>Title</span>
                      <input
                        value={vacancyEditDraft.title}
                        onChange={(event) =>
                          setVacancyEditDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))
                        }
                        required
                      />
                    </label>

                    <div className="form-field-row">
                      <label className="form-field">
                        <span>Team</span>
                        <input
                          value={vacancyEditDraft.team}
                          onChange={(event) =>
                            setVacancyEditDraft((currentDraft) => ({ ...currentDraft, team: event.target.value }))
                          }
                          required
                        />
                      </label>

                      <label className="form-field">
                        <span>Owner</span>
                        <input
                          value={vacancyEditDraft.owner}
                          onChange={(event) =>
                            setVacancyEditDraft((currentDraft) => ({ ...currentDraft, owner: event.target.value }))
                          }
                          required
                        />
                      </label>
                    </div>

                    <label className="form-field">
                      <span>Status</span>
                      <select
                        value={vacancyEditDraft.status}
                        onChange={(event) =>
                          setVacancyEditDraft((currentDraft) => ({
                            ...currentDraft,
                            status: event.target.value as VacancyStatus,
                          }))
                        }
                      >
                        {(['Active', 'Paused', 'Closing Soon'] as const).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button type="submit" className="stage-action-button primary">
                      Save vacancy updates
                    </button>
                  </form>
                ) : (
                  <div className="detail-summary vacancy-detail-summary">
                    <div>
                      <span className="detail-label">Team</span>
                      <strong>{selectedVacancy.team}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Owner</span>
                      <strong>{selectedVacancy.owner}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Status</span>
                      <strong>{selectedVacancy.status}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Pipeline size</span>
                      <strong>{vacancyCandidates.length} candidates</strong>
                    </div>
                  </div>
                )}
              </div>

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
                        setCandidateEditDraft(getCandidateDraft(selectedCandidate));
                      }
                      setIsEditingCandidate((currentValue) => !currentValue);
                    }}
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
                          onChange={(event) =>
                            setCandidateEditDraft((currentDraft) => ({ ...currentDraft, source: event.target.value }))
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
                          onChange={(event) =>
                            setCandidateEditDraft((currentDraft) => ({ ...currentDraft, score: event.target.value }))
                          }
                          required
                        />
                      </label>
                    </div>

                    <label className="form-field">
                      <span>Location</span>
                      <input
                        value={candidateEditDraft.location}
                        onChange={(event) =>
                          setCandidateEditDraft((currentDraft) => ({ ...currentDraft, location: event.target.value }))
                        }
                        required
                      />
                    </label>

                    <label className="form-field">
                      <span>Next interview / note</span>
                      <input
                        value={candidateEditDraft.nextInterview}
                        onChange={(event) =>
                          setCandidateEditDraft((currentDraft) => ({ ...currentDraft, nextInterview: event.target.value }))
                        }
                        placeholder="Optional scheduling note"
                      />
                    </label>

                    <label className="form-field">
                      <span>Summary</span>
                      <textarea
                        value={candidateEditDraft.summary}
                        onChange={(event) =>
                          setCandidateEditDraft((currentDraft) => ({ ...currentDraft, summary: event.target.value }))
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
                    {(['feedback', 'interview', 'communication'] as const).map((type) => (
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
                          onChange={(event) =>
                            setTimelineDraft((currentDraft) => ({
                              ...currentDraft,
                              type: event.target.value as TimelineEntryType,
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
                          onChange={(event) =>
                            setTimelineDraft((currentDraft) => ({ ...currentDraft, date: event.target.value }))
                          }
                          required
                        />
                      </label>
                    </div>

                    <label className="form-field">
                      <span>Title</span>
                      <input
                        value={timelineDraft.title}
                        onChange={(event) =>
                          setTimelineDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))
                        }
                        placeholder="Manager debrief added"
                        required
                      />
                    </label>

                    <label className="form-field">
                      <span>Detail</span>
                      <textarea
                        value={timelineDraft.detail}
                        onChange={(event) =>
                          setTimelineDraft((currentDraft) => ({ ...currentDraft, detail: event.target.value }))
                        }
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
                                  onChange={(event) =>
                                    setTimelineEditDraft((currentDraft) => ({
                                      ...currentDraft,
                                      type: event.target.value as TimelineEntryType,
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
                                  onChange={(event) =>
                                    setTimelineEditDraft((currentDraft) => ({
                                      ...currentDraft,
                                      date: event.target.value,
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
                                onChange={(event) =>
                                  setTimelineEditDraft((currentDraft) => ({
                                    ...currentDraft,
                                    title: event.target.value,
                                  }))
                                }
                                required
                              />
                            </label>

                            <label className="form-field">
                              <span>Detail</span>
                              <textarea
                                value={timelineEditDraft.detail}
                                onChange={(event) =>
                                  setTimelineEditDraft((currentDraft) => ({
                                    ...currentDraft,
                                    detail: event.target.value,
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
