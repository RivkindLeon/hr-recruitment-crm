import { useMemo, useState, useEffect } from 'react';
import type {
  Candidate,
  CandidateStage,
  SavedVacancyView,
  SavedVacancyViewSlotId,
  TimelineEntry,
  Vacancy,
  VacancySortOption,
  VacancyStatusFilter,
} from '../types';
import {
  checkApiHealth,
  fetchSnapshot,
  createCandidate as apiCreateCandidate,
  updateCandidate as apiUpdateCandidate,
  createTimelineEntry as apiCreateTimelineEntry,
  updateTimelineEntry as apiUpdateTimelineEntry,
  updateVacancy as apiUpdateVacancy,
} from '../api';
import {
  stageOrder,
  TODAY,
  defaultCandidateForm,
  defaultTimelineForm,
  savedVacancyViewsStorageKey,
  defaultVacancyViewSlotKey,
  savedVacancyViewSlots,
  vacancySortOptions,
  vacancyStatusFilterOptions,
} from '../constants';
import {
  buildNewCandidate,
  buildNewTimelineEntry,
  getCandidateDraft,
  getCandidatesForVacancy,
  getStageSnapshotMap,
  getVacancyAttentionSummary,
  getVacancyDraft,
  getVacancyQueueMetrics,
  moveCandidateInList,
  sortVacancies,
  stageBucketCandidates,
  updateCandidateRecord,
  updateVacancyRecord,
} from '../utils';

type SavedVacancyViewMap = Record<SavedVacancyViewSlotId, SavedVacancyView | null>;

function getEmptySavedVacancyViews(): SavedVacancyViewMap {
  return {
    'active-work': null,
    'urgent-hiring': null,
  };
}

function readSavedVacancyViews(): SavedVacancyViewMap {
  if (typeof window === 'undefined') return getEmptySavedVacancyViews();

  try {
    const raw = window.localStorage.getItem(savedVacancyViewsStorageKey);
    if (!raw) return getEmptySavedVacancyViews();

    const parsed = JSON.parse(raw) as Partial<Record<SavedVacancyViewSlotId, SavedVacancyView>>;

    return savedVacancyViewSlots.reduce((views, slot) => {
      const view = parsed[slot.id];
      const hasValidFilter =
        !!view && vacancyStatusFilterOptions.includes(view.vacancyFilter as VacancyStatusFilter);
      const hasValidSort =
        !!view && vacancySortOptions.includes(view.vacancySort as VacancySortOption);

      views[slot.id] =
        view && hasValidFilter && hasValidSort
          ? {
              slotId: slot.id,
              label: slot.label,
              description: slot.description,
              customName:
                typeof view.customName === 'string' && view.customName.trim().length > 0
                  ? view.customName.trim()
                  : undefined,
              vacancyFilter: view.vacancyFilter,
              vacancySort: view.vacancySort,
              lastSavedAt:
                typeof view.lastSavedAt === 'string' && view.lastSavedAt.trim().length > 0
                  ? view.lastSavedAt.trim()
                  : undefined,
            }
          : null;

      return views;
    }, getEmptySavedVacancyViews());
  } catch {
    return getEmptySavedVacancyViews();
  }
}

