import type { Candidate, CandidateStage, TimelineEntry, Vacancy, VacancyStatus } from './types';
import { stageOrder, TODAY } from './constants';

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
