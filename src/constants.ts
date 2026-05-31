import type { CandidateStage, TimelineEntryType, VacancyStatus } from './types';

export const TODAY = '2026-05-10';

export const stageOrder: CandidateStage[] = [
  'New',
  'Screening',
  'Recruiter Interview',
  'Hiring Manager Interview',
  'Panel / Final Interview',
  'Offer',
  'Hired',
  'Rejected',
];

export const vacancyStatusOptions: readonly VacancyStatus[] = [
  'Active',
  'Paused',
  'Closing Soon',
] as const;

export const vacancyStatusFilterOptions = ['all', ...vacancyStatusOptions] as const;

export type VacancyStatusFilter = (typeof vacancyStatusFilterOptions)[number];

export const timelineEntryTypes: TimelineEntryType[] = ['feedback', 'interview', 'communication'];

export const defaultCandidateForm = {
  name: '',
  source: 'LinkedIn',
  location: '',
  score: '70',
  stage: 'New' as CandidateStage,
  nextInterview: '',
  summary: '',
};

export const defaultTimelineForm = {
  type: 'feedback' as TimelineEntryType,
  title: '',
  detail: '',
  date: TODAY,
};
