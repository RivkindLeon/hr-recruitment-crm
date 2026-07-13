import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavedViewsSection } from '../components/SavedViewsSection';
import { savedVacancyViewSlots } from '../constants';
import type { SavedVacancyView, SavedVacancyViewSlotId } from '../types';

function renderComponent(overrides: Partial<Parameters<typeof SavedViewsSection>[0]> = {}) {
  const props = {
    savedVacancyViews: {
      'active-work': null as SavedVacancyView | null,
      'urgent-hiring': null as SavedVacancyView | null,
    },
    vacancyFilter: 'all',
    vacancySort: 'attention',
    saveCurrentVacancyView: vi.fn(),
    applySavedVacancyView: vi.fn(),
    renameSavedVacancyView: vi.fn(),
    clearSavedVacancyView: vi.fn(),
    defaultVacancyViewSlot: null as SavedVacancyViewSlotId | null,
    setDefaultVacancyViewSlot: vi.fn(),
    ...overrides,
  };
  const result = render(<SavedViewsSection {...props} />);
  return { ...result, props };
}

const savedView: SavedVacancyView = {
  slotId: 'active-work',
  label: 'Active work',
  description: 'Default view',
  vacancyFilter: 'Active',
  vacancySort: 'title',
  lastSavedAt: new Date('2026-07-13T12:00:00Z').toISOString(),
};

const savedViewNoTimestamp: SavedVacancyView = {
  slotId: 'urgent-hiring',
  label: 'Urgent hiring',
  description: 'Fast view',
  vacancyFilter: 'Closing Soon',
  vacancySort: 'active-pipeline',
};

const savedViewCustomName: SavedVacancyView = {
  slotId: 'active-work',
  label: 'Active work',
  description: 'Custom view',
  vacancyFilter: 'Active',
  vacancySort: 'latest-activity',
  lastSavedAt: new Date('2026-07-13T08:00:00Z').toISOString(),
  customName: 'My View',
};

