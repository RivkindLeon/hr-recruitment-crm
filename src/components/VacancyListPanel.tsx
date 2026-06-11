import type { Vacancy, VacancyAttentionSummary, VacancyQueueMetric } from '../types';
import type { VacancySortOption, VacancyStatusFilter } from '../constants';
import { vacancySortOptions, vacancyStatusFilterOptions } from '../constants';
import type { CandidateStage } from '../types';
import { stageOrder } from '../constants';

interface VacancyListPanelProps {
  filteredVacancies: Vacancy[];
  vacancyFilter: VacancyStatusFilter;
  setVacancyFilter: (f: VacancyStatusFilter) => void;
  vacancySort: VacancySortOption;
  setVacancySort: (sort: VacancySortOption) => void;
  selectedVacancyId: string;
  handleVacancySelect: (id: string) => void;
  vacancyStageSnapshots: Record<string, Record<CandidateStage, number>>;
  candidateRecords: { vacancyId: string }[];
  vacancyRecords: Vacancy[];
  filteredCandidateCount: number;
  filteredQueueMetrics: VacancyQueueMetric[];
  vacancyAttentionSummaries: Record<string, VacancyAttentionSummary>;
  /** Candidate create form props */
  candidateDraft: {
    name: string;
    source: string;
    stage: CandidateStage;
    location: string;
    score: string;
    nextInterview: string;
    summary: string;
  };
  setCandidateDraft: React.Dispatch<
    React.SetStateAction<{
      name: string;
      source: string;
      stage: CandidateStage;
      location: string;
      score: string;
      nextInterview: string;
      summary: string;
    }>
  >;
  sourceOptions: string[];
  handleCandidateCreate: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function VacancyListPanel({
  filteredVacancies,
  vacancyFilter,
  setVacancyFilter,
  vacancySort,
  setVacancySort,
  selectedVacancyId,
  handleVacancySelect,
  vacancyStageSnapshots,
  candidateRecords,
  vacancyRecords,
  filteredCandidateCount,
  filteredQueueMetrics,
  vacancyAttentionSummaries,
  candidateDraft,
  setCandidateDraft,
  sourceOptions,
  handleCandidateCreate,
}: VacancyListPanelProps) {
  const vacancyFilterLabel = vacancyFilter === 'all' ? 'All vacancies' : vacancyFilter;

  return (
    <section className="panel vacancy-panel">
      <div className="panel-header">
        <h2>Vacancies</h2>
        <p>Select the hiring stream you want to review.</p>
      </div>

      <div className="vacancy-filter-card">
        <div className="vacancy-filter-header">
          <div>
            <span className="detail-label">Quick views</span>
            <strong>{vacancyFilterLabel}</strong>
          </div>
          <label className="sort-field">
            <span>Sort by</span>
            <select
              value={vacancySort}
              onChange={(e) => setVacancySort(e.target.value as VacancySortOption)}
            >
              {vacancySortOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'attention'
                    ? 'Attention'
                    : option === 'active-pipeline'
                      ? 'Active pipeline'
                      : option === 'latest-activity'
                        ? 'Latest activity'
                        : 'Title'}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span>{filteredCandidateCount} candidates in view</span>
        <div className="vacancy-queue-metrics" aria-label="Queue metrics for current vacancy view">
          {filteredQueueMetrics.map((metric) => (
            <div key={metric.id} className={`queue-metric-pill tone-${metric.tone}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
        <div className="timeline-filters vacancy-filters">
          {vacancyStatusFilterOptions.map((status) => (
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
                  : vacancyRecords.filter((v) => v.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="vacancy-list">
        {filteredVacancies.length === 0 ? (
          <div className="empty-state">
            No vacancies match this status view yet. Switch filters or update a vacancy status to
            keep the hiring board moving.
          </div>
        ) : (
          filteredVacancies.map((vacancy) => {
            const count = candidateRecords.filter((c) => c.vacancyId === vacancy.id).length;
            const isSelected = vacancy.id === selectedVacancyId;
            const stageSnapshot = vacancyStageSnapshots[vacancy.id] ?? {};
            const visibleStageSummary = stageOrder
              .filter((s) => (stageSnapshot[s] ?? 0) > 0)
              .slice(0, 4);
            const attentionSummary = vacancyAttentionSummaries[vacancy.id];

            return (
              <button
                key={vacancy.id}
                type="button"
                className={`vacancy-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleVacancySelect(vacancy.id)}
              >
                <div className="vacancy-card-top">
                  <h3>{vacancy.title}</h3>
                  <span
                    className={`status-chip status-${vacancy.status.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {vacancy.status}
                  </span>
                </div>
                <p>{vacancy.team}</p>
                <div className="vacancy-meta">
                  <span>Owner: {vacancy.owner}</span>
                  <span>{count} candidates</span>
                </div>
                <div className={`vacancy-attention-card tone-${attentionSummary.tone}`}>
                  <span className="vacancy-attention-label">{attentionSummary.label}</span>
                  <span>{attentionSummary.detail}</span>
                </div>
                <div
                  className="vacancy-stage-summary"
                  aria-label={`${vacancy.title} stage summary`}
                >
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
    </section>
  );
}
