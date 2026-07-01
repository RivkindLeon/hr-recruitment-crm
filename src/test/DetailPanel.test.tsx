import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { DetailPanel } from '../components/DetailPanel';
import { stageOrder } from '../constants';
import type {
  Candidate,
  CandidateStage,
  TimelineEntry,
  TimelineEntryType,
  Vacancy,
} from '../types';

const baseVacancy: Vacancy = {
  id: 'vac-1',
  title: 'Senior Frontend Engineer',
  team: 'Product Engineering',
  owner: 'Dana Levi',
  status: 'Active',
};

const baseCandidate: Candidate = {
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
};

const vacancyCandidates: Candidate[] = [baseCandidate];

const defaultTimeline: TimelineEntry[] = [
  {
    id: 't1',
    candidateId: 'cand-1',
    type: 'communication',
    title: 'Recruiter outreach reply',
    date: '2026-04-29',
    detail: 'Candidate replied within 2 hours.',
  },
];

const defaultDraft = { type: 'feedback' as const, title: '', detail: '', date: '2026-05-10' };
const defaultEditDraft = {
  type: 'feedback' as const,
  title: 'Edited',
  detail: 'Edited detail',
  date: '2026-05-10',
};
const defaultVacancyEditDraft = {
  title: 'Senior Frontend Engineer',
  team: 'Product Engineering',
  owner: 'Dana Levi',
  status: 'Active' as const,
};
const defaultCandidateEditDraft = {
  source: 'LinkedIn',
  location: 'Tel Aviv',
  score: '78',
  nextInterview: '2026-05-02 10:00',
  summary: 'Strong React and TypeScript background.',
};

function renderComponent(overrides: Partial<Parameters<typeof DetailPanel>[0]> = {}) {
  const props = {
    selectedCandidate: baseCandidate,
    selectedVacancy: baseVacancy,
    vacancyCandidates,
    selectedCandidateStageIndex: 1,
    effectiveSelectedStageDraft: 'Screening' as CandidateStage,
    selectedStageDraft: 'Screening' as CandidateStage,
    setSelectedStageDraft: vi.fn(),
    moveSelectedCandidateBy: vi.fn(),
    moveCandidateToStage: vi.fn(),
    // Vacancy edit
    isEditingVacancy: false,
    setIsEditingVacancy: vi.fn(),
    vacancyEditDraft: defaultVacancyEditDraft,
    setVacancyEditDraft: vi.fn(),
    handleVacancyEdit: vi.fn((e) => e.preventDefault()),
    // Candidate edit
    isEditingCandidate: false,
    setIsEditingCandidate: vi.fn(),
    candidateEditDraft: defaultCandidateEditDraft,
    setCandidateEditDraft: vi.fn(),
    sourceOptions: ['LinkedIn', 'Referral', 'Inbound'],
    handleCandidateEdit: vi.fn((e) => e.preventDefault()),
    // Timeline
    selectedTimeline: defaultTimeline,
    timelineFilter: 'all' as const,
    setTimelineFilter: vi.fn(),
    editingTimelineId: null,
    setEditingTimelineId: vi.fn(),
    timelineDraft: defaultDraft,
    setTimelineDraft: vi.fn(),
    timelineEditDraft: defaultEditDraft,
    setTimelineEditDraft: vi.fn(),
    handleTimelineCreate: vi.fn((e) => e.preventDefault()),
    handleTimelineEdit: vi.fn((e) => e.preventDefault()),
    ...overrides,
  };
  const result = render(<DetailPanel {...props} />);
  return { ...result, props };
}

describe('DetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('empty states', () => {
    it('shows "No vacancy selected" when no vacancy is provided', () => {
      const { container } = renderComponent({ selectedVacancy: undefined });
      const emptyDetail = container.querySelector('.empty-detail')!;
      expect(emptyDetail.textContent).toContain('No vacancy selected');
      expect(emptyDetail.textContent).toContain('Choose a vacancy with candidates');
    });

    it('shows "No candidate selected" when vacancy exists but no candidate', () => {
      const { container } = renderComponent({ selectedCandidate: undefined });
      const emptyDetail = container.querySelector('.empty-detail')!;
      expect(emptyDetail.textContent).toContain('No candidate selected');
      expect(emptyDetail.textContent).toContain('This vacancy has no candidates yet');
    });

    it('does not render subcomponents in empty vacancy state', () => {
      const { container } = renderComponent({ selectedVacancy: undefined });
      expect(container.querySelector('.stage-movement-card')).toBeFalsy();
      expect(container.querySelector('.timeline-section')).toBeFalsy();
    });

    it('does not render subcomponents in empty candidate state', () => {
      const { container } = renderComponent({ selectedCandidate: undefined });
      expect(container.querySelector('.stage-movement-card')).toBeFalsy();
      expect(container.querySelector('.timeline-section')).toBeFalsy();
    });
  });

  describe('with full state', () => {
    it('renders the detail panel with candidate name and stage header', () => {
      const { container } = renderComponent();
      const panelHeader = container.querySelector('.panel-header')!;
      expect(panelHeader.textContent).toContain('Ariel Ben-David');
      expect(panelHeader.textContent).toContain('Screening');
    });

    it('renders the detail summary with vacancy title, location, source, and score', () => {
      const { container } = renderComponent();
      const summary = container.querySelector('.detail-summary')!;
      expect(summary.textContent).toContain('Senior Frontend Engineer');
      expect(summary.textContent).toContain('Tel Aviv');
      expect(summary.textContent).toContain('LinkedIn');
      expect(summary.textContent).toContain('78');
    });

    it('renders the StageControls component', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.stage-movement-card')).toBeTruthy();
    });

    it('renders the VacancyEditSection component', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.candidate-summary-card')).toBeTruthy();
    });

    it('renders the CandidateEditSection component', () => {
      const { container } = renderComponent();
      // CandidateEditSection also uses .candidate-summary-card
      // There should be at least one (VacancyEditSection uses a different class)
      expect(container.querySelector('.candidate-summary')).toBeTruthy();
    });

    it('renders the TimelineSection component', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.timeline-section')).toBeTruthy();
    });

    it('renders StageControls with a Previous stage button', () => {
      const { container } = renderComponent();
      const stageButtons = container.querySelectorAll('.stage-action-button');
      const prevButton = Array.from(stageButtons).find((b) => b.textContent === 'Previous stage');
      expect(prevButton).toBeTruthy();
    });

    it('renders StageControls with an Apply stage button', () => {
      const { container } = renderComponent();
      const applyButton = Array.from(container.querySelectorAll('.stage-picker-row button')).find(
        (b) => b.textContent === 'Apply stage',
      );
      expect(applyButton).toBeTruthy();
    });

    it('renders timeline section with activity entries', () => {
      const { container } = renderComponent();
      const timelineList = container.querySelector('.timeline-list')!;
      expect(timelineList.textContent).toContain('Recruiter outreach reply');
    });
  });
});