function readDefaultVacancyViewSlot(): SavedVacancyViewSlotId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(defaultVacancyViewSlotKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed === 'active-work' || parsed === 'urgent-hiring') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function useHrCrmState(
  initialVacancies: Vacancy[],
  initialCandidates: Candidate[],
  initialTimeline: TimelineEntry[],
) {
  const [vacancyRecords, setVacancyRecords] = useState(initialVacancies);
  const [candidateRecords, setCandidateRecords] = useState(initialCandidates);
  const [timelineRecords, setTimelineRecords] = useState(initialTimeline);
  const [selectedVacancyId, setSelectedVacancyId] = useState(initialVacancies[0]?.id ?? '');
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [candidateDraft, setCandidateDraft] = useState(defaultCandidateForm);
  const [vacancyFilter, setVacancyFilter] = useState<VacancyStatusFilter>('all');
  const [vacancySort, setVacancySort] = useState<VacancySortOption>(vacancySortOptions[0]);
  const [savedVacancyViews, setSavedVacancyViews] = useState<SavedVacancyViewMap>(() =>
    readSavedVacancyViews(),
  );
  const [defaultVacancyViewSlot, setDefaultVacancyViewSlot] =
    useState<SavedVacancyViewSlotId | null>(() => readDefaultVacancyViewSlot());

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

  const filteredVacancies = useMemo(() => {
    const statusFiltered =
      vacancyFilter === 'all'
        ? vacancyRecords
        : vacancyRecords.filter((v) => v.status === vacancyFilter);

    return sortVacancies(statusFiltered, candidateRecords, vacancyAttentionSummaries, vacancySort);
  }, [candidateRecords, vacancyAttentionSummaries, vacancyFilter, vacancyRecords, vacancySort]);

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

  const filteredQueueMetrics = useMemo(
    () =>
      getVacancyQueueMetrics(
        candidateRecords.filter((candidate) =>
          filteredVacancies.some((vacancy) => vacancy.id === candidate.vacancyId),
        ),
      ),
    [candidateRecords, filteredVacancies],
  );

  const vacancyStageSnapshots = useMemo(
    () => getStageSnapshotMap(vacancyRecords, candidateRecords),
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
    const stillVisible = filteredVacancies.some((v) => v.id === selectedVacancyId);
    if (!stillVisible) {
      handleVacancySelect(filteredVacancies[0].id);
    }
  }, [filteredVacancies, selectedVacancyId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(savedVacancyViewsStorageKey, JSON.stringify(savedVacancyViews));

    if (defaultVacancyViewSlot) {
      window.localStorage.setItem(
        defaultVacancyViewSlotKey,
        JSON.stringify(defaultVacancyViewSlot),
      );
    } else {
      window.localStorage.removeItem(defaultVacancyViewSlotKey);
    }
  }, [savedVacancyViews, defaultVacancyViewSlot]);

  // ── API bootstrap on mount ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadFromApi() {
      const healthy = await checkApiHealth();
      if (!healthy || cancelled) return;

      try {
        const snapshot = await fetchSnapshot();
        if (cancelled) return;

        setVacancyRecords(snapshot.vacancies);
        setCandidateRecords(snapshot.candidates);
        setTimelineRecords(snapshot.timeline);
        setIsApiConnected(true);

        // Select first vacancy from API data
        if (snapshot.vacancies.length > 0) {
          const firstId = snapshot.vacancies[0].id;
          setSelectedVacancyId(firstId);
          const firstCandidates = snapshot.candidates.filter((c) => c.vacancyId === firstId);
          if (firstCandidates.length > 0) {
            setSelectedCandidateId(firstCandidates[0].id);
            setSelectedStageDraft(firstCandidates[0].currentStage);
            setCandidateEditDraft(getCandidateDraft(firstCandidates[0]));
            setVacancyEditDraft(getVacancyDraft(snapshot.vacancies[0]));
          }
        }
      } catch {
        // API unavailable — stay on mock data
      }
    }

    loadFromApi();
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply default view on first mount if one is set and the view exists
  useEffect(() => {
    if (!defaultVacancyViewSlot) return;
    const view = savedVacancyViews[defaultVacancyViewSlot];
    if (!view) return;
    setVacancyFilter(view.vacancyFilter);
    setVacancySort(view.vacancySort);
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const candidateId = newCandidate.id;
    setCandidateRecords((cur) => [...cur, newCandidate]);
    setSelectedCandidateId(candidateId);
    setSelectedStageDraft(newCandidate.currentStage);
    setIsEditingCandidate(false);
    setCandidateEditDraft(getCandidateDraft(newCandidate));
    setTimelineDraft(defaultTimelineForm);
    setCandidateDraft(defaultCandidateForm);

    if (isApiConnected) {
      apiCreateCandidate(newCandidate).catch(() => {
        setCandidateRecords((cur) => cur.filter((c) => c.id !== candidateId));
        if (selectedCandidateId === candidateId) {
          setSelectedCandidateId('');
        }
      });
    }
  }

  function handleCandidateEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !selectedCandidate ||
      !candidateEditDraft.location.trim() ||
      !candidateEditDraft.summary.trim()
    )
      return;

    const candidateId = selectedCandidate.id;
    const previousRecord = candidateRecords.find((c) => c.id === candidateId);

    setCandidateRecords((cur) =>
      updateCandidateRecord(cur, candidateId, {
        source: candidateEditDraft.source,
        location: candidateEditDraft.location.trim(),
        score: Number(candidateEditDraft.score),
        nextInterview: candidateEditDraft.nextInterview.trim() || undefined,
        summary: candidateEditDraft.summary.trim(),
      }),
    );
    setIsEditingCandidate(false);

    if (isApiConnected && previousRecord) {
      apiUpdateCandidate(candidateId, {
        source: candidateEditDraft.source,
        location: candidateEditDraft.location.trim(),
        score: Number(candidateEditDraft.score),
        nextInterview: candidateEditDraft.nextInterview.trim() || undefined,
        summary: candidateEditDraft.summary.trim(),
      }).catch(() => {
        setCandidateRecords((cur) => cur.map((c) => (c.id === candidateId ? previousRecord : c)));
      });
    }
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

    const vacancyId = selectedVacancy.id;
    const previousRecord = vacancyRecords.find((v) => v.id === vacancyId);

    setVacancyRecords((cur) =>
      updateVacancyRecord(cur, vacancyId, {
        title: vacancyEditDraft.title.trim(),
        team: vacancyEditDraft.team.trim(),
        owner: vacancyEditDraft.owner.trim(),
        status: vacancyEditDraft.status,
      }),
    );
    setIsEditingVacancy(false);

    if (isApiConnected && previousRecord) {
      apiUpdateVacancy(vacancyId, {
        title: vacancyEditDraft.title.trim(),
        team: vacancyEditDraft.team.trim(),
        owner: vacancyEditDraft.owner.trim(),
        status: vacancyEditDraft.status,
      }).catch(() => {
        setVacancyRecords((cur) => cur.map((v) => (v.id === vacancyId ? previousRecord : v)));
      });
    }
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
    const entryId = entry.id;
    const candidateId = selectedCandidate.id;

    setTimelineRecords((cur) => [entry, ...cur]);
    setCandidateRecords((cur) =>
      updateCandidateRecord(cur, candidateId, {
        lastActivityDate: entry.date,
      }),
    );
    setTimelineDraft(defaultTimelineForm);

    if (isApiConnected) {
      apiCreateTimelineEntry(entry).catch(() => {
        setTimelineRecords((cur) => cur.filter((t) => t.id !== entryId));
        setCandidateRecords((cur) =>
          updateCandidateRecord(cur, candidateId, {
            lastActivityDate: entry.date,
          }),
        );
      });
    }
  }

  function handleTimelineEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTimelineId || !timelineEditDraft.title.trim() || !timelineEditDraft.detail.trim())
      return;

    const timelineId = editingTimelineId;
    const previousEntry = timelineRecords.find((t) => t.id === timelineId);

    setTimelineRecords((cur) =>
      cur.map((entry) =>
        entry.id === timelineId
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

    if (isApiConnected && previousEntry) {
      apiUpdateTimelineEntry(timelineId, {
        type: timelineEditDraft.type,
        title: timelineEditDraft.title.trim(),
        detail: timelineEditDraft.detail.trim(),
        date: timelineEditDraft.date.trim(),
      }).catch(() => {
        setTimelineRecords((cur) => cur.map((t) => (t.id === timelineId ? previousEntry : t)));
      });
    }
  }

  function saveCurrentVacancyView(slotId: SavedVacancyViewSlotId) {
    const slot = savedVacancyViewSlots.find((candidateSlot) => candidateSlot.id === slotId);
    if (!slot) return;

    setSavedVacancyViews((current) => ({
      ...current,
      [slotId]: {
        slotId,
        label: slot.label,
        description: slot.description,
        customName: current[slotId]?.customName,
        vacancyFilter,
        vacancySort,
        lastSavedAt: new Date().toISOString(),
      },
    }));
  }

  function applySavedVacancyView(slotId: SavedVacancyViewSlotId) {
    const view = savedVacancyViews[slotId];
    if (!view) return;

    setVacancyFilter(view.vacancyFilter);
    setVacancySort(view.vacancySort);
  }

  function renameSavedVacancyView(slotId: SavedVacancyViewSlotId, customName: string) {
    setSavedVacancyViews((current) => {
      const existingView = current[slotId];
      if (!existingView) return current;

      const trimmedName = customName.trim();

      return {
        ...current,
        [slotId]: {
          ...existingView,
          customName: trimmedName || undefined,
        },
      };
    });
  }

  function clearSavedVacancyView(slotId: SavedVacancyViewSlotId) {
    setSavedVacancyViews((current) => ({
      ...current,
      [slotId]: null,
    }));
    // Also clear default if it matches the cleared slot
    if (defaultVacancyViewSlot === slotId) {
      setDefaultVacancyViewSlot(null);
    }
  }

  return {
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
    vacancySort,

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
    filteredQueueMetrics,
    vacancyStageSnapshots,
    vacancyAttentionSummaries,
    savedVacancyViews,
    defaultVacancyViewSlot,

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
    isApiConnected,
    setVacancyFilter,
    setVacancySort,

    handleVacancySelect,
    moveCandidateToStage,
    moveSelectedCandidateBy,
    handleCandidateCreate,
    handleCandidateEdit,
    handleVacancyEdit,
    handleTimelineCreate,
    handleTimelineEdit,
    saveCurrentVacancyView,
    applySavedVacancyView,
    renameSavedVacancyView,
    clearSavedVacancyView,
    setDefaultVacancyViewSlot,
  };
}
