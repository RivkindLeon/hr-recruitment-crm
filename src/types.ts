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

export interface TimelineEntry {
  id: string;
  candidateId: string;
  type: 'communication' | 'interview' | 'feedback';
  title: string;
  date: string;
  detail: string;
}
