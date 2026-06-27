import { describe, it, expect, vi } from 'vitest';
import {
  getCandidatesForVacancy,
  getStageCounts,
  getCandidateDraft,
  getVacancyDraft,
  stageBucketCandidates,
  moveCandidateInList,
  updateCandidateRecord,
  updateVacancyRecord,
  sortVacancies,
  getVacancyQueueMetrics,
  getVacancyAttentionSummary,
  getStageSnapshotMap,
  buildNewCandidate,
  buildNewTimelineEntry,
} from '../utils';
import type { Candidate, TimelineEntry, Vacancy, CandidateStage, VacancyStatus } from '../types';
import { stageOrder } from '../constants';

const sampleCandidates: Candidate[] = [
  {
    id: 'cand-1',
    vacancyId: 'vac-1',
    name: 'Ariel Ben-David',
    currentStage: 'Screening',
    source: 'LinkedIn',
    lastActivityDate: '2026-04-29',
    nextInterview: '2026-05-02 10:00',
    score: 78,
    location: 'Tel Aviv',
    summary: 'Strong React and TypeScript background.',
  },
  {
    id: 'cand-2',
    vacancyId: 'vac-1',
    name: 'Lior Shalev',
    currentStage: 'Hiring Manager Interview',
    source: 'Referral',
    lastActivityDate: '2026-04-30',
    nextInterview: '2026-05-01 15:00',
    score: 88,
    location: 'Haifa',
    summary: 'Recommended by an engineering manager.',
  },
  {
    id: 'cand-3',
    vacancyId: 'vac-1',
    name: 'Tamar Regev',
    currentStage: 'Offer',
    source: 'Inbound',
    lastActivityDate: '2026-04-28',
    nextInterview: 'Offer review pending',
    score: 91,
    location: 'Jerusalem',
    summary: 'Excellent frontend architecture depth.',
  },
  {
    id: 'cand-4',
    vacancyId: 'vac-1',
    name: 'Omer Azulay',
    currentStage: 'Rejected',
    source: 'Agency',
    lastActivityDate: '2026-04-24',
    score: 55,
    location: 'Remote',
    summary: 'Good communication.',
  },
  {
    id: 'cand-5',
    vacancyId: 'vac-2',
    name: 'Yael Hacohen',
    currentStage: 'New',
    source: 'LinkedIn',
    lastActivityDate: '2026-04-30',
    score: 72,
    location: 'Tel Aviv',
    summary: 'Looks promising.',
  },
  {
    id: 'cand-6',
    vacancyId: 'vac-2',
    name: 'Ronen Moyal',
    currentStage: 'Recruiter Interview',
    source: 'Referral',
    lastActivityDate: '2026-05-09',
    score: 80,
    location: 'Ramat Gan',
    summary: 'Strong coordination examples.',
  },
  {
    id: 'cand-7',
    vacancyId: 'vac-2',
    name: 'Shani Adler',
    currentStage: 'Hired',
    source: 'Previous applicant',
    lastActivityDate: '2026-04-21',
    score: 93,
    location: 'Herzliya',
    summary: 'Already accepted the role.',
  },
];

const sampleVacancies: Vacancy[] = [
  {
    id: 'vac-1',
    title: 'Senior Frontend Engineer',
    team: 'Product Engineering',
    owner: 'Dana Levi',
    status: 'Active',
  },
  {
    id: 'vac-2',
    title: 'Technical Recruiter',
    team: 'Talent',
    owner: 'Maya Cohen',
    status: 'Active',
  },
  {
    id: 'vac-3',
    title: 'Product Designer',
    team: 'Design',
    owner: 'Noam Katz',
    status: 'Closing Soon',
  },
];

describe('getCandidatesForVacancy', () => {
  it('returns candidates matching the vacancy id', () => {
    const result = getCandidatesForVacancy(sampleCandidates, 'vac-1');
    expect(result).toHaveLength(4);
    expect(result.every((c) => c.vacancyId === 'vac-1')).toBe(true);
  });

  it('returns empty array for vacancy with no candidates', () => {
    const result = getCandidatesForVacancy(sampleCandidates, 'vac-nonexistent');
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(getCandidatesForVacancy([], 'vac-1')).toHaveLength(0);
  });
});

describe('getStageCounts', () => {
  it('returns zero for every stage when candidates is empty', () => {
    const counts = getStageCounts([]);
    stageOrder.forEach((stage) => {
      expect(counts[stage]).toBe(0);
    });
  });

  it('counts candidates per stage correctly', () => {
    const counts = getStageCounts(sampleCandidates);
    expect(counts['New']).toBe(1); // cand-5
    expect(counts['Screening']).toBe(1); // cand-1
    expect(counts['Recruiter Interview']).toBe(1); // cand-6
    expect(counts['Hiring Manager Interview']).toBe(1); // cand-2
    expect(counts['Offer']).toBe(1); // cand-3
    expect(counts['Hired']).toBe(1); // cand-7
    expect(counts['Rejected']).toBe(1); // cand-4
  });
});

