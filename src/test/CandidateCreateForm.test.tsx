import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidateCreateForm } from '../components/CandidateCreateForm';
import { stageOrder } from '../constants';
import type { CandidateStage } from '../types';

const defaultDraft = {
  name: '',
  source: 'LinkedIn',
  stage: 'New' as CandidateStage,
  location: '',
  score: '70',
  nextInterview: '',
  summary: '',
};

const sourceOptions = [
  'LinkedIn',
  'Referral',
  'Inbound',
  'Agency',
  'Dribbble',
  'Previous applicant',
];

function renderComponent(overrides: Partial<Parameters<typeof CandidateCreateForm>[0]> = {}) {
  const props = {
    candidateDraft: { ...defaultDraft },
    setCandidateDraft: vi.fn() as React.Dispatch<React.SetStateAction<typeof defaultDraft>>,
    sourceOptions,
    handleCandidateCreate: vi.fn(),
    ...overrides,
  };
  const result = render(<CandidateCreateForm {...props} />);
  return { ...result, props };
}

describe('CandidateCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('form rendering', () => {
    it('renders the create form with header', () => {
      const { container } = renderComponent();
      const form = container.querySelector('.candidate-create-card')!;
      expect(form).toBeTruthy();
      expect(form.textContent).toContain('Add candidate');
      expect(form.textContent).toContain('Create a candidate in the selected vacancy');
    });

    it('renders all form fields', () => {
      const { container } = renderComponent();
      expect(container.querySelector('input[placeholder="Candidate name"]')).toBeTruthy();
      expect(container.querySelector('select')).toBeTruthy();
      expect(container.querySelector('input[placeholder="Tel Aviv"]')).toBeTruthy();
      expect(container.querySelector('input[type="number"]')).toBeTruthy();
      expect(container.querySelector('input[placeholder="Optional scheduling note"]')).toBeTruthy();
      expect(container.querySelector('textarea')).toBeTruthy();
    });

    it('renders the submit button', () => {
      const { container } = renderComponent();
      const btn = container.querySelector('button[type="submit"]');
      expect(btn).toBeTruthy();
      expect(btn!.textContent).toBe('Create candidate');
    });
  });

  describe('source select', () => {
    it('renders all source options', () => {
      const { container } = renderComponent();
      const select = container.querySelector('select')!;
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(sourceOptions.length);
      options.forEach((opt, i) => {
        expect(opt.textContent).toBe(sourceOptions[i]);
      });
    });

    it('defaults to the draft source value', () => {
      renderComponent();
      const select = screen.getByDisplayValue('LinkedIn');
      expect(select).toBeTruthy();
    });

    it('calls setCandidateDraft on source change', async () => {
      const setCandidateDraft = vi.fn();
      const { container } = renderComponent({ setCandidateDraft });
      const select = container.querySelector('select')!;
      await userEvent.selectOptions(select, 'Referral');
      expect(setCandidateDraft).toHaveBeenCalled();
    });
  });

  describe('stage select', () => {
    it('renders all pipeline stages', () => {
      const { container } = renderComponent();
      const selects = container.querySelectorAll('select');
      expect(selects).toHaveLength(2);
      const stageSelect = selects[1];
      const options = stageSelect.querySelectorAll('option');
      expect(options).toHaveLength(stageOrder.length);
      options.forEach((opt, i) => {
        expect(opt.textContent).toBe(stageOrder[i]);
      });
    });

    it('defaults to the draft stage value', () => {
      renderComponent();
      const stageSelect = screen.getByDisplayValue('New');
      expect(stageSelect).toBeTruthy();
    });
  });

  describe('form actions', () => {
    it('calls handleCandidateCreate on submit', async () => {
      const handleCandidateCreate = vi.fn();
      const { container } = renderComponent({ handleCandidateCreate });
      const form = container.querySelector('form')!;
      fireEvent.submit(form);
      expect(handleCandidateCreate).toHaveBeenCalledOnce();
    });

    it('marks name input as required', () => {
      const { container } = renderComponent();
      const input = container.querySelector('input[placeholder="Candidate name"]')!;
      expect(input).toHaveAttribute('required');
    });

    it('marks location input as required', () => {
      const { container } = renderComponent();
      const input = container.querySelector('input[placeholder="Tel Aviv"]')!;
      expect(input).toHaveAttribute('required');
    });

    it('marks score input as required', () => {
      const { container } = renderComponent();
      const input = container.querySelector('input[type="number"]')!;
      expect(input).toHaveAttribute('required');
    });

    it('marks summary textarea as required', () => {
      const { container } = renderComponent();
      const textarea = container.querySelector('textarea')!;
      expect(textarea).toHaveAttribute('required');
    });

    it('applies min/max attributes to score input', () => {
      const { container } = renderComponent();
      const input = container.querySelector('input[type="number"]')!;
      expect(input.getAttribute('min')).toBe('0');
      expect(input.getAttribute('max')).toBe('100');
    });

    it('sets textarea rows to 4', () => {
      const { container } = renderComponent();
      const textarea = container.querySelector('textarea')!;
      expect(textarea.getAttribute('rows')).toBe('4');
    });
  });

  describe('draft field values', () => {
    it('renders draft name value', () => {
      renderComponent({
        candidateDraft: { ...defaultDraft, name: 'Test' },
      });
      const input = screen.getByDisplayValue('Test');
      expect(input).toBeTruthy();
    });

    it('renders draft location value', () => {
      renderComponent({
        candidateDraft: { ...defaultDraft, location: 'Haifa' },
      });
      const input = screen.getByDisplayValue('Haifa');
      expect(input).toBeTruthy();
    });

    it('renders draft score value', () => {
      renderComponent({
        candidateDraft: { ...defaultDraft, score: '90' },
      });
      const input = screen.getByDisplayValue('90');
      expect(input).toBeTruthy();
    });

    it('renders draft next interview value', () => {
      renderComponent({
        candidateDraft: { ...defaultDraft, nextInterview: '2026-07-15 14:00' },
      });
      const input = screen.getByDisplayValue('2026-07-15 14:00');
      expect(input).toBeTruthy();
    });

    it('renders draft summary value', () => {
      renderComponent({
        candidateDraft: { ...defaultDraft, summary: 'Test candidate' },
      });
      const textarea = screen.getByDisplayValue('Test candidate');
      expect(textarea).toBeTruthy();
    });
  });
});
