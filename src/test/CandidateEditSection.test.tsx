import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidateEditSection } from '../components/CandidateEditSection';
import type { Candidate } from '../types';

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

const candidateNoInterview: Candidate = {
  ...baseCandidate,
  nextInterview: undefined,
};

const sourceOptions = ['LinkedIn', 'Referral', 'Inbound', 'Agency', 'Previous applicant'];

const defaultEditDraft = {
  source: 'LinkedIn',
  location: 'Tel Aviv',
  score: '78',
  nextInterview: '2026-05-02 10:00',
  summary: 'Strong React and TypeScript background.',
};

function renderComponent(overrides: Partial<Parameters<typeof CandidateEditSection>[0]> = {}) {
  const props = {
    selectedCandidate: baseCandidate,
    selectedVacancyTitle: 'Senior Frontend Engineer',
    isEditingCandidate: false,
    setIsEditingCandidate: vi.fn(),
    candidateEditDraft: defaultEditDraft,
    setCandidateEditDraft: vi.fn(),
    sourceOptions,
    handleCandidateEdit: vi.fn((e) => e.preventDefault()),
    ...overrides,
  };
  const result = render(<CandidateEditSection {...props} />);
  return { ...result, props };
}

describe('CandidateEditSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('view mode', () => {
    it('renders the candidate summary card with header', () => {
      const { container } = renderComponent();
      const card = container.querySelector('.candidate-summary-card')!;
      expect(card).toBeTruthy();
      expect(card.textContent).toContain('Candidate details');
      expect(card.textContent).toContain('Update sourcing, score, location, and scheduling notes');
    });

    it('displays the candidate summary text', () => {
      const { container } = renderComponent();
      const summary = container.querySelector('.candidate-summary')!;
      expect(summary.textContent).toBe('Strong React and TypeScript background.');
    });

    it('displays the next interview text', () => {
      const { container } = renderComponent();
      const nextStep = container.querySelector('.candidate-next-step')!;
      expect(nextStep.textContent).toContain('2026-05-02 10:00');
    });

    it('shows "Not scheduled" when nextInterview is undefined', () => {
      const { container } = renderComponent({
        selectedCandidate: candidateNoInterview,
        candidateEditDraft: {
          ...defaultEditDraft,
          nextInterview: '',
        },
      });
      const nextStep = container.querySelector('.candidate-next-step')!;
      expect(nextStep.textContent).toContain('Not scheduled');
    });

    it('shows an "Edit candidate" button in view mode', () => {
      const { container } = renderComponent();
      const editButton = container.querySelector('[aria-label="Edit candidate"]')!;
      expect(editButton).toBeTruthy();
      expect(editButton.textContent).toBe('Edit candidate');
    });

    it('calls setIsEditingCandidate(true) when Edit button is clicked', async () => {
      const setIsEditingCandidate = vi.fn();
      const { container } = renderComponent({ setIsEditingCandidate });
      const editButton = container.querySelector('[aria-label="Edit candidate"]')!;
      await userEvent.click(editButton);
      expect(setIsEditingCandidate).toHaveBeenCalledWith(true);
    });
  });

  describe('edit mode', () => {
    it('renders the edit form with source select', () => {
      const { container } = renderComponent({ isEditingCandidate: true });
      const form = container.querySelector('.candidate-edit-form')!;
      expect(form).toBeTruthy();

      const sourceSelect = form.querySelector('select')!;
      expect(sourceSelect).toBeTruthy();
      const options = sourceSelect.querySelectorAll('option');
      expect(options).toHaveLength(sourceOptions.length);
      options.forEach((opt, i) => {
        expect(opt.textContent).toBe(sourceOptions[i]);
      });
    });

    it('renders score, location, nextInterview, and summary fields', () => {
      const { container } = renderComponent({ isEditingCandidate: true });
      const form = container.querySelector('.candidate-edit-form')!;
      const inputs = form.querySelectorAll('input');
      const textareas = form.querySelectorAll('textarea');

      // score input, location input, nextInterview input
      expect(inputs).toHaveLength(3);
      expect(textareas).toHaveLength(1);
    });

    it('shows "Cancel edit" button in edit mode', () => {
      const { container } = renderComponent({ isEditingCandidate: true });
      const cancelButton = container.querySelector('[aria-label="Cancel candidate edit"]')!;
      expect(cancelButton).toBeTruthy();
      expect(cancelButton.textContent).toBe('Cancel edit');
    });

    it('calls setIsEditingCandidate(false) and resets draft when Cancel is clicked', async () => {
      const setIsEditingCandidate = vi.fn();
      const setCandidateEditDraft = vi.fn();
      const { container } = renderComponent({
        isEditingCandidate: true,
        setIsEditingCandidate,
        setCandidateEditDraft,
      });
      const cancelButton = container.querySelector('[aria-label="Cancel candidate edit"]')!;
      await userEvent.click(cancelButton);

      expect(setCandidateEditDraft).toHaveBeenCalledWith({
        source: baseCandidate.source,
        location: baseCandidate.location,
        score: String(baseCandidate.score),
        nextInterview: baseCandidate.nextInterview ?? '',
        summary: baseCandidate.summary,
      });
      expect(setIsEditingCandidate).toHaveBeenCalledWith(false);
    });

    it('submits the form when "Save candidate updates" is clicked', async () => {
      const handleCandidateEdit = vi.fn((e) => e.preventDefault());
      const { container } = renderComponent({
        isEditingCandidate: true,
        handleCandidateEdit,
      });
      const saveButton = container.querySelector('button[type="submit"]')!;
      expect(saveButton.textContent).toBe('Save candidate updates');
      await userEvent.click(saveButton);
      expect(handleCandidateEdit).toHaveBeenCalled();
    });

    it('renders all source options in the select', () => {
      const { container } = renderComponent({ isEditingCandidate: true });
      const sourceSelect = container.querySelector('.candidate-edit-form select')!;
      const options = sourceSelect.querySelectorAll('option');
      expect(options).toHaveLength(sourceOptions.length);
      options.forEach((opt, i) => {
        expect(opt.textContent).toBe(sourceOptions[i]);
      });
    });
  });
});
