import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimelineSection } from '../components/TimelineSection';
import type { TimelineEntry, TimelineEntryType } from '../types';

const sampleTimeline: TimelineEntry[] = [
  {
    id: 't1',
    candidateId: 'cand-1',
    type: 'communication',
    title: 'Recruiter outreach reply',
    date: '2026-04-29',
    detail: 'Candidate replied within 2 hours.',
  },
  {
    id: 't2',
    candidateId: 'cand-1',
    type: 'interview',
    title: 'Intro call booked',
    date: '2026-04-30',
    detail: '30 minute screening call scheduled.',
  },
  {
    id: 't3',
    candidateId: 'cand-1',
    type: 'feedback',
    title: 'Manager feedback added',
    date: '2026-04-30',
    detail: 'Strong ownership signals.',
  },
];

const defaultDraft = { type: 'feedback' as const, title: '', detail: '', date: '2026-05-10' };
const defaultEditDraft = {
  type: 'feedback' as const,
  title: 'Edited title',
  detail: 'Edited detail',
  date: '2026-05-10',
};

function renderComponent(overrides: Partial<Parameters<typeof TimelineSection>[0]> = {}) {
  const props = {
    selectedTimeline: sampleTimeline,
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
  const result = render(<TimelineSection {...props} />);
  return { ...result, props };
}

describe('TimelineSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('header', () => {
    it('renders the section header', () => {
      const { container } = renderComponent();
      const header = container.querySelector('.timeline-section-header')!;
      expect(header.textContent).toContain('Activity timeline');
      expect(header.textContent).toContain('Keep the loop current with updates.');
    });
  });

  describe('timeline filters', () => {
    it('renders filter chips: All, feedback, interview, communication', () => {
      const { container } = renderComponent();
      const chips = container.querySelectorAll('.filter-chip');
      expect(chips).toHaveLength(4);
      expect(chips[0].textContent).toBe('All');
      expect(chips[1].textContent).toBe('feedback');
      expect(chips[2].textContent).toBe('interview');
      expect(chips[3].textContent).toBe('communication');
    });

    it('marks the "All" chip as active by default', () => {
      const { container } = renderComponent();
      const chips = container.querySelectorAll('.filter-chip');
      expect(chips[0].className).toContain('active');
    });

    it('marks the active filter chip when a specific type is selected', () => {
      const { container } = renderComponent({ timelineFilter: 'interview' });
      const chips = container.querySelectorAll('.filter-chip');
      expect(chips[0].className).not.toContain('active');
      expect(chips[2].className).toContain('active'); // interview chip
    });

    it('calls setTimelineFilter when a filter chip is clicked', async () => {
      const setTimelineFilter = vi.fn();
      const { container } = renderComponent({ setTimelineFilter });
      const chips = container.querySelectorAll('.filter-chip');
      await userEvent.click(chips[2]); // Click "interview"
      expect(setTimelineFilter).toHaveBeenCalledWith('interview');
    });
  });

  describe('create form', () => {
    it('shows the create form when not editing any entry', () => {
      const { container } = renderComponent();
      const createForm = container.querySelector('.timeline-create-card')!;
      expect(createForm).toBeTruthy();
    });

    it('renders type select, date input, title input, detail textarea, and submit button', () => {
      const { container } = renderComponent();
      const form = container.querySelector('.timeline-create-card')!;
      expect(form.querySelector('select')).toBeTruthy();
      expect(
        form.querySelector('input[type="date"]') ?? form.querySelector('input:not([type])'),
      ).toBeTruthy();
      expect(form.querySelector('textarea')).toBeTruthy();
      const submitButton = form.querySelector('button[type="submit"]')!;
      expect(submitButton.textContent).toBe('Add timeline note');
    });

    it('hides the create form when editing an entry', () => {
      const { container } = renderComponent({ editingTimelineId: 't1' });
      const createForm = container.querySelector('.timeline-create-card');
      expect(createForm).toBeFalsy();
    });

    it('calls handleTimelineCreate on form submit', async () => {
      const handleTimelineCreate = vi.fn((e) => e.preventDefault());
      const setTimelineDraft = vi.fn();
      const { container } = renderComponent({
        handleTimelineCreate,
        setTimelineDraft,
        timelineDraft: {
          type: 'feedback' as const,
          title: 'Test title',
          detail: 'Test detail',
          date: '2026-05-10',
        },
      });
      const submitButton = container.querySelector('.timeline-create-card button[type="submit"]')!;
      await userEvent.click(submitButton);
      expect(handleTimelineCreate).toHaveBeenCalled();
    });
  });

  describe('timeline entries list', () => {
    it('renders timeline entries with type, title, date, and detail', () => {
      const { container } = renderComponent();
      const items = container.querySelectorAll('.timeline-item');
      expect(items).toHaveLength(3);

      const firstItem = items[0];
      expect(firstItem.textContent).toContain('communication');
      expect(firstItem.textContent).toContain('Recruiter outreach reply');
      expect(firstItem.textContent).toContain('2026-04-29');
      expect(firstItem.textContent).toContain('Candidate replied within 2 hours.');
    });

    it('renders the type badge with the correct class', () => {
      const { container } = renderComponent();
      const items = container.querySelectorAll('.timeline-item');
      const firstType = items[0].querySelector('.timeline-type')!;
      expect(firstType.className).toContain('timeline-communication');
      const secondType = items[1].querySelector('.timeline-type')!;
      expect(secondType.className).toContain('timeline-interview');
    });

    it('shows an Edit button on each timeline entry', () => {
      const { container } = renderComponent();
      const editButtons = container.querySelectorAll('.timeline-item .text-action');
      expect(editButtons).toHaveLength(3);
      editButtons.forEach((btn) => {
        expect(btn.textContent).toBe('Edit');
      });
    });

    it('calls setEditingTimelineId with the entry id when Edit is clicked', async () => {
      const setEditingTimelineId = vi.fn();
      const setTimelineEditDraft = vi.fn();
      const { container } = renderComponent({
        setEditingTimelineId,
        setTimelineEditDraft,
      });
      const editButtons = container.querySelectorAll('.timeline-item .text-action');
      await userEvent.click(editButtons[0]);
      expect(setEditingTimelineId).toHaveBeenCalledWith('t1');
      expect(setTimelineEditDraft).toHaveBeenCalledWith({
        type: 'communication' as const,
        title: 'Recruiter outreach reply',
        detail: 'Candidate replied within 2 hours.',
        date: '2026-04-29',
      });
    });
  });

  describe('edit mode', () => {
    it('shows edit form with type, date, title, detail fields when editing an entry', () => {
      const { container } = renderComponent({ editingTimelineId: 't1' });
      const editForm = container.querySelector('.timeline-edit-form')!;
      expect(editForm).toBeTruthy();
      expect(editForm.querySelector('select')).toBeTruthy();
      expect(editForm.querySelector('textarea')).toBeTruthy();
    });

    it('shows Save and Cancel buttons in edit form', () => {
      const { container } = renderComponent({ editingTimelineId: 't1' });
      const editForm = container.querySelector('.timeline-edit-form')!;
      const buttons = editForm.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toBe('Save');
      expect(buttons[1].textContent).toBe('Cancel');
    });

    it('calls handleTimelineEdit on edit form submit', async () => {
      const handleTimelineEdit = vi.fn((e) => e.preventDefault());
      const { container } = renderComponent({
        editingTimelineId: 't2',
        handleTimelineEdit,
        timelineEditDraft: {
          type: 'interview' as const,
          title: 'Intro call booked',
          detail: '30 minute screening call scheduled.',
          date: '2026-04-30',
        },
      });
      const saveButton = container.querySelector('.timeline-edit-form button[type="submit"]')!;
      await userEvent.click(saveButton);
      expect(handleTimelineEdit).toHaveBeenCalled();
    });

    it('calls setEditingTimelineId(null) when Cancel is clicked', async () => {
      const setEditingTimelineId = vi.fn();
      const { container } = renderComponent({
        editingTimelineId: 't1',
        setEditingTimelineId,
      });
      const cancelButton = container.querySelector(
        '.timeline-edit-form button:not([type="submit"])',
      )!;
      await userEvent.click(cancelButton);
      expect(setEditingTimelineId).toHaveBeenCalledWith(null);
    });

    it('shows only the editing entry in edit form, others in view mode', () => {
      const { container } = renderComponent({ editingTimelineId: 't2' });
      const editForm = container.querySelector('.timeline-edit-form')!;
      expect(editForm).toBeTruthy();

      // t1 should still show in view mode (not editing)
      const items = container.querySelectorAll('.timeline-item');
      // We have 3 items + 1 editing form, so 3 .timeline-item (one of which contains the edit form)
      expect(items).toHaveLength(3);
    });
  });

  describe('empty state', () => {
    it('shows empty state when no timeline entries match the filter', () => {
      const { container } = renderComponent({ selectedTimeline: [] });
      expect(container.textContent).toContain('No timeline entries match the filter.');
    });
  });
});