describe('getCandidateDraft', () => {
  it('returns default values when candidate is undefined', () => {
    const draft = getCandidateDraft(undefined);
    expect(draft).toEqual({
      source: 'LinkedIn',
      location: '',
      score: '70',
      nextInterview: '',
      summary: '',
    });
  });

  it('extracts fields from a candidate', () => {
    const draft = getCandidateDraft(sampleCandidates[0]);
    expect(draft.source).toBe('LinkedIn');
    expect(draft.location).toBe('Tel Aviv');
    expect(draft.score).toBe('78');
    expect(draft.nextInterview).toBe('2026-05-02 10:00');
    expect(draft.summary).toBe('Strong React and TypeScript background.');
  });

  it('handles candidate without nextInterview', () => {
    const draft = getCandidateDraft(sampleCandidates[3]); // Omer, no nextInterview
    expect(draft.nextInterview).toBe('');
  });
});

describe('getVacancyDraft', () => {
  it('returns default values when vacancy is undefined', () => {
    const draft = getVacancyDraft(undefined);
    expect(draft).toEqual({
      title: '',
      team: '',
      owner: '',
      status: 'Active',
    });
  });

  it('extracts fields from a vacancy', () => {
    const draft = getVacancyDraft(sampleVacancies[0]);
    expect(draft.title).toBe('Senior Frontend Engineer');
    expect(draft.team).toBe('Product Engineering');
    expect(draft.owner).toBe('Dana Levi');
    expect(draft.status).toBe('Active');
  });
});

describe('stageBucketCandidates', () => {
  it('creates buckets for every stage, including empty ones', () => {
    const buckets = stageBucketCandidates(sampleCandidates);
    stageOrder.forEach((stage) => {
      expect(buckets.has(stage)).toBe(true);
    });
  });

  it('places candidates in the correct stage bucket', () => {
    const buckets = stageBucketCandidates(sampleCandidates);
    expect(buckets.get('Screening')).toHaveLength(1);
    expect(buckets.get('Screening')![0].id).toBe('cand-1');
    expect(buckets.get('New')![0].id).toBe('cand-5');
  });
});

describe('moveCandidateInList', () => {
  it('updates candidate stage and sets lastActivityDate to TODAY', () => {
    const result = moveCandidateInList(sampleCandidates, 'cand-1', 'Recruiter Interview');
    const moved = result.find((c) => c.id === 'cand-1');
    expect(moved?.currentStage).toBe('Recruiter Interview');
    expect(moved?.lastActivityDate).toBe('2026-05-10');
  });

  it('clears nextInterview when moving to Rejected', () => {
    const result = moveCandidateInList(sampleCandidates, 'cand-1', 'Rejected');
    const moved = result.find((c) => c.id === 'cand-1');
    expect(moved?.nextInterview).toBeUndefined();
  });

  it('clears nextInterview when moving to Hired', () => {
    const result = moveCandidateInList(sampleCandidates, 'cand-1', 'Hired');
    const moved = result.find((c) => c.id === 'cand-1');
    expect(moved?.nextInterview).toBeUndefined();
  });

  it('preserves nextInterview when moving between pipeline stages', () => {
    const result = moveCandidateInList(sampleCandidates, 'cand-1', 'New');
    const moved = result.find((c) => c.id === 'cand-1');
    expect(moved?.nextInterview).toBe('2026-05-02 10:00');
  });

  it('preserves nextInterview when moving to Hired or Rejected', () => {
    const result = moveCandidateInList(sampleCandidates, 'cand-3', 'Hired');
    const moved = result.find((c) => c.id === 'cand-3');
    expect(moved?.nextInterview).toBeUndefined();
  });
});

describe('updateCandidateRecord', () => {
  it('updates specified fields and sets lastActivityDate to TODAY', () => {
    const result = updateCandidateRecord(sampleCandidates, 'cand-1', {
      source: 'Referral',
      score: 85,
    });
    const updated = result.find((c) => c.id === 'cand-1');
    expect(updated?.source).toBe('Referral');
    expect(updated?.score).toBe(85);
    expect(updated?.lastActivityDate).toBe('2026-05-10');
  });
});

describe('updateVacancyRecord', () => {
  it('updates specified fields on the vacancy', () => {
    const result = updateVacancyRecord(sampleVacancies, 'vac-1', {
      status: 'Paused',
      owner: 'New Owner',
    });
    const updated = result.find((v) => v.id === 'vac-1');
    expect(updated?.status).toBe('Paused');
    expect(updated?.owner).toBe('New Owner');
  });
});

