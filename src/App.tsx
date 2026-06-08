import {
  candidates as initialCandidates,
  timelineEntries,
  vacancies as initialVacancies,
} from './data/mockData';
import { useHrCrmState } from './hooks/useHrCrmState';
import { VacancyListPanel } from './components/VacancyListPanel';
import { PipelinePanel } from './components/PipelinePanel';
import { DetailPanel } from './components/DetailPanel';

export default function App() {
  const state = useHrCrmState(initialVacancies, initialCandidates, timelineEntries);

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">First app shell milestone</p>
          <h1>HR Recruitment CRM</h1>
          <p className="page-subtitle">
            Explore vacancies, review the hiring pipeline, update opening details, move candidates
            between stages, and capture timeline updates without backend complexity yet.
          </p>
        </div>
        <div className="summary-card">
          <span>{state.vacancyRecords.length} vacancies</span>
          <span>{state.candidateRecords.length} candidates</span>
          <span>{state.timelineRecords.length} timeline items</span>
        </div>
      </header>

      <main className="layout-grid">
        <VacancyListPanel
          filteredVacancies={state.filteredVacancies}
          vacancyFilter={state.vacancyFilter}
          setVacancyFilter={state.setVacancyFilter}
          vacancySort={state.vacancySort}
          setVacancySort={state.setVacancySort}
          selectedVacancyId={state.selectedVacancyId}
          handleVacancySelect={state.handleVacancySelect}
          vacancyStageSnapshots={state.vacancyStageSnapshots}
          candidateRecords={state.candidateRecords}
          vacancyRecords={state.vacancyRecords}
          filteredCandidateCount={state.filteredCandidateCount}
          vacancyAttentionSummaries={state.vacancyAttentionSummaries}
          candidateDraft={state.candidateDraft}
          setCandidateDraft={state.setCandidateDraft}
          sourceOptions={state.sourceOptions}
          handleCandidateCreate={state.handleCandidateCreate}
        />

        <PipelinePanel
          selectedVacancy={state.selectedVacancy}
          vacancyCandidates={state.vacancyCandidates}
          stageBuckets={state.stageBuckets}
          selectedCandidateId={state.selectedCandidateId}
          setSelectedCandidateId={state.setSelectedCandidateId}
          setSelectedStageDraft={state.setSelectedStageDraft}
          setIsEditingCandidate={state.setIsEditingCandidate}
          setCandidateEditDraft={state.setCandidateEditDraft}
          setTimelineDraft={state.setTimelineDraft}
        />

        <DetailPanel
          selectedCandidate={state.selectedCandidate}
          selectedVacancy={state.selectedVacancy}
          vacancyCandidates={state.vacancyCandidates}
          selectedCandidateStageIndex={state.selectedCandidateStageIndex}
          effectiveSelectedStageDraft={state.effectiveSelectedStageDraft}
          selectedStageDraft={state.selectedStageDraft}
          setSelectedStageDraft={state.setSelectedStageDraft}
          moveSelectedCandidateBy={state.moveSelectedCandidateBy}
          moveCandidateToStage={state.moveCandidateToStage}
          isEditingVacancy={state.isEditingVacancy}
          setIsEditingVacancy={state.setIsEditingVacancy}
          vacancyEditDraft={state.vacancyEditDraft}
          setVacancyEditDraft={state.setVacancyEditDraft}
          handleVacancyEdit={state.handleVacancyEdit}
          isEditingCandidate={state.isEditingCandidate}
          setIsEditingCandidate={state.setIsEditingCandidate}
          candidateEditDraft={state.candidateEditDraft}
          setCandidateEditDraft={state.setCandidateEditDraft}
          sourceOptions={state.sourceOptions}
          handleCandidateEdit={state.handleCandidateEdit}
          selectedTimeline={state.selectedTimeline}
          timelineFilter={state.timelineFilter}
          setTimelineFilter={state.setTimelineFilter}
          editingTimelineId={state.editingTimelineId}
          setEditingTimelineId={state.setEditingTimelineId}
          timelineDraft={state.timelineDraft}
          setTimelineDraft={state.setTimelineDraft}
          timelineEditDraft={state.timelineEditDraft}
          setTimelineEditDraft={state.setTimelineEditDraft}
          handleTimelineCreate={state.handleTimelineCreate}
          handleTimelineEdit={state.handleTimelineEdit}
        />
      </main>
    </div>
  );
}
