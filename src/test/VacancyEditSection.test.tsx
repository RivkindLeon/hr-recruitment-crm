import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VacancyEditSection } from '../components/VacancyEditSection';
import type { Vacancy, VacancyStatus } from '../types';

const baseVacancy: Vacancy = {
  id: 'vac-1',
  title: 'Senior Frontend Engineer',
  team: 'Product Engineering',
  owner: 'Dana Levi',
  status: 'Active',
};

const defaultEditDraft = {
  title: 'Senior Frontend Engineer',
  team: 'Product Engineering',
  owner: 'Dana Levi',
  status: 'Active' as VacancyStatus,
};

function renderComponent(overrides: Partial<Parameters<typeof VacancyEditSection>[0]> = {}) {
  const props = {
    selectedVacancy: baseVacancy,
    isEditingVacancy: false,
    setIsEditingVacancy: vi.fn(),
    vacancyEditDraft: { ...defaultEditDraft },
    setVacancyEditDraft: vi.fn() as React.Dispatch<React.SetStateAction<typeof defaultEditDraft>>,
    vacancyCandidatesCount: 5,
    handleVacancyEdit: vi.fn(),
    ...overrides,
  };
  const result = render(<VacancyEditSection {...props} />);
  return { ...result, props };
}

describe('VacancyEditSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('view mode', () => {
    it('renders the section with header and action button', () => {
      const { container } = renderComponent();
      const card = container.querySelector('.candidate-summary-card')!;
      expect(card).toBeTruthy();
      expect(card.textContent).toContain('Vacancy details');
      expect(card.textContent).toContain(
        'Adjust title, owner, team, or status without leaving the hiring view',
      );
    });

    it('shows edit vacancy button with correct label', () => {
      const { container } = renderComponent();
      const editBtn = container.querySelector('[aria-label="Edit vacancy"]');
      expect(editBtn).toBeTruthy();
      expect(editBtn!.textContent).toBe('Edit vacancy');
    });

    it('shows vacancy detail summaries (team, owner, status, pipeline size)', () => {
      const { container } = renderComponent();
      const detail = container.querySelector('.vacancy-detail-summary')!;
      expect(detail).toBeTruthy();
      expect(detail.textContent).toContain('Product Engineering');
      expect(detail.textContent).toContain('Dana Levi');
      expect(detail.textContent).toContain('Active');
      expect(detail.textContent).toContain('5 candidates');
    });

    it('does not render the edit form in view mode', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.candidate-edit-form')).toBeNull();
    });
  });

  describe('edit mode', () => {
    it('renders the edit form when isEditingVacancy is true', () => {
      const { container } = renderComponent({ isEditingVacancy: true });
      expect(container.querySelector('.candidate-edit-form')).toBeTruthy();
    });

    it('renders form fields for title, team, owner, and status', () => {
      const { container } = renderComponent({ isEditingVacancy: true });
      expect(container.querySelector('.candidate-edit-form input')).toBeTruthy();
      const allInputs = container.querySelectorAll('.candidate-edit-form input');
      expect(allInputs).toHaveLength(3); // title, team, owner
      const allSelects = container.querySelectorAll('.candidate-edit-form select');
      expect(allSelects).toHaveLength(1); // status
    });

    it('shows cancel and save buttons', () => {
      const { container } = renderComponent({ isEditingVacancy: true });
      const cancelBtn = container.querySelector('[aria-label="Cancel vacancy edit"]');
      expect(cancelBtn).toBeTruthy();
      expect(cancelBtn!.textContent).toBe('Cancel edit');
      const submitBtn = container.querySelector('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
      expect(submitBtn!.textContent).toBe('Save vacancy updates');
    });

    it('populates form fields with draft values', () => {
      const { container } = renderComponent({
        isEditingVacancy: true,
        vacancyEditDraft: {
          title: 'Senior Frontend Engineer',
          team: 'Product Engineering',
          owner: 'Dana Levi',
          status: 'Active',
        },
      });
      const inputs = container.querySelectorAll('.candidate-edit-form input');
      expect((inputs[0] as HTMLInputElement).value).toBe('Senior Frontend Engineer');
      expect((inputs[1] as HTMLInputElement).value).toBe('Product Engineering');
      expect((inputs[2] as HTMLInputElement).value).toBe('Dana Levi');
    });

    it('renders all three status options', () => {
      const { container } = renderComponent({ isEditingVacancy: true });
      const select = container.querySelector('.candidate-edit-form select')!;
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(3);
      expect(options[0].textContent).toBe('Active');
      expect(options[1].textContent).toBe('Paused');
      expect(options[2].textContent).toBe('Closing Soon');
    });

    it('does not render the detail summary in edit mode', () => {
      const { container } = renderComponent({ isEditingVacancy: true });
      expect(container.querySelector('.vacancy-detail-summary')).toBeNull();
    });
  });

  describe('toggle behavior', () => {
    it('calls setIsEditingVacancy when Edit vacancy is clicked', async () => {
      const setIsEditingVacancy = vi.fn();
      const { container } = renderComponent({ setIsEditingVacancy });
      const editBtn = container.querySelector('[aria-label="Edit vacancy"]')!;
      await userEvent.click(editBtn);
      expect(setIsEditingVacancy).toHaveBeenCalledWith(true);
    });

    it('calls setIsEditingVacancy(false) and resets draft when Cancel is clicked', async () => {
      const setIsEditingVacancy = vi.fn();
      const setVacancyEditDraft = vi.fn();
      const { container } = renderComponent({
        isEditingVacancy: true,
        setIsEditingVacancy,
        setVacancyEditDraft,
      });
      const cancelBtn = container.querySelector('[aria-label="Cancel vacancy edit"]')!;
      await userEvent.click(cancelBtn);
      expect(setVacancyEditDraft).toHaveBeenCalledWith({
        title: 'Senior Frontend Engineer',
        team: 'Product Engineering',
        owner: 'Dana Levi',
        status: 'Active',
      });
      expect(setIsEditingVacancy).toHaveBeenCalledWith(false);
    });
  });

  describe('form submission', () => {
    it('calls handleVacancyEdit on form submit', async () => {
      const handleVacancyEdit = vi.fn();
      const { container } = renderComponent({
        isEditingVacancy: true,
        handleVacancyEdit,
      });
      const submitBtn = container.querySelector('button[type="submit"]')!;
      await userEvent.click(submitBtn);
      expect(handleVacancyEdit).toHaveBeenCalledOnce();
    });
  });
});