describe('getVacancyQueueMetrics', () => {
  it('returns all four metric entries', () => {
    const metrics = getVacancyQueueMetrics(sampleCandidates);
    expect(metrics).toHaveLength(4);
    expect(metrics.map((m) => m.id)).toEqual(['open', 'late-stage', 'needs-scheduling', 'stale']);
  });

  it('computes open pipeline count correctly (excludes Hired and Rejected)', () => {
    // sampleCandidates has 7 total: 2 terminal (Hired cand-7, Rejected cand-4) = 5 open
    const metrics = getVacancyQueueMetrics(sampleCandidates);
    expect(metrics.find((m) => m.id === 'open')!.value).toBe(5);
  });

  it('computes late-stage candidates (interview stage and beyond, excluding terminal)', () => {
    // cand-6 (Recruiter Interview), cand-2 (Hiring Manager Interview), cand-3 (Offer) = 3 late-stage
    const metrics = getVacancyQueueMetrics(sampleCandidates);
    expect(metrics.find((m) => m.id === 'late-stage')!.value).toBe(3);
  });

  it('detects scheduling needs among late-stage candidates', () => {
    // cand-2 (Hiring Manager Interview, nextInterview='2026-05-01 15:00' - has value, not unscheduled)
    // cand-3 (Offer, nextInterview='Offer review pending' - has value, not unscheduled)
    // cand-6 (Recruiter Interview, no nextInterview - unscheduled)
    // So 1 unscheduled late-stage
    const metrics = getVacancyQueueMetrics(sampleCandidates);
    expect(metrics.find((m) => m.id === 'needs-scheduling')!.value).toBe(1);
  });
});

describe('getVacancyAttentionSummary', () => {
  it('returns urgent when unscheduled late-stage candidates exist', () => {
    const candidatesWithUnscheduled: Candidate[] = [
      {
        id: 'cand-x',
        vacancyId: 'vac-1',
        name: 'Test',
        currentStage: 'Hiring Manager Interview',
        source: 'LinkedIn',
        lastActivityDate: '2026-05-09',
        score: 80,
        location: 'Tlv',
        summary: 'test',
        // no nextInterview
      },
      {
        id: 'cand-y',
        vacancyId: 'vac-1',
        name: 'Test 2',
        currentStage: 'New',
        source: 'LinkedIn',
        lastActivityDate: '2026-05-09',
        score: 70,
        location: 'Tlv',
        summary: 'test',
      },
    ];
    const summary = getVacancyAttentionSummary(sampleVacancies[0], candidatesWithUnscheduled);
    expect(summary.tone).toBe('urgent');
    expect(summary.label).toBe('Needs scheduling');
  });

  it('returns watch when stale candidates exist (idle 7+ days)', () => {
    // All sampleCandidates have lastActivityDate from 2026-04-21 to 2026-05-09
    // TODAY is 2026-05-10. So candidates with lastActivityDate <= 2026-05-03 are stale (7+ days)
    // cand-4: 2026-04-24 (stale), cand-3: 2026-04-28 (stale), cand-1: 2026-04-29 (stale)
    // cand-2: 2026-04-30 (stale), cand-5: 2026-04-30 (stale), cand-7: 2026-04-21 (stale)
    // But cand-7 is Hired so it's not open
    // Among open: cand-1 (2026-04-29 stale), cand-2 (2026-04-30 stale), cand-3 (2026-04-28 stale)
    // cand-5 (2026-04-30 stale) = 4 stale open candidates
    const vac1Candidates = sampleCandidates.filter((c) => c.vacancyId === 'vac-1');
    const summary = getVacancyAttentionSummary(sampleVacancies[0], vac1Candidates);
    expect(summary.tone).toBe('watch');
    expect(summary.label).toBe('Stale pipeline');
  });

  it('returns watch for closing-soon vacancy with open candidates', () => {
    const freshCandidate: Candidate = {
      id: 'cand-x',
      vacancyId: 'vac-x',
      name: 'Fresh',
      currentStage: 'New',
      source: 'LinkedIn',
      lastActivityDate: '2026-05-09',
      score: 70,
      location: 'Tlv',
      summary: 'test',
    };
    const closingVacancy: Vacancy = {
      id: 'vac-x',
      title: 'Test',
      team: 'T',
      owner: 'O',
      status: 'Closing Soon',
    };
    const summary = getVacancyAttentionSummary(closingVacancy, [freshCandidate]);
    expect(summary.tone).toBe('watch');
    expect(summary.label).toBe('Closing soon');
  });

  it('returns steady on-track for stable vacancy', () => {
    const recentCandidate: Candidate = {
      id: 'cand-z',
      vacancyId: 'vac-1',
      name: 'Recent',
      currentStage: 'New',
      source: 'LinkedIn',
      lastActivityDate: '2026-05-10',
      score: 70,
      location: 'Tlv',
      summary: 'test',
    };
    const summary = getVacancyAttentionSummary(sampleVacancies[0], [recentCandidate]);
    expect(summary.tone).toBe('steady');
    expect(summary.label).toBe('On track');
  });

  it('returns steady no-active-pipeline when no open candidates', () => {
    const summary = getVacancyAttentionSummary(sampleVacancies[0], []);
    expect(summary.tone).toBe('steady');
    expect(summary.label).toBe('No active pipeline');
  });
});

