import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VacancyListPanel } from '../components/VacancyListPanel';
import type {
  CandidateStage,
  SavedVacancyView,
  SavedVacancyViewSlotId,
  Vacancy,
  VacancyAttentionSummary,
  VacancyQueueMetric,
  VacancySortOption,
  VacancyStatusFilter,
} from '../types';

const baseVacancies: Vacancy[] = [
  { id: 'vac-1', title: 'Senior Frontend Engineer', team: 'Product Engineering', owner: 'Dana Levi', status: 'Active' },
  { id: 'vac-2', title: 'Technical Recruiter', team: 'Talent', owner: 'Maya Cohen', status: 'Active' },
  { id: 'vac-3', title: 'Product Designer', team: 'Design', owner: 'Noam Katz', status: 'Closing Soon' },
];

const baseCandidates = [
  { vacancyId: 'vac-1', id: 'cand-1' },
  { vacancyId: 'vac-1', id: 'cand-2' },
  { vacancyId: 'vac-2', id: 'cand-3' },
];

function buildSnapshot(count: number, stage: CandidateStage = 'Screening'): Record<CandidateStage, number> {
  const s: Record<CandidateStage, number> = {
    New: 0, Screening: 0, 'Recruiter Interview': 0, 'Hiring Manager Interview': 0,
    'Panel / Final Interview': 0, Offer: 0, Hired: 0, Rejected: 0,
  };
  s[stage] = count;
  return s;
}

const baseStageSnapshots: Record<string, Record<CandidateStage, number>> = {
  'vac-1': { ...buildSnapshot(1, 'Screening'), 'Hiring Manager Interview': 1 },
  'vac-2': { ...buildSnapshot(1, 'New') },
  'vac-3': buildSnapshot(0),
};

const baseAttentionSummaries: Record<string, VacancyAttentionSummary> = {
  'vac-1': { tone: 'steady', label: 'On track', detail: 'Updated recently' },
  'vac-2': { tone: 'watch', label: 'Stale pipeline', detail: '1 open candidate idle for 7+ days' },
  'vac-3': { tone: 'urgent', label: 'Needs scheduling', detail: '1 late-stage candidate without a next step' },
};

const baseQueueMetrics: VacancyQueueMetric[] = [
  { id: 'open', label: 'Open pipeline', value: 3, tone: 'steady' },
  { id: 'late-stage', label: 'Late stage', value: 1, tone: 'watch' },
  { id: 'needs-scheduling', label: 'Needs scheduling', value: 0, tone: 'steady' },
  { id: 'stale', label: 'Idle 7+ days', value: 0, tone: 'steady' },
];

const sourceOptions = ['LinkedIn', 'Referral', 'Inbound', 'Agency', 'Dribbble', 'Previous applicant'];

const defaultCandidateDraft = {
  name: '',
  source: 'LinkedIn' as const,
  stage: 'New' as CandidateStage,
  location: '',
  score: '70',
  nextInterview: '',
  summary: '',
};

type SetStateFn = React.Dispatch<React.SetStateAction<typeof defaultCandidateDraft>>;

function renderComponent(overrides: Partial<Parameters<typeof VacancyListPanel>[0]> = {}) {
  const props = {
    filteredVacancies: baseVacancies,
    vacancyFilter: 'all' as VacancyStatusFilter,
    setVacancyFilter: vi.fn(),
    vacancySort: 'attention' as VacancySortOption,
    setVacancySort: vi.fn(),
    selectedVacancyId: 'vac-1',
    handleVacancySelect: vi.fn(),
    vacancyStageSnapshots: baseStageSnapshots,
    candidateRecords: baseCandidates as { vacancyId: string }[],
    vacancyRecords: baseVacancies,
    filteredCandidateCount: 3,
    filteredQueueMetrics: baseQueueMetrics,
    vacancyAttentionSummaries: baseAttentionSummaries,
    savedVacancyViews: {
      'active-work': null as SavedVacancyView | null,
      'urgent-hiring': null as SavedVacancyView | null,
    },
    saveCurrentVacancyView: vi.fn(),
    applySavedVacancyView: vi.fn(),
    renameSavedVacancyView: vi.fn(),
    clearSavedVacancyView: vi.fn(),
    defaultVacancyViewSlot: null as SavedVacancyViewSlotId | null,
    setDefaultVacancyViewSlot: vi.fn(),
    candidateDraft: { ...defaultCandidateDraft },
    setCandidateDraft: vi.fn() as SetStateFn,
    sourceOptions,
    handleCandidateCreate: vi.fn(),
    ...overrides,
  };
  const result = render(<VacancyListPanel {...props} />);
  return { ...result, props };
}

