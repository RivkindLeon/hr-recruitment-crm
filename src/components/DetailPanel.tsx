import type {
  Candidate,
  CandidateEditDraft,
  CandidateStage,
  TimelineEntry,
  TimelineEntryType,
  TimelineFormDraft,
  Vacancy,
  VacancyEditDraft,
} from '../types';
import { StageControls } from './StageControls';
import { VacancyEditSection } from './VacancyEditSection';
import { CandidateEditSection } from './CandidateEditSection';
import { TimelineSection } from './TimelineSection';

interface DetailPanelProps {
  selectedCandidate: Candidate | undefined;
  selectedVacancy: Vacancy | undefined;
  vacancyCandidates: Candidate[];
  selectedCandidateStageIndex: number;
  effectiveSelectedStageDraft: CandidateStage;
  selectedStageDraft: CandidateStage;
  setSelectedStageDraft: (stage: CandidateStage) => void;
  moveSelectedCandidateBy: (direction: -1 | 1) => void;
  moveCandidateToStage: (id: string, stage: CandidateStage) => void;
  // Vacancy edit
  isEditingVacancy: boolean;
  setIsEditingVacancy: (editing: boolean) => void;
  vacancyEditDraft: VacancyEditDraft;
  setVacancyEditDraft: React.Dispatch<React.SetStateAction<VacancyEditDraft>>;
  handleVacancyEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  // Candidate edit
  isEditingCandidate: boolean;
  setIsEditingCandidate: (editing: boolean) => void;
  candidateEditDraft: CandidateEditDraft;
  setCandidateEditDraft: React.Dispatch<React.SetStateAction<CandidateEditDraft>>;
  sourceOptions: string[];
  handleCandidateEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  // Timeline
  selectedTimeline: TimelineEntry[];
  timelineFilter: 'all' | TimelineEntryType;
  setTimelineFilter: (f: 'all' | TimelineEntryType) => void;
  editingTimelineId: string | null;
  setEditingTimelineId: (id: string | null) => void;
  timelineDraft: TimelineFormDraft;
  setTimelineDraft: React.Dispatch<React.SetStateAction<TimelineFormDraft>>;
  timelineEditDraft: TimelineFormDraft;
  setTimelineEditDraft: React.Dispatch<React.SetStateAction<TimelineFormDraft>>;
  handleTimelineCreate: (e: React.FormEvent<HTMLFormElement>) => void;
  handleTimelineEdit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function DetailPanel({
  selectedCandidate,
  selectedVacancy,
  vacancyCandidates,
  selectedCandidateStageIndex,
  effectiveSelectedStageDraft,
  selectedStageDraft,
  setSelectedStageDraft,
  moveSelectedCandidateBy,
  moveCandidateToStage,
  isEditingVacancy,
  setIsEditingVacancy,
  vacancyEditDraft,
  setVacancyEditDraft,
  handleVacancyEdit,
  isEditingCandidate,
  setIsEditingCandidate,
  candidateEditDraft,
  setCandidateEditDraft,
  sourceOptions,
  handleCandidateEdit,
  selectedTimeline,
  timelineFilter,
  setTimelineFilter,
  editingTimelineId,
  setEditingTimelineId,
  timelineDraft,
  setTimelineDraft,
  timelineEditDraft,
  setTimelineEditDraft,
  handleTimelineCreate,
  handleTimelineEdit,
}: DetailPanelProps) {
  if (!selectedVacancy) {
    return (
      <aside className="panel detail-panel">
        <div className="empty-detail">
          <h2>No vacancy selected</h2>
          <p>Choose a vacancy with candidates to inspect the detail view.</p>
        </div>
      </aside>
    );
  }

  if (!selectedCandidate) {
    return (
      <aside className="panel detail-panel">
        <div className="empty-detail">
          <h2>No candidate selected</h2>
          <p>This vacancy has no candidates yet. Add one from the vacancy panel.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="panel detail-panel">
      <div className="panel-header">
        <h2>{selectedCandidate.name}</h2>
        <p>{selectedCandidate.currentStage}</p>
      </div>

      <StageControls
        selectedCandidate={selectedCandidate}
        selectedCandidateStageIndex={selectedCandidateStageIndex}
        effectiveSelectedStageDraft={effectiveSelectedStageDraft}
        selectedStageDraft={selectedStageDraft}
        setSelectedStageDraft={setSelectedStageDraft}
        moveSelectedCandidateBy={moveSelectedCandidateBy}
        moveCandidateToStage={moveCandidateToStage}
      />

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

      <VacancyEditSection
        selectedVacancy={selectedVacancy}
        isEditingVacancy={isEditingVacancy}
        setIsEditingVacancy={setIsEditingVacancy}
        vacancyEditDraft={vacancyEditDraft}
        setVacancyEditDraft={setVacancyEditDraft}
        vacancyCandidatesCount={vacancyCandidates.length}
        handleVacancyEdit={handleVacancyEdit}
      />

      <CandidateEditSection
        selectedCandidate={selectedCandidate}
        selectedVacancyTitle={selectedVacancy.title}
        isEditingCandidate={isEditingCandidate}
        setIsEditingCandidate={setIsEditingCandidate}
        candidateEditDraft={candidateEditDraft}
        setCandidateEditDraft={setCandidateEditDraft}
        sourceOptions={sourceOptions}
        handleCandidateEdit={handleCandidateEdit}
      />

      <TimelineSection
        selectedTimeline={selectedTimeline}
        timelineFilter={timelineFilter}
        setTimelineFilter={setTimelineFilter}
        editingTimelineId={editingTimelineId}
        setEditingTimelineId={setEditingTimelineId}
        timelineDraft={timelineDraft}
        setTimelineDraft={setTimelineDraft}
        timelineEditDraft={timelineEditDraft}
        setTimelineEditDraft={setTimelineEditDraft}
        handleTimelineCreate={handleTimelineCreate}
        handleTimelineEdit={handleTimelineEdit}
      />
    </aside>
  );
}
