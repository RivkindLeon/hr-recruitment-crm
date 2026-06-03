import { useMemo, useState, useEffect } from 'react';
import type { Candidate, CandidateStage, TimelineEntry, Vacancy } from '../types';
import { stageOrder, TODAY, defaultCandidateForm, defaultTimelineForm } from '../constants';
import {
  buildNewCandidate,
  buildNewTimelineEntry,
  getCandidateDraft,
  getCandidatesForVacancy,
  getStageSnapshotMap,
  getVacancyAttentionSummary,
  getVacancyDraft,
  moveCandidateInList,
  stageBucketCandidates,
  updateCandidateRecord,
  updateVacancyRecord,
} from '../utils';
import type { VacancyStatusFilter } from '../constants';

export function useHrCrmState(
  initialVacancies: Vacancy[],
  initialCandidates: Candidate[],
  initialTimeline: TimelineEntry[],
) {
  const [vacancyRecords, setVacancyRecords] = useState(initialVacancies);
  const [candidateRecords, setCandidateRecords] = useState(initialCandidates);
  const [timelineRecords, setTimelineRecords] = useState(initialTimeline);
  const [selectedVacancyId, setSelectedVacancyId] = useState(initialVacancies[0]?.id ?? '');
  const [candidateDraft, setCandidateDraft] = useState(defaultCandidateForm);
  const [vacancyFilter, setVacancyFilter] = useState<VacancyStatusFilter>('all');

  const filteredVacancies = useMemo(() => {
    if (vacancyFilter === 'all') return vacancyRecords;
    return vacancyRecords.filter((v) => v.status === vacancyFilter);
  }, [vacancyFilter, vacancyRecords]);

  const vacancyCandidates = useMemo(
    () => getCandidatesForVacancy(candidateRecords, selectedVacancyId),
    [candidateRecords, selectedVacancyId],
  );

  const [selectedCandidateId, setSelectedCandidateId] = useState(vacancyCandidates[0]?.id ?? '');
  const [selectedStageDraft, setSelectedStageDraft] = useState<CandidateStage>(
    vacancyCandidates[0]?.currentStage ?? 'New',
  );
  const [isEditingCandidate, setIsEditingCandidate] = useState(false);
  const [candidateEditDraft, setCandidateEditDraft] = useState(() =>
    getCandidateDraft(vacancyCandidates[0]),
  );
  const [timelineDraft, setTimelineDraft] = useState(defaultTimelineForm);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [timelineEditDraft, setTimelineEditDraft] = useState(defaultTimelineForm);
  const [timelineFilter, setTimelineFilter] = useState<'all' | TimelineEntry['type']>('all');
  const [isEditingVacancy, setIsEditingVacancy] = useState(false);
  const [vacancyEditDraft, setVacancyEditDraft] = useState(() =>
    getVacancyDraft(initialVacancies[0]),
  );

  const selectedVacancy =
    vacancyRecords.find((v) => v.id === selectedVacancyId) ??
    filteredVacancies[0] ??
    vacancyRecords[0];

  const selectedCandidate =
    vacancyCandidates.find((c) => c.id === selectedCandidateId) ?? vacancyCandidates[0];

  const effectiveSelectedStageDraft = selectedCandidate ? selectedStageDraft : 'New';

  const sourceOptions = useMemo(
    () => Array.from(new Set(candidateRecords.map((c) => c.source))).sort(),
    [candidateRecords],
  );

  const stageBuckets = useMemo(() => stageBucketCandidates(vacancyCandidates), [vacancyCandidates]);

  const selectedTimeline = useMemo(() => {
    const candidateTimeline = timelineRecords.filter(
      (e) => e.candidateId === selectedCandidate?.id,
    );
    if (timelineFilter === 'all') return candidateTimeline;
    return candidateTimeline.filter((e) => e.type === timelineFilter);
  }, [timelineRecords, selectedCandidate?.id, timelineFilter]);

  const selectedCandidateStageIndex = selectedCandidate
    ? stageOrder.indexOf(selectedCandidate.currentStage)
    : -1;

  const filteredCandidateCount = useMemo(
    () =>
      filteredVacancies.reduce(
        (count, v) => count + candidateRecords.filter((c) => c.vacancyId === v.id).length,
        0,
      ),
    [candidateRecords, filteredVacancies],
  );

  const vacancyStageSnapshots = useMemo(
    () => getStageSnapshotMap(vacancyRecords, candidateRecords),
    [candidateRecords, vacancyRecords],
  );

  const vacancyAttentionSummaries = useMemo(
    () =>
      vacancyRecords.reduce(
        (summaries, vacancy) => ({
          ...summaries,
          [vacancy.id]: getVacancyAttentionSummary(
            vacancy,
            getCandidatesForVacancy(candidateRecords, vacancy.id),
          ),
        }),
        {} as Record<string, ReturnType<typeof getVacancyAttentionSummary>>,
      ),
    [candidateRecords, vacancyRecords],
  );

  // Sync selection when filter excludes the selected vacancy
  useEffect(() => {
    if (filteredVacancies.length === 0) {
      if (selectedVacancyId !== '') {
        setSelectedVacancyId('');
        setSelectedCandidateId('');
      }
      return;
    }
    const stillVisible = filteredVacancies.some((v) => v.id === selectedVacancyId);
    if (!stillVisible) {
      handleVacancySelect(filteredVacancies[0].id);
    }
  }, [filteredVacancies, selectedVacancyId]);

  function handleVacancySelect(vacancyId: string) {
    setSelectedVacancyId(vacancyId);
    const nextCandidate = getCandidatesForVacancy(candidateRecords, vacancyId)[0];
    const nextVacancy = vacancyRecords.find((v) => v.id === vacancyId);
    setSelectedCandidateId(nextCandidate?.id ?? '');
    setSelectedStageDraft(nextCandidate?.currentStage ?? 'New');
    setIsEditingCandidate(false);
    setCandidateEditDraft(getCandidateDraft(nextCandidate));
    setIsEditingVacancy(false);
    setVacancyEditDraft(getVacancyDraft(nextVacancy));
    setTimelineDraft(defaultTimelineForm);
    setCandidateDraft((d) => ({ ...d, stage: 'New' }));
  }

  function moveCandidateToStage(candidateId: string, nextStage: CandidateStage) {
    setCandidateRecords((cur) => moveCandidateInList(cur, candidateId, nextStage));
    setSelectedStageDraft(nextStage);
  }

  function moveSelectedCandidateBy(direction: -1 | 1) {
    if (!selectedCandidate || selectedCandidateStageIndex === -1) return;
    const nextStage = stageOrder[selectedCandidateStageIndex + direction];
    if (!nextStage) return;
    moveCandidateToStage(selectedCandidate.id, nextStage);
  }

  function handleCandidateCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !selectedVacancy ||
      !candidateDraft.name.trim() ||
      !candidateDraft.location.trim() ||
      !candidateDraft.summary.trim()
    )
      return;

    const newCandidate = buildNewCandidate(candidateRecords, selectedVacancy.id, candidateDraft);
    setCandidateRecords((cur) => [...cur, newCandidate]);
    setSelectedCandidateId(newCandidate.id);
    setSelectedStageDraft(newCandidate.currentStage);
    setIsEditingCandidate(false);
    setCandidateEditDraft(getCandidateDraft(newCandidate));
    setTimelineDraft(defaultTimelineForm);
    setCandidateDraft(defaultCandidateForm);
  }

  function handleCandidateEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !selectedCandidate ||
      !candidateEditDraft.location.trim() ||
      !candidateEditDraft.summary.trim()
    )
      return;

    setCandidateRecords((cur) =>
      updateCandidateRecord(cur, selectedCandidate.id, {
        source: candidateEditDraft.source,
        location: candidateEditDraft.location.trim(),
        score: Number(candidateEditDraft.score),
        nextInterview: candidateEditDraft.nextInterview.trim() || undefined,
        summary: candidateEditDraft.summary.trim(),
      }),
    );
    setIsEditingCandidate(false);
  }

  function handleVacancyEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !selectedVacancy ||
      !vacancyEditDraft.title.trim() ||
      !vacancyEditDraft.team.trim() ||
      !vacancyEditDraft.owner.trim()
    )
      return;

    setVacancyRecords((cur) =>
      updateVacancyRecord(cur, selectedVacancy.id, {
        title: vacancyEditDraft.title.trim(),
        team: vacancyEditDraft.team.trim(),
        owner: vacancyEditDraft.owner.trim(),
        status: vacancyEditDraft.status,
      }),
    );
    setIsEditingVacancy(false);
  }

  function handleTimelineCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !selectedCandidate ||
      !timelineDraft.title.trim() ||
      !timelineDraft.detail.trim() ||
      !timelineDraft.date.trim()
    )
      return;

    const entry = buildNewTimelineEntry(selectedCandidate.id, timelineDraft);
    setTimelineRecords((cur) => [entry, ...cur]);
    setCandidateRecords((cur) =>
      updateCandidateRecord(cur, selectedCandidate.id, {
        lastActivityDate: entry.date,
      }),
    );
    setTimelineDraft(defaultTimelineForm);
  }

  function handleTimelineEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTimelineId || !timelineEditDraft.title.trim() || !timelineEditDraft.detail.trim())
      return;

    setTimelineRecords((cur) =>
      cur.map((entry) =>
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
  }

  return {
    // State
    vacancyRecords,
    candidateRecords,
    timelineRecords,
    selectedVacancyId,
    selectedCandidateId,
    selectedStageDraft,
    isEditingCandidate,
    candidateEditDraft,
    timelineDraft,
    editingTimelineId,
    timelineEditDraft,
    timelineFilter,
    isEditingVacancy,
    vacancyEditDraft,
    candidateDraft,
    vacancyFilter,

    // Derived
    filteredVacancies,
    vacancyCandidates,
    selectedVacancy,
    selectedCandidate,
    effectiveSelectedStageDraft,
    sourceOptions,
    stageBuckets,
    selectedTimeline,
    selectedCandidateStageIndex,
    filteredCandidateCount,
    vacancyStageSnapshots,
    vacancyAttentionSummaries,

    // Setters
    setSelectedCandidateId,
    setSelectedStageDraft,
    setIsEditingCandidate,
    setCandidateEditDraft,
    setTimelineDraft,
    setEditingTimelineId,
    setTimelineEditDraft,
    setTimelineFilter,
    setIsEditingVacancy,
    setVacancyEditDraft,
    setCandidateDraft,
    setVacancyFilter,

    // Handlers
    handleVacancySelect,
    moveCandidateToStage,
    moveSelectedCandidateBy,
    handleCandidateCreate,
    handleCandidateEdit,
    handleVacancyEdit,
    handleTimelineCreate,
    handleTimelineEdit,
  };
}