describe('VacancyListPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('vacancy list', () => {
    it('renders all filtered vacancy titles', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.vacancy-card');
      expect(cards).toHaveLength(3);
      expect(cards[0].textContent).toContain('Senior Frontend Engineer');
      expect(cards[1].textContent).toContain('Technical Recruiter');
    });

    it('calls handleVacancySelect on card click', async () => {
      const { container, props } = renderComponent();
      const cards = container.querySelectorAll('.vacancy-card');
      await userEvent.click(cards[0]);
      expect(props.handleVacancySelect).toHaveBeenCalledWith('vac-1');
    });

    it('highlights the selected vacancy card', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.vacancy-card');
      expect(cards[0].className).toContain('selected');
    });

    it('shows empty state when no vacancies match', () => {
      const { container } = renderComponent({ filteredVacancies: [] });
      const list = container.querySelector('.vacancy-list')!;
      expect(list.textContent).toContain('No vacancies match this status view');
    });
  });

  describe('filter chips', () => {
    it('renders all four filter options', () => {
      const { container } = renderComponent();
      const btns = container.querySelectorAll('.vacancy-filters button');
      expect(btns).toHaveLength(4);
      expect(btns[0].textContent).toContain('All');
      expect(btns[1].textContent).toContain('Active');
      expect(btns[2].textContent).toContain('Paused');
      expect(btns[3].textContent).toContain('Closing Soon');
    });

    it('calls setVacancyFilter on click', async () => {
      const { container, props } = renderComponent();
      const btns = container.querySelectorAll('.vacancy-filters button');
      await userEvent.click(btns[1]); // Active
      expect(props.setVacancyFilter).toHaveBeenCalledWith('Active');
    });
  });

  describe('sort selector', () => {
    it('renders with current sort value', () => {
      const { container } = renderComponent();
      const select = container.querySelector<HTMLSelectElement>('.sort-field select')!;
      expect(select).toBeTruthy();
      expect(select.value).toBe('attention');
    });

    it('calls setVacancySort on change', async () => {
      const { container, props } = renderComponent();
      const select = container.querySelector<HTMLSelectElement>('.sort-field select')!;
      await userEvent.selectOptions(select, 'title');
      expect(props.setVacancySort).toHaveBeenCalledWith('title');
    });
  });

  describe('queue metrics', () => {
    it('renders metric pills with values', () => {
      const { container } = renderComponent();
      const metricArea = container.querySelector('[aria-label="Queue metrics for current vacancy view"]')!;
      expect(metricArea.textContent).toContain('Open pipeline');
      expect(metricArea.textContent).toContain('Late stage');
      expect(metricArea.textContent).toContain('3');
    });
  });

  describe('saved views section', () => {
    it('renders both saved view slots', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards).toHaveLength(2);
      expect(cards[0].textContent).toContain('Active work');
      expect(cards[1].textContent).toContain('Urgent hiring');
    });

    it('calls saveCurrentVacancyView when Save current clicked', async () => {
      const { container, props } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      const btns = cards[0].querySelectorAll('button');
      await userEvent.click(btns[1]); // Save current = 2nd button
      expect(props.saveCurrentVacancyView).toHaveBeenCalledWith('active-work');
    });

    it('disables Open and Clear when no view is saved', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      cards.forEach((card) => {
        const btns = card.querySelectorAll('button');
        expect((btns[0] as HTMLButtonElement).disabled).toBe(true);  // Open
        expect((btns[2] as HTMLButtonElement).disabled).toBe(true);  // Clear
      });
    });

    it('enables Open only for slot with saved view', () => {
      const savedView: SavedVacancyView = {
        slotId: 'active-work', label: 'Active work', description: 'Default view',
        vacancyFilter: 'Active', vacancySort: 'title', lastSavedAt: new Date().toISOString(),
      };
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const cards = container.querySelectorAll('.saved-view-card');
      const b1 = cards[0].querySelectorAll('button');
      const b2 = cards[1].querySelectorAll('button');
      expect((b1[0] as HTMLButtonElement).disabled).toBe(false);
      expect((b2[0] as HTMLButtonElement).disabled).toBe(true);
    });

    it('calls applySavedVacancyView when Open is clicked', async () => {
      const savedView: SavedVacancyView = {
        slotId: 'active-work', label: 'Active work', description: 'Default view',
        vacancyFilter: 'Active', vacancySort: 'title', lastSavedAt: new Date().toISOString(),
      };
      const { container, props } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const cards = container.querySelectorAll('.saved-view-card');
      const btns = cards[0].querySelectorAll('button');
      await userEvent.click(btns[0]); // Open
      expect(props.applySavedVacancyView).toHaveBeenCalledWith('active-work');
    });

    it('calls clearSavedVacancyView when Clear is clicked', async () => {
      const savedView: SavedVacancyView = {
        slotId: 'urgent-hiring', label: 'Urgent hiring', description: 'Fast view',
        vacancyFilter: 'Closing Soon', vacancySort: 'active-pipeline', lastSavedAt: new Date().toISOString(),
      };
      const { container, props } = renderComponent({
        savedVacancyViews: { 'active-work': null, 'urgent-hiring': savedView },
      });
      const cards = container.querySelectorAll('.saved-view-card');
      const btns = cards[1].querySelectorAll('button');
      await userEvent.click(btns[2]); // Clear
      expect(props.clearSavedVacancyView).toHaveBeenCalledWith('urgent-hiring');
    });

    it('calls renameSavedVacancyView on name input change', async () => {
      const savedView: SavedVacancyView = {
        slotId: 'active-work', label: 'Active work', description: 'Default view',
        vacancyFilter: 'Active', vacancySort: 'title', lastSavedAt: new Date().toISOString(),
      };
      const { container, props } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const inputs = container.querySelectorAll<HTMLInputElement>('.saved-view-name-field input');
      await userEvent.type(inputs[0], 'X');
      expect(props.renameSavedVacancyView).toHaveBeenCalled();
    });

    it('enables checkbox when view exists', () => {
      const savedView: SavedVacancyView = {
        slotId: 'active-work', label: 'Active work', description: 'Default view',
        vacancyFilter: 'Active', vacancySort: 'title', lastSavedAt: new Date().toISOString(),
      };
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const cbs = container.querySelectorAll<HTMLInputElement>('.saved-view-default-toggle input');
      expect(cbs[0].disabled).toBe(false);
      expect(cbs[1].disabled).toBe(true);
    });
  });

  describe('candidate creation form', () => {
    it('renders form fields', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.candidate-create-card')).toBeTruthy();
      expect(container.querySelector('input[placeholder="Candidate name"]')).toBeTruthy();
    });

    it('calls handleCandidateCreate on submit', async () => {
      const { container, props } = renderComponent({
        candidateDraft: { name: 'Test', source: 'LinkedIn', stage: 'New', location: 'TLV', score: '80', nextInterview: '', summary: 'Test' },
      });
      const submitBtn = container.querySelector('.candidate-create-card button[type="submit"]')!;
      await userEvent.click(submitBtn);
      expect(props.handleCandidateCreate).toHaveBeenCalledOnce();
    });
  });
});