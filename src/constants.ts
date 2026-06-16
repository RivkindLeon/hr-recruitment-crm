import type {
  CandidateStage,
  SavedVacancyViewSlotId,
  TimelineEntryType,
  VacancySortOption,
  VacancyStatus,
  VacancyStatusFilter,
} from './types';

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

export const vacancyStatusFilterOptions: readonly VacancyStatusFilter[] = [
  'all',
  ...vacancyStatusOptions,
] as const;

export const vacancySortOptions: readonly VacancySortOption[] = [
  'attention',
  'active-pipeline',
  'latest-activity',
  'title',
] as const;

export const savedVacancyViewSlots: readonly {
  id: SavedVacancyViewSlotId;
  label: string;
  description: string;
}[] = [
  {
    id: 'active-work',
    label: 'Active work',
    description: 'Keep your default view for day-to-day recruiting.',
  },
  {
    id: 'urgent-hiring',
    label: 'Urgent hiring',
    description: 'Save the view you use for fast-moving or risky openings.',
  },
] as const;

export const savedVacancyViewsStorageKey = 'hr-recruitment-crm:saved-vacancy-views';
export const defaultVacancyViewSlotKey = 'hr-recruitment-crm:default-vacancy-view-slot';

export const timelineEntryTypes: TimelineEntryType[] = ['feedback', 'interview', 'communication'];

export const defaultVacancyViewSlotOptions: readonly SavedVacancyViewSlotId[] = [
  'active-work',
  'urgent-hiring',
];

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
