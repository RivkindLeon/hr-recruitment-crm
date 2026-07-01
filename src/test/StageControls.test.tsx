import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StageControls } from '../components/StageControls';
import { stageOrder } from '../constants';
import type { Candidate, CandidateStage } from '../types';

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

const screeningIndex = stageOrder.indexOf('Screening'); // 1
const newIndex = stageOrder.indexOf('New'); // 0
const rejectedIndex = stageOrder.indexOf('Rejected'); // 7

function renderComponent(overrides: Partial<Parameters<typeof StageControls>[0]> = {}) {
  const props = {
    selectedCandidate: baseCandidate,
    selectedCandidateStageIndex: screeningIndex,
    effectiveSelectedStageDraft: 'Screening' as CandidateStage,
    selectedStageDraft: 'Screening' as CandidateStage,
    setSelectedStageDraft: vi.fn(),
    moveSelectedCandidateBy: vi.fn(),
    moveCandidateToStage: vi.fn(),
    ...overrides,
  };
  const result = render(<StageControls {...props} />);
  return { ...result, props };
}

describe('StageControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders the stage controls card with header', () => {
    const { container } = renderComponent();
    const card = container.querySelector('.stage-movement-card')!;
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Stage controls');
    expect(card.textContent).toContain('Move candidate through the pipeline');
  });

  describe('previous stage button', () => {
    it('is disabled when candidate is at the first stage (New)', () => {
      const { container } = renderComponent({
        selectedCandidateStageIndex: newIndex,
      });
      const buttons = container.querySelectorAll('.stage-action-button');
      const prevButton = buttons[0];
      expect(prevButton.textContent).toBe('Previous stage');
      expect((prevButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('is enabled when candidate is not at the first stage', () => {
      const { container } = renderComponent();
      const buttons = container.querySelectorAll('.stage-action-button');
      const prevButton = buttons[0];
      expect((prevButton as HTMLButtonElement).disabled).toBe(false);
    });

    it('calls moveSelectedCandidateBy(-1) when clicked', async () => {
      const moveSelectedCandidateBy = vi.fn();
      const { container } = renderComponent({ moveSelectedCandidateBy });
      const buttons = container.querySelectorAll('.stage-action-button');
      await userEvent.click(buttons[0]);
      expect(moveSelectedCandidateBy).toHaveBeenCalledWith(-1);
    });
  });

  describe('next stage button', () => {
    it('is disabled when candidate is at the last stage (Rejected)', () => {
      const { container } = renderComponent({
        selectedCandidateStageIndex: rejectedIndex,
      });
      const buttons = container.querySelectorAll('.stage-action-button');
      const nextButton = buttons[1];
      expect(nextButton.textContent).toBe('Next stage');
      expect((nextButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('is disabled when stage index is -1', () => {
      const { container } = renderComponent({
        selectedCandidateStageIndex: -1,
      });
      const buttons = container.querySelectorAll('.stage-action-button');
      const nextButton = buttons[1];
      expect((nextButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('is enabled when candidate is not at the last stage', () => {
      const { container } = renderComponent();
      const buttons = container.querySelectorAll('.stage-action-button');
      const nextButton = buttons[1];
      expect((nextButton as HTMLButtonElement).disabled).toBe(false);
    });

    it('calls moveSelectedCandidateBy(1) when clicked', async () => {
      const moveSelectedCandidateBy = vi.fn();
      const { container } = renderComponent({ moveSelectedCandidateBy });
      const buttons = container.querySelectorAll('.stage-action-button');
      await userEvent.click(buttons[1]);
      expect(moveSelectedCandidateBy).toHaveBeenCalledWith(1);
    });
  });

  describe('stage picker', () => {
    it('renders all stage options in the select', () => {
      const { container } = renderComponent();
      const select = container.querySelector('.stage-picker-field select')!;
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(stageOrder.length);
      options.forEach((opt, i) => {
        expect(opt.textContent).toBe(stageOrder[i]);
      });
    });

    it('calls setSelectedStageDraft when a different stage is selected', async () => {
      const setSelectedStageDraft = vi.fn();
      const { container } = renderComponent({ setSelectedStageDraft });
      const select = container.querySelector('.stage-picker-field select')!;
      await userEvent.selectOptions(select, 'Offer');
      expect(setSelectedStageDraft).toHaveBeenCalledWith('Offer');
    });

    it('disables Apply stage button when stage equals current candidate stage', () => {
      const { container } = renderComponent({
        effectiveSelectedStageDraft: 'Screening' as CandidateStage,
      });
      const applyButton = container.querySelector('.stage-picker-row .stage-action-button')!;
      expect((applyButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('enables Apply stage button when stage differs from current candidate stage', () => {
      const { container } = renderComponent({
        effectiveSelectedStageDraft: 'Offer' as CandidateStage,
      });
      const applyButton = container.querySelector('.stage-picker-row .stage-action-button')!;
      expect((applyButton as HTMLButtonElement).disabled).toBe(false);
    });

    it('calls moveCandidateToStage with candidate id and draft stage when clicked', async () => {
      const moveCandidateToStage = vi.fn();
      const { container } = renderComponent({
        effectiveSelectedStageDraft: 'Offer' as CandidateStage,
        moveCandidateToStage,
      });
      const applyButton = container.querySelector('.stage-picker-row .stage-action-button')!;
      await userEvent.click(applyButton);
      expect(moveCandidateToStage).toHaveBeenCalledWith('cand-1', 'Offer');
    });
  });
});
