import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PipelinePanel } from '../components/PipelinePanel';
import { candidates, vacancies } from '../data/mockData';
import { stageOrder } from '../constants';
import type { CandidateStage } from '../types';

function buildStageBuckets(vacancyId: string): Map<CandidateStage, Candidate[]> {
  const buckets = new Map<CandidateStage, Candidate[]>();
  for (const stage of stageOrder) {
    buckets.set(stage, []);
  }
  for (const c of candidates) {
    if (c.vacancyId === vacancyId) {
      buckets.get(c.currentStage)?.push(c);
    }
  }
  return buckets;
}

const baseVacancy = vacancies[0]; // vac-1: Senior Frontend Engineer
const vac1Candidates = candidates.filter((c) => c.vacancyId === 'vac-1');
const vac1StageBuckets = buildStageBuckets('vac-1');

const defaultCandidateDraft = {
  source: 'LinkedIn',
  location: 'Tel Aviv',
  score: '70',
  nextInterview: '',
  summary: '',
};

const defaultTimelineDraft = {
  type: 'feedback' as const,
  title: '',
  detail: '',
  date: '2026-05-10',
};

function renderComponent(overrides: Partial<Parameters<typeof PipelinePanel>[0]> = {}) {
  const props = {
    selectedVacancy: baseVacancy,
    vacancyCandidates: vac1Candidates,
    candidateSearch: '',
    setCandidateSearch: vi.fn(),
    stageBuckets: vac1StageBuckets,
    selectedCandidateId: 'cand-1',
    setSelectedCandidateId: vi.fn(),
    setSelectedStageDraft: vi.fn(),
    setIsEditingCandidate: vi.fn(),
    setCandidateEditDraft: vi.fn(),
    setTimelineDraft: vi.fn(),
    ...overrides,
  };
  const result = render(<PipelinePanel {...props} />);
  return { ...result, props };
}

