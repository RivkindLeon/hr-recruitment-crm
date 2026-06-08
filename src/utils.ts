import type {
  Candidate,
  CandidateStage,
  TimelineEntry,
  Vacancy,
  VacancyAttentionSummary,
  VacancyStatus,
} from './types';
import { stageOrder, TODAY } from './constants';
import type { VacancySortOption } from './constants';

export function getCandidatesForVacancy(
  allCandidates: Candidate[],
  vacancyId: string,
): Candidate[] {
  return allCandidates.filter((c) => c.vacancyId === vacancyId);
}

export function getStageCounts(candidates: Candidate[]): Record<CandidateStage, number> {
  return stageOrder.reduce(
    (counts, stage) => ({
      ...counts,
      [stage]: candidates.filter((c) => c.currentStage === stage).length,
    }),
    {} as Record<CandidateStage, number>,
  );
}

export function getCandidateDraft(candidate: Candidate | undefined) {
  return {
    source: candidate?.source ?? 'LinkedIn',
    location: candidate?.location ?? '',
    score: String(candidate?.score ?? 70),
    nextInterview: candidate?.nextInterview ?? '',
    summary: candidate?.summary ?? '',
  };
}

export function getVacancyDraft(vacancy: Vacancy | undefined): {
  title: string;
  team: string;
  owner: string;
  status: VacancyStatus;
} {
  return {
    title: vacancy?.title ?? '',
    team: vacancy?.team ?? '',
    owner: vacancy?.owner ?? '',
    status: vacancy?.status ?? ('Active' as VacancyStatus),
  };
}

export function stageBucketCandidates(
  vacancyCandidates: Candidate[],
): Map<CandidateStage, Candidate[]> {
  const buckets = new Map<CandidateStage, Candidate[]>();
  stageOrder.forEach((stage) => buckets.set(stage, []));
  vacancyCandidates.forEach((candidate) => {
    buckets.get(candidate.currentStage)?.push(candidate);
  });
  return buckets;
}

export function moveCandidateInList(
  candidates: Candidate[],
  candidateId: string,
  nextStage: CandidateStage,
): Candidate[] {
  return candidates.map((c) =>
    c.id === candidateId
      ? {
          ...c,
          currentStage: nextStage,
          lastActivityDate: TODAY,
          nextInterview:
            nextStage === 'Rejected' || nextStage === 'Hired' ? undefined : c.nextInterview,
        }
      : c,
  );
}

export function updateCandidateRecord(
  candidates: Candidate[],
  id: string,
  updates: Partial<Candidate>,
): Candidate[] {
  return candidates.map((c) => (c.id === id ? { ...c, ...updates, lastActivityDate: TODAY } : c));
}

export function updateVacancyRecord(
  vacancies: Vacancy[],
  id: string,
  updates: Partial<Vacancy>,
): Vacancy[] {
  return vacancies.map((v) => (v.id === id ? { ...v, ...updates } : v));
}

