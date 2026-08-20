import { describe, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimelineFormFields } from '../components/TimelineFormFields';
import type { TimelineFormDraft } from '../types';

const baseDraft: TimelineFormDraft = {
  type: 'feedback',
  title: '',
  detail: '',
  date: '2026-05-10',
};

describe('TimelineFormFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders type select with all three options', () => {
    const setDraft = vi.fn();
    render(<TimelineFormFields draft={baseDraft} setDraft={setDraft} />);

    const select = screen.getByLabelText('Type') as HTMLSelectElement;
    expect(select).toBeTruthy();
    const options = Array.from(select.options);
    expect(options.map((o) => o.value)).toEqual(['feedback', 'interview', 'communication']);
  });

  it('displays the current type as selected', () => {
    const setDraft = vi.fn();
    const interviewDraft = { ...baseDraft, type: 'interview' };
    render(<TimelineFormFields draft={interviewDraft} setDraft={setDraft} />);

    const select = screen.getByLabelText('Type') as HTMLSelectElement;
    expect(select.value).toBe('interview');
  });

  it('renders date input with required attribute', () => {
    const setDraft = vi.fn();
    render(<TimelineFormFields draft={baseDraft} setDraft={setDraft} />);

    // The date input has no label but we can find it by its name attribute or context
    const inputs = document.querySelectorAll('input');
    const dateInput = Array.from(inputs).find((i) => i.type === 'date');
    expect(dateInput?.getAttribute('required')).not.toBeNull();
  });

  it('displays the current date value in the date input', () => {
    const setDraft = vi.fn();
    const specificDateDraft = { ...baseDraft, date: '2026-12-25' };
    render(<TimelineFormFields draft={specificDateDraft} setDraft={setDraft} />);

    const inputs = document.querySelectorAll('input');
    const dateInput = Array.from(inputs).find((i) => i.type === 'date');
    expect(dateInput?.value).toBe('2026-12-25');
  });

  it('renders title input with correct placeholder and required attribute', () => {
    const setDraft = vi.fn();
    render(<TimelineFormFields draft={baseDraft} setDraft={setDraft} />);

    const titleInput = screen.getByPlaceholderText('Manager debrief added') as HTMLInputElement;
    expect(titleInput.getAttribute('required')).not.toBeNull();
  });

  it('renders detail textarea with correct placeholder and required attribute', () => {
    const setDraft = vi.fn();
    render(<TimelineFormFields draft={baseDraft} setDraft={setDraft} />);

    const textarea = screen.getByPlaceholderText('Capture the key takeaway');
    expect(textarea).toBeTruthy();
  });

  it('updates type when select option changes', async () => {
    const setDraft = vi.fn();
    render(<TimelineFormFields draft={baseDraft} setDraft={setDraft} />);

    const select = screen.getByLabelText('Type') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'interview' } });

    expect(setDraft).toHaveBeenCalledOnce();
    const updater = setDraft.mock.calls[0][0] as Function;
    const updatedDraft = updater(baseDraft);
    expect(updatedDraft.type).toBe('interview');
    expect(updatedDraft.date).toBe(baseDraft.date);
    expect(updatedDraft.title).toBe(baseDraft.title);
  });

  it('updates date when date input changes', async () => {
    const setDraft = vi.fn();
    render(<TimelineFormFields draft={baseDraft} setDraft={setDraft} />);

    const inputs = document.querySelectorAll('input');
    const dateInput = Array.from(inputs).find((i) => i.type === 'date')!;
    fireEvent.change(dateInput, { target: { value: '2027-01-15' } });

    expect(setDraft).toHaveBeenCalledOnce();
    const updater = setDraft.mock.calls[0][0] as Function;
    const updatedDraft = updater(baseDraft);
    expect(updatedDraft.date).toBe('2027-01-15');
    expect(updatedDraft.type).toBe(baseDraft.type);
  });

  it('updates title when title input changes', async () => {
    const setDraft = vi.fn();
    render(<TimelineFormFields draft={baseDraft} setDraft={setDraft} />);

    const titleInput = screen.getByPlaceholderText('Manager debrief added') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'On-site feedback received' } });

    expect(setDraft).toHaveBeenCalledOnce();
    const updater = setDraft.mock.calls[0][0] as Function;
    const updatedDraft = updater(baseDraft);
    expect(updatedDraft.title).toBe('On-site feedback received');
  });

  it('updates detail when textarea changes', async () => {
    const setDraft = vi.fn();
    render(<TimelineFormFields draft={baseDraft} setDraft={setDraft} />);

    const textarea = screen.getByPlaceholderText('Capture the key takeaway') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Candidate showed strong problem-solving skills.' } });

    expect(setDraft).toHaveBeenCalledOnce();
    const updater = setDraft.mock.calls[0][0] as Function;
    const updatedDraft = updater(baseDraft);
    expect(updatedDraft.detail).toBe('Candidate showed strong problem-solving skills.');
  });

  it('preserves unchanged fields when updating one field', () => {
    const setDraft = vi.fn();
    const existingDraft: TimelineFormDraft = {
      type: 'feedback',
      title: 'Existing title',
      detail: 'Existing detail',
      date: '2026-05-10',
    };
    render(<TimelineFormFields draft={existingDraft} setDraft={setDraft} />);

    // Change only the title
    const titleInput = screen.getByPlaceholderText('Manager debrief added') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'New title' } });

    const updater = setDraft.mock.calls[0][0] as Function;
    const updatedDraft = updater(existingDraft);
    expect(updatedDraft.title).toBe('New title');
    // Other fields should be preserved via spread
    expect(updatedDraft.type).toBe('feedback');
    expect(updatedDraft.detail).toBe('Existing detail');
    expect(updatedDraft.date).toBe('2026-05-10');
  });
});