describe('PipelinePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('vacancy header', () => {
    it('renders the selected vacancy title', () => {
      const { container } = renderComponent();
      const header = container.querySelector('.panel-header h2')!;
      expect(header.textContent).toBe('Senior Frontend Engineer');
    });

    it('renders team and pipeline description', () => {
      const { container } = renderComponent();
      const desc = container.querySelector('.panel-header p')!;
      expect(desc.textContent).toContain('Product Engineering');
      expect(desc.textContent).toContain('pipeline grouped by stage');
    });

    it('shows "No vacancy in this view" when no vacancy is selected', () => {
      const { container } = renderComponent({ selectedVacancy: undefined });
      const header = container.querySelector('.panel-header h2')!;
      expect(header.textContent).toBe('No vacancy in this view');
    });

    it('shows filter guidance when no vacancy is selected', () => {
      const { container } = renderComponent({ selectedVacancy: undefined });
      const desc = container.querySelector('.panel-header p')!;
      expect(desc.textContent).toContain('Adjust the vacancy status view');
    });

    it('shows a full-panel empty state when no vacancy is selected', () => {
      const { container } = renderComponent({ selectedVacancy: undefined });
      const pipeline = container.querySelector('.pipeline-columns');
      expect(pipeline).toBeFalsy();
      const emptyState = container.querySelector('.empty-state')!;
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('vacancy is currently selected');
      expect(emptyState.textContent).toContain('matching openings');
    });
  });

  describe('vacancy summary banner', () => {
    it('shows the owner and status', () => {
      const { container } = renderComponent();
      const banner = container.querySelector('.vacancy-summary-banner')!;
      expect(banner.textContent).toContain('Dana Levi');
      expect(banner.textContent).toContain('Active');
    });

    it('shows the active candidate count', () => {
      const { container } = renderComponent();
      const banner = container.querySelector('.vacancy-summary-banner')!;
      expect(banner.textContent).toContain('4 active candidate records');
    });
  });

  describe('pipeline columns', () => {
    it('renders all stage columns in order', () => {
      const { container } = renderComponent();
      const columns = container.querySelectorAll('.stage-column');
      expect(columns).toHaveLength(stageOrder.length);
      columns.forEach((col, i) => {
        expect(col.querySelector('.stage-header h3')!.textContent).toBe(stageOrder[i]);
      });
    });

    it('shows candidate counts in stage headers', () => {
      const { container } = renderComponent();
      const columns = container.querySelectorAll('.stage-column');
      // vac-1 candidates: Screening(1), Hiring Manager Interview(1), Offer(1), Rejected(1)
      expect(columns[1].querySelector('.stage-header span')!.textContent).toBe('1'); // Screening
      expect(columns[3].querySelector('.stage-header span')!.textContent).toBe('1'); // Hiring Manager
      expect(columns[5].querySelector('.stage-header span')!.textContent).toBe('1'); // Offer
      expect(columns[7].querySelector('.stage-header span')!.textContent).toBe('1'); // Rejected
    });

    it('shows zero for empty stages', () => {
      const { container } = renderComponent();
      const columns = container.querySelectorAll('.stage-column');
      expect(columns[0].querySelector('.stage-header span')!.textContent).toBe('0'); // New
      expect(columns[2].querySelector('.stage-header span')!.textContent).toBe('0'); // Recruiter
    });
  });

  describe('candidate cards', () => {
    it('renders candidate names in their stage columns', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.candidate-card');
      expect(cards).toHaveLength(4);
      expect(cards[0].textContent).toContain('Ariel Ben-David');
      expect(cards[0].textContent).toContain('78'); // score
      expect(cards[0].textContent).toContain('LinkedIn');
      expect(cards[0].textContent).toContain('2026-04-29');
      expect(cards[0].textContent).toContain('2026-05-02');
    });

    it('highlights the selected candidate card', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.candidate-card');
      // cand-1 is selected by default
      expect(cards[0].className).toContain('selected');
      expect(cards[1].className).not.toContain('selected');
    });

    it('highlights a different selected candidate', () => {
      const { container } = renderComponent({ selectedCandidateId: 'cand-2' });
      const cards = container.querySelectorAll('.candidate-card');
      expect(cards[0].className).not.toContain('selected');
      expect(cards[1].className).toContain('selected');
    });

    it('calls all click callbacks when a candidate card is clicked', async () => {
      const setSelectedCandidateId = vi.fn();
      const setSelectedStageDraft = vi.fn();
      const setIsEditingCandidate = vi.fn();
      const setCandidateEditDraft = vi.fn();
      const setTimelineDraft = vi.fn();

      const cand2 = candidates.find((c) => c.id === 'cand-2')!;

      const { container } = renderComponent({
        setSelectedCandidateId,
        setSelectedStageDraft,
        setIsEditingCandidate,
        setCandidateEditDraft,
        setTimelineDraft,
      });

      const cards = container.querySelectorAll('.candidate-card');
      await userEvent.click(cards[1]); // Click cand-2

      expect(setSelectedCandidateId).toHaveBeenCalledWith('cand-2');
      expect(setSelectedStageDraft).toHaveBeenCalledWith('Hiring Manager Interview');
      expect(setIsEditingCandidate).toHaveBeenCalledWith(false);
      expect(setCandidateEditDraft).toHaveBeenCalledWith({
        source: cand2.source,
        location: cand2.location,
        score: String(cand2.score),
        nextInterview: cand2.nextInterview ?? '',
        summary: cand2.summary,
      });
      expect(setTimelineDraft).toHaveBeenCalledWith({
        type: 'feedback',
        title: '',
        detail: '',
        date: cand2.lastActivityDate,
      });
    });
  });

  describe('empty stages', () => {
    it('shows empty state for stages without candidates', () => {
      const { container } = renderComponent();
      const columns = container.querySelectorAll('.stage-column');
      // New column (index 0) has no candidates
      const newColumn = columns[0];
      expect(newColumn.textContent).toContain('No candidates in this stage yet.');
    });

    it('does not show empty state for stages with candidates', () => {
      const { container } = renderComponent();
      const columns = container.querySelectorAll('.stage-column');
      // Screening column (index 1) has cand-1
      const screeningColumn = columns[1];
      expect(screeningColumn.textContent).not.toContain('No candidates in this stage yet.');
    });
  });

  describe('with different vacancy candidates', () => {
    it('renders vac-3 candidates (Closing Soon vacancy)', () => {
      const vac3 = vacancies[2]; // Product Designer
      const vac3Candidates = candidates.filter((c) => c.vacancyId === 'vac-3');
      const vac3Buckets = buildStageBuckets('vac-3');

      const { container } = renderComponent({
        selectedVacancy: vac3,
        vacancyCandidates: vac3Candidates,
        stageBuckets: vac3Buckets,
        selectedCandidateId: 'cand-8',
      });

      const header = container.querySelector('.panel-header h2')!;
      expect(header.textContent).toBe('Product Designer');

      const cards = container.querySelectorAll('.candidate-card');
      expect(cards).toHaveLength(3); // cand-8, cand-9, cand-10

      // cand-8 is at Panel / Final Interview — stage column[4]
      const stageColumns = container.querySelectorAll('.stage-column');
      const finalColumn = stageColumns[4];
      expect(finalColumn.textContent).toContain('Gal Peled');
      expect(finalColumn.textContent).toContain('Final Interview');
    });
  });

  describe('candidate search', () => {
    it('renders search input when candidates exist', () => {
      const { container } = renderComponent();
      const searchInput = container.querySelector('.pipeline-search-input');
      expect(searchInput).toBeTruthy();
    });

    it('does not render search when no candidates', () => {
      const emptyBuckets = buildStageBuckets('vac-999'); // no matches
      const { container } = renderComponent({
        vacancyCandidates: [],
        stageBuckets: emptyBuckets,
      });
      const searchInput = container.querySelector('.pipeline-search-input');
      expect(searchInput).toBeFalsy();
    });

    it('renders input with correct placeholder and aria-label', () => {
      const { container } = renderComponent();
      const searchInput = container.querySelector<HTMLInputElement>('.pipeline-search-input')!;
      expect(searchInput?.placeholder).toContain('Search');
      expect(searchInput?.getAttribute('aria-label')).toBe('Search candidates');
      expect(searchInput?.type).toBe('search');
    });

    it('shows clear button when candidateSearch has content via props', async () => {
      const setCandidateSearch = vi.fn();
      const { container } = renderComponent({
        setCandidateSearch,
        candidateSearch: 'filtered',
      });
      const clearBtn = container.querySelector('.pipeline-search-clear');
      expect(clearBtn).toBeTruthy();
      if (clearBtn) {
        const user = userEvent.setup();
        await user.click(clearBtn);
        expect(setCandidateSearch).toHaveBeenCalledWith('');
      }
    });
  });
});