function getDaysSince(date: string): number {
  const parsedDate = new Date(`${date}T00:00:00Z`);
  const parsedToday = new Date(`${TODAY}T00:00:00Z`);
  return Math.floor((parsedToday.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
}

function formatLatestActivityLabel(candidates: Candidate[]): string {
  const latestActivity = [...candidates]
    .map((candidate) => candidate.lastActivityDate)
    .sort((a, b) => b.localeCompare(a))[0];

  if (!latestActivity) {
    return 'No activity yet';
  }

  const daysSince = getDaysSince(latestActivity);
  if (daysSince <= 0) return 'Updated today';
  if (daysSince === 1) return 'Updated 1 day ago';
  return `Updated ${daysSince} days ago`;
}

export function getOpenCandidateCount(candidates: Candidate[]): number {
  return candidates.filter((candidate) => !['Hired', 'Rejected'].includes(candidate.currentStage))
    .length;
}

function getVacancyAttentionRank(summary: VacancyAttentionSummary): number {
  if (summary.tone === 'urgent') return 0;
  if (summary.tone === 'watch') return 1;
  return 2;
}

function getLatestActivityDate(candidates: Candidate[]): string {
  return (
    [...candidates]
      .map((candidate) => candidate.lastActivityDate)
      .sort((a, b) => b.localeCompare(a))[0] ?? ''
  );
}

export function sortVacancies(
  vacancies: Vacancy[],
  candidates: Candidate[],
  attentionSummaries: Record<string, VacancyAttentionSummary>,
  sortOption: VacancySortOption,
): Vacancy[] {
  return [...vacancies].sort((left, right) => {
    if (sortOption === 'title') {
      return left.title.localeCompare(right.title);
    }

    const leftCandidates = getCandidatesForVacancy(candidates, left.id);
    const rightCandidates = getCandidatesForVacancy(candidates, right.id);

    if (sortOption === 'active-pipeline') {
      const pipelineDiff =
        getOpenCandidateCount(rightCandidates) - getOpenCandidateCount(leftCandidates);
      if (pipelineDiff !== 0) return pipelineDiff;
      return left.title.localeCompare(right.title);
    }

    if (sortOption === 'latest-activity') {
      const activityDiff = getLatestActivityDate(rightCandidates).localeCompare(
        getLatestActivityDate(leftCandidates),
      );
      if (activityDiff !== 0) return activityDiff;
      return left.title.localeCompare(right.title);
    }

    const attentionDiff =
      getVacancyAttentionRank(attentionSummaries[left.id]) -
      getVacancyAttentionRank(attentionSummaries[right.id]);
    if (attentionDiff !== 0) return attentionDiff;

    const pipelineDiff =
      getOpenCandidateCount(rightCandidates) - getOpenCandidateCount(leftCandidates);
    if (pipelineDiff !== 0) return pipelineDiff;

    return left.title.localeCompare(right.title);
  });
}

export function getVacancyAttentionSummary(
  vacancy: Vacancy,
  candidates: Candidate[],
): VacancyAttentionSummary {
  const openCandidates = candidates.filter(
    (candidate) => !['Hired', 'Rejected'].includes(candidate.currentStage),
  );
  const unscheduledLateStageCount = openCandidates.filter(
    (candidate) =>
      [
        'Recruiter Interview',
        'Hiring Manager Interview',
        'Panel / Final Interview',
        'Offer',
      ].includes(candidate.currentStage) && !candidate.nextInterview,
  ).length;
  const staleOpenCandidateCount = openCandidates.filter(
    (candidate) => getDaysSince(candidate.lastActivityDate) >= 7,
  ).length;

  if (unscheduledLateStageCount > 0) {
    return {
      tone: 'urgent',
      label: 'Needs scheduling',
      detail: `${unscheduledLateStageCount} late-stage candidate${unscheduledLateStageCount === 1 ? '' : 's'} without a next step`,
    };
  }

  if (staleOpenCandidateCount > 0) {
    return {
      tone: 'watch',
      label: 'Stale pipeline',
      detail: `${staleOpenCandidateCount} open candidate${staleOpenCandidateCount === 1 ? '' : 's'} idle for 7+ days`,
    };
  }

  if (vacancy.status === 'Closing Soon' && openCandidates.length > 0) {
    return {
      tone: 'watch',
      label: 'Closing soon',
      detail: `${openCandidates.length} active candidate${openCandidates.length === 1 ? '' : 's'} still in play`,
    };
  }

  return {
    tone: 'steady',
    label: openCandidates.length === 0 ? 'No active pipeline' : 'On track',
    detail:
      openCandidates.length === 0
        ? 'No open candidates yet for this vacancy'
        : formatLatestActivityLabel(openCandidates),
  };
}

export function getStageSnapshotMap(
  vacancies: Vacancy[],
  candidates: Candidate[],
): Record<string, Record<CandidateStage, number>> {
  return vacancies.reduce(
    (snapshots, vacancy) => ({
      ...snapshots,
      [vacancy.id]: getStageCounts(getCandidatesForVacancy(candidates, vacancy.id)),
    }),
    {} as Record<string, Record<CandidateStage, number>>,
  );
}

export function buildNewCandidate(
  candidates: Candidate[],
  vacancyId: string,
  draft: {
    name: string;
    stage: CandidateStage;
    source: string;
    score: string;
    location: string;
    summary: string;
    nextInterview: string;
  },
): Candidate {
  return {
    id: `cand-${candidates.length + 1}`,
    vacancyId,
    name: draft.name.trim(),
    currentStage: draft.stage,
    source: draft.source,
    lastActivityDate: TODAY,
    nextInterview: draft.nextInterview.trim() || undefined,
    score: Number(draft.score),
    location: draft.location.trim(),
    summary: draft.summary.trim(),
  };
}

export function buildNewTimelineEntry(
  candidateId: string,
  draft: { type: TimelineEntry['type']; title: string; detail: string; date: string },
): TimelineEntry {
  return {
    id: `t${Date.now()}`,
    candidateId,
    type: draft.type,
    title: draft.title.trim(),
    detail: draft.detail.trim(),
    date: draft.date.trim(),
  };
}
