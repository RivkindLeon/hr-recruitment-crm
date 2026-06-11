export type VacancyStatus = 'Active' | 'Paused' | 'Closing Soon';

export type CandidateStage =
  | 'New'
  | 'Screening'
  | 'Recruiter Interview'
  | 'Hiring Manager Interview'
  | 'Panel / Final Interview'
  | 'Offer'
  | 'Hired'
  | 'Rejected';

export interface Vacancy {
  id: string;
  title: string;
  team: string;
  owner: string;
  status: VacancyStatus;
}

export type VacancyAttentionTone = 'steady' | 'watch' | 'urgent';

export interface VacancyAttentionSummary {
  tone: VacancyAttentionTone;
  label: string;
  detail: string;
}

export interface VacancyQueueMetric {
  id: 'open' | 'late-stage' | 'needs-scheduling' | 'stale';
  label: string;
  value: number;
  tone: VacancyAttentionTone;
}

export interface Candidate {
  id: string;
  vacancyId: string;
  name: string;
  currentStage: CandidateStage;
  source: string;
  lastActivityDate: string;
  nextInterview?: string;
  score: number;
  location: string;
  summary: string;
}

export type TimelineEntryType = 'communication' | 'interview' | 'feedback';

export interface TimelineEntry {
  id: string;
  candidateId: string;
  type: TimelineEntryType;
  title: string;
  date: string;
  detail: string;
}