describe('SavedViewsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('section header', () => {
    it('renders the saved views section with header and strong description', () => {
      const { container } = renderComponent();
      const header = container.querySelector('.saved-view-section-header')!;
      expect(header.textContent).toContain('Saved views');
      expect(header.textContent).toContain('Return to your preferred filter + sort setup');
    });

    it('renders the local storage hint', () => {
      const { container } = renderComponent();
      const header = container.querySelector('.saved-view-section-header')!;
      expect(header.textContent).toContain('Saved locally for this browser');
    });
  });

  describe('view slot cards', () => {
    it('renders a card for each slot', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards).toHaveLength(savedVacancyViewSlots.length);
      expect(cards).toHaveLength(2);
    });

    it('uses slot label as heading when no saved view exists', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards[0].textContent).toContain('Active work');
      expect(cards[1].textContent).toContain('Urgent hiring');
    });

    it('shows slot description when no view is saved', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards[0].textContent).toContain(savedVacancyViewSlots[0].description);
      expect(cards[1].textContent).toContain(savedVacancyViewSlots[1].description);
    });

    it('shows filter and sort description when saved view exists', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards[0].textContent).toContain('Active');
      expect(cards[0].textContent).toContain('Title');
    });
  });

  describe('action buttons', () => {
    it('renders Save current, Open, and Clear buttons per card', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      cards.forEach((card, i) => {
        const btns = card.querySelectorAll('button');
        expect(btns).toHaveLength(3);
        expect(btns[0].textContent).toBe('Open');
        expect(btns[1].textContent).toBe('Save current');
        expect(btns[2].textContent).toBe('Clear');
      });
    });

    it('disables Open and Clear when no view is saved', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      cards.forEach((card) => {
        const btns = card.querySelectorAll('button');
        expect((btns[0] as HTMLButtonElement).disabled).toBe(true); // Open
        expect((btns[2] as HTMLButtonElement).disabled).toBe(true); // Clear
      });
    });

    it('enables Save current even when no view is saved', () => {
      const { container } = renderComponent();
      const cards = container.querySelectorAll('.saved-view-card');
      const btns = cards[0].querySelectorAll('button');
      expect((btns[1] as HTMLButtonElement).disabled).toBe(false); // Save current
    });

    it('calls saveCurrentVacancyView when Save current is clicked', async () => {
      const saveCurrentVacancyView = vi.fn();
      const { container } = renderComponent({ saveCurrentVacancyView });
      const cards = container.querySelectorAll('.saved-view-card');
      const btns = cards[0].querySelectorAll('button');
      await userEvent.click(btns[1]); // Save current
      expect(saveCurrentVacancyView).toHaveBeenCalledWith('active-work');
    });

    it('enables Open and Clear when a saved view exists', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const cards = container.querySelectorAll('.saved-view-card');
      const btns0 = cards[0].querySelectorAll('button');
      expect((btns0[0] as HTMLButtonElement).disabled).toBe(false); // Open
      expect((btns0[2] as HTMLButtonElement).disabled).toBe(false); // Clear
      const btns1 = cards[1].querySelectorAll('button');
      expect((btns1[0] as HTMLButtonElement).disabled).toBe(true); // Open still disabled
      expect((btns1[2] as HTMLButtonElement).disabled).toBe(true); // Clear still disabled
    });

    it('calls applySavedVacancyView when Open is clicked', async () => {
      const applySavedVacancyView = vi.fn();
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        applySavedVacancyView,
      });
      const cards = container.querySelectorAll('.saved-view-card');
      const btns = cards[0].querySelectorAll('button');
      await userEvent.click(btns[0]); // Open
      expect(applySavedVacancyView).toHaveBeenCalledWith('active-work');
    });

    it('calls clearSavedVacancyView when Clear is clicked', async () => {
      const clearSavedVacancyView = vi.fn();
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        clearSavedVacancyView,
      });
      const cards = container.querySelectorAll('.saved-view-card');
      const btns = cards[0].querySelectorAll('button');
      await userEvent.click(btns[2]); // Clear
      expect(clearSavedVacancyView).toHaveBeenCalledWith('active-work');
    });
  });

  describe('active view highlighting', () => {
    it('adds active class when filter and sort match the saved view', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        vacancyFilter: 'Active',
        vacancySort: 'title',
      });
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards[0].className).toContain('active');
    });

    it('does not add active class when filter differs', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        vacancyFilter: 'all',
        vacancySort: 'title',
      });
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards[0].className).not.toContain('active');
    });

    it('does not add active class when sort differs', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        vacancyFilter: 'Active',
        vacancySort: 'attention',
      });
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards[0].className).not.toContain('active');
    });
  });

  describe('view name input', () => {
    it('renders a disabled empty name input when no view is saved', () => {
      const { container } = renderComponent();
      const inputs = container.querySelectorAll<HTMLInputElement>('.saved-view-name-field input');
      expect(inputs).toHaveLength(2);
      expect(inputs[0].value).toBe('');
      expect(inputs[0].disabled).toBe(true);
    });

    it('shows the custom name when saved view has one', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedViewCustomName, 'urgent-hiring': null },
      });
      const inputs = container.querySelectorAll<HTMLInputElement>('.saved-view-name-field input');
      expect(inputs[0].value).toBe('My View');
      expect(inputs[0].disabled).toBe(false);
    });

    it('shows empty value when saved view has no custom name', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const inputs = container.querySelectorAll<HTMLInputElement>('.saved-view-name-field input');
      expect(inputs[0].value).toBe('');
    });

    it('calls renameSavedVacancyView on input change', async () => {
      const renameSavedVacancyView = vi.fn();
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        renameSavedVacancyView,
      });
      const inputs = container.querySelectorAll<HTMLInputElement>('.saved-view-name-field input');
      await userEvent.type(inputs[0], 'X');
      expect(renameSavedVacancyView).toHaveBeenCalledWith(
        'active-work',
        expect.stringContaining('X'),
      );
    });
  });

  describe('default toggle checkbox', () => {
    it('renders a disabled checkbox when no view is saved', () => {
      const { container } = renderComponent();
      const cbs = container.querySelectorAll<HTMLInputElement>('.saved-view-default-toggle input');
      expect(cbs).toHaveLength(2);
      expect(cbs[0].disabled).toBe(true);
      expect(cbs[0].checked).toBe(false);
    });

    it('enables checkbox when a saved view exists', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const cbs = container.querySelectorAll<HTMLInputElement>('.saved-view-default-toggle input');
      expect(cbs[0].disabled).toBe(false);
      expect(cbs[1].disabled).toBe(true); // other slot still empty
    });

    it('checks the checkbox when this slot is the default', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        defaultVacancyViewSlot: 'active-work',
      });
      const cbs = container.querySelectorAll<HTMLInputElement>('.saved-view-default-toggle input');
      expect(cbs[0].checked).toBe(true);
    });

    it('calls setDefaultVacancyViewSlot when checkbox is toggled on', async () => {
      const setDefaultVacancyViewSlot = vi.fn();
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        setDefaultVacancyViewSlot,
      });
      const cbs = container.querySelectorAll<HTMLInputElement>('.saved-view-default-toggle input');
      await userEvent.click(cbs[0]);
      expect(setDefaultVacancyViewSlot).toHaveBeenCalledWith('active-work');
    });

    it('calls setDefaultVacancyViewSlot(null) when checkbox is toggled off', async () => {
      const setDefaultVacancyViewSlot = vi.fn();
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
        defaultVacancyViewSlot: 'active-work',
        setDefaultVacancyViewSlot,
      });
      const cbs = container.querySelectorAll<HTMLInputElement>('.saved-view-default-toggle input');
      await userEvent.click(cbs[0]);
      expect(setDefaultVacancyViewSlot).toHaveBeenCalledWith(null);
    });
  });

  describe('timestamp display', () => {
    it('shows "Saved" text when lastSavedAt exists', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards[0].textContent).toMatch(/Saved/i);
    });

    it('does not show timestamp when lastSavedAt is absent', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'urgent-hiring': savedViewNoTimestamp, 'active-work': null },
      });
      const cards = container.querySelectorAll('.saved-view-card');
      expect(cards[0].textContent).not.toMatch(/Saved/i);
    });
  });

  describe('edge cases', () => {
    it('handles both slots having saved views', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': savedViewNoTimestamp },
      });
      const inputs = container.querySelectorAll<HTMLInputElement>('.saved-view-name-field input');
      expect(inputs[0].disabled).toBe(false);
      expect(inputs[1].disabled).toBe(false);
      const cbs = container.querySelectorAll<HTMLInputElement>('.saved-view-default-toggle input');
      expect(cbs[0].disabled).toBe(false);
      expect(cbs[1].disabled).toBe(false);
    });

    it('applies maxLength attribute to name input', () => {
      const { container } = renderComponent({
        savedVacancyViews: { 'active-work': savedView, 'urgent-hiring': null },
      });
      const inputs = container.querySelectorAll<HTMLInputElement>('.saved-view-name-field input');
      expect(inputs[0].maxLength).toBe(28);
    });
  });
});