describe('getStageSnapshotMap', () => {
  it('returns stage counts keyed by vacancy id', () => {
    const snapshots = getStageSnapshotMap(sampleVacancies, sampleCandidates);
    expect(Object.keys(snapshots)).toHaveLength(3);
    // vac-1 has 4 candidates
    expect(snapshots['vac-1']!['Screening']).toBe(1);
    expect(snapshots['vac-1']!['Hiring Manager Interview']).toBe(1);
    expect(snapshots['vac-1']!['Offer']).toBe(1);
    expect(snapshots['vac-1']!['Rejected']).toBe(1);
    // vac-2 has 3 candidates
    expect(snapshots['vac-2']!['New']).toBe(1);
    expect(snapshots['vac-2']!['Recruiter Interview']).toBe(1);
    expect(snapshots['vac-2']!['Hired']).toBe(1);
  });
});

describe('sortVacancies', () => {
  it('sorts by title ascending', () => {
    const sorted = sortVacancies(sampleVacancies, sampleCandidates, {}, 'title');
    expect(sorted[0].title).toBe('Product Designer');
    expect(sorted[1].title).toBe('Senior Frontend Engineer');
    expect(sorted[2].title).toBe('Technical Recruiter');
  });

  it('sorts by active pipeline descending (most candidates first)', () => {
    // vac-1 has 4 candidates, vac-2 has 3, vac-3 has 0
    const sorted = sortVacancies(sampleVacancies, sampleCandidates, {}, 'active-pipeline');
    expect(sorted[0].id).toBe('vac-1');
    expect(sorted[1].id).toBe('vac-2');
    expect(sorted[2].id).toBe('vac-3');
  });

  it('sorts by latest activity descending', () => {
    const sorted = sortVacancies(sampleVacancies, sampleCandidates, {}, 'latest-activity');
    // vac-2 latest: 2026-05-09 (cand-6), vac-1 latest: 2026-04-30 (cand-2), vac-3: no candidates
    expect(sorted[0].id).toBe('vac-2');
    expect(sorted[1].id).toBe('vac-1');
    expect(sorted[2].id).toBe('vac-3');
  });
});

describe('buildNewCandidate', () => {
  it('builds a candidate with incrementing id and TODAY', () => {
    const draft = {
      name: 'New Person',
      stage: 'Screening' as CandidateStage,
      source: 'LinkedIn',
      score: '85',
      location: 'Tel Aviv',
      summary: 'New candidate',
      nextInterview: '',
    };
    const candidate = buildNewCandidate(sampleCandidates, 'vac-1', draft);
    expect(candidate.id).toBe('cand-8');
    expect(candidate.name).toBe('New Person');
    expect(candidate.currentStage).toBe('Screening');
    expect(candidate.lastActivityDate).toBe('2026-05-10');
    expect(candidate.nextInterview).toBeUndefined();
  });

  it('includes nextInterview when provided', () => {
    const draft = {
      name: 'With Interview',
      stage: 'New' as CandidateStage,
      source: 'Referral',
      score: '90',
      location: 'Haifa',
      summary: 'Test',
      nextInterview: '2026-05-12 10:00',
    };
    const candidate = buildNewCandidate(sampleCandidates, 'vac-2', draft);
    expect(candidate.nextInterview).toBe('2026-05-12 10:00');
  });
});

describe('buildNewTimelineEntry', () => {
  it('builds a timeline entry with timestamped id', () => {
    const draft = {
      type: 'feedback' as const,
      title: 'Great candidate',
      detail: 'Very strong',
      date: '2026-05-10',
    };
    const entry = buildNewTimelineEntry('cand-1', draft);
    expect(entry.candidateId).toBe('cand-1');
    expect(entry.type).toBe('feedback');
    expect(entry.title).toBe('Great candidate');
    expect(entry.detail).toBe('Very strong');
    expect(entry.date).toBe('2026-05-10');
    expect(entry.id).toMatch(/^t\d+$/);
  });
});
