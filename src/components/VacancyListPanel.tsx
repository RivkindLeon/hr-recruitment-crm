import type {
  CandidateStage,
  SavedVacancyView,
  SavedVacancyViewSlotId,
  Vacancy,
  VacancyAttentionSummary,
  VacancyQueueMetric,
  VacancySortOption,
  VacancyStatusFilter,
} from '../types';
import {
  savedVacancyViewSlots,
  stageOrder,
  vacancySortOptions,
  vacancyStatusFilterOptions,
} from '../constants';
import { getSortLabel, getFilterLabel, formatLastSaved } from '../utils';
import { CandidateCreateForm } from './CandidateCreateForm';

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
  savedVacancyViews: Record<SavedVacancyViewSlotId, SavedVacancyView | null>;
  saveCurrentVacancyView: (slotId: SavedVacancyViewSlotId) => void;
  applySavedVacancyView: (slotId: SavedVacancyViewSlotId) => void;
  renameSavedVacancyView: (slotId: SavedVacancyViewSlotId, customName: string) => void;
  clearSavedVacancyView: (slotId: SavedVacancyViewSlotId) => void;
  defaultVacancyViewSlot: SavedVacancyViewSlotId | null;
  setDefaultVacancyViewSlot: (slot: SavedVacancyViewSlotId | null) => void;
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
  savedVacancyViews,
  saveCurrentVacancyView,
  applySavedVacancyView,
  renameSavedVacancyView,
  clearSavedVacancyView,
  defaultVacancyViewSlot,
  setDefaultVacancyViewSlot,
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
                  {getSortLabel(option)}
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
        <div className="saved-view-section">
          <div className="saved-view-section-header">
            <div>
              <span className="detail-label">Saved views</span>
              <strong>Return to your preferred filter + sort setup</strong>
            </div>
            <span>Saved locally for this browser</span>
          </div>

          <div className="saved-view-list">
            {savedVacancyViewSlots.map((slot) => {
              const savedView = savedVacancyViews[slot.id];
              const isActiveView =
                savedView?.vacancyFilter === vacancyFilter &&
                savedView?.vacancySort === vacancySort;

              return (
                <div key={slot.id} className={`saved-view-card ${isActiveView ? 'active' : ''}`}>
                  <div>
                    <strong>{savedView?.customName || slot.label}</strong>
                    {savedView?.lastSavedAt && (
                      <span className="saved-view-timestamp">
                        Saved {formatLastSaved(savedView.lastSavedAt)}
                      </span>
                    )}
                    <p>
                      {savedView
                        ? `${getFilterLabel(savedView.vacancyFilter)} • ${getSortLabel(savedView.vacancySort)}`
                        : slot.description}
                    </p>
                    <label className="saved-view-name-field">
                      <span>View name</span>
                      <input
                        type="text"
                        value={savedView?.customName ?? ''}
                        onChange={(e) => renameSavedVacancyView(slot.id, e.target.value)}
                        placeholder={slot.label}
                        disabled={!savedView}
                        maxLength={28}
                      />
                    </label>
                    <label className="saved-view-default-toggle">
                      <input
                        type="checkbox"
                        checked={defaultVacancyViewSlot === slot.id}
                        onChange={(e) =>
                          setDefaultVacancyViewSlot(e.target.checked ? slot.id : null)
                        }
                        disabled={!savedView}
                      />
                      <span>Open by default on load</span>
                    </label>
                  </div>
                  <div className="saved-view-actions">
                    <button
                      type="button"
                      className="stage-action-button"
                      onClick={() => applySavedVacancyView(slot.id)}
                      disabled={!savedView}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="stage-action-button primary"
                      onClick={() => saveCurrentVacancyView(slot.id)}
                    >
                      Save current
                    </button>
                    <button
                      type="button"
                      className="stage-action-button"
                      onClick={() => clearSavedVacancyView(slot.id)}
                      disabled={!savedView}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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

      <CandidateCreateForm
        candidateDraft={candidateDraft}
        setCandidateDraft={setCandidateDraft}
        sourceOptions={sourceOptions}
        handleCandidateCreate={handleCandidateCreate}
      />
    </section>
  );
}
