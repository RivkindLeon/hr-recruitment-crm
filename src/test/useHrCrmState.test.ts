import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHrCrmState } from '../hooks/useHrCrmState';
import { vacancies, candidates, timelineEntries } from '../data/mockData';
import type { SavedVacancyViewSlotId } from '../types';

function renderState() {
  return renderHook(() => useHrCrmState(vacancies, candidates, timelineEntries));
}

describe('useHrCrmState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('loads vacancies, candidates, and timeline from input', () => {
      const { result } = renderState();
      expect(result.current.vacancyRecords).toHaveLength(3);
      expect(result.current.candidateRecords).toHaveLength(10);
      expect(result.current.timelineRecords).toHaveLength(12);
    });

    it('selects the first vacancy by default', () => {
      const { result } = renderState();
      expect(result.current.selectedVacancyId).toBe('vac-1');
      expect(result.current.selectedVacancy?.title).toBe('Senior Frontend Engineer');
    });

    it('selects the first candidate of the first vacancy', () => {
      const { result } = renderState();
      expect(result.current.selectedCandidateId).toBe('cand-1');
      expect(result.current.selectedCandidate?.name).toBe('Ariel Ben-David');
    });

    it('initializes vacancy filter to all and sort to attention', () => {
      const { result } = renderState();
      expect(result.current.vacancyFilter).toBe('all');
      expect(result.current.vacancySort).toBe('attention');
    });

    it('starts with no saved views', () => {
      const { result } = renderState();
      expect(result.current.savedVacancyViews['active-work']).toBeNull();
      expect(result.current.savedVacancyViews['urgent-hiring']).toBeNull();
      expect(result.current.defaultVacancyViewSlot).toBeNull();
    });
  });

  describe('vacancy selection', () => {
    it('switches vacancy and selects its first candidate', () => {
      const { result } = renderState();
      act(() => result.current.handleVacancySelect('vac-2'));
      expect(result.current.selectedVacancyId).toBe('vac-2');
      expect(result.current.selectedCandidateId).toBe('cand-5');
      expect(result.current.selectedCandidate?.name).toBe('Yael Hacohen');
    });

    it('resets candidate edit and timeline state on vacancy switch', () => {
      const { result } = renderState();
      act(() => result.current.setIsEditingCandidate(true));
      act(() => result.current.setTimelineDraft({ type: 'feedback', title: 't', detail: 'd', date: '2026-05-10' }));
      act(() => result.current.handleVacancySelect('vac-2'));
      expect(result.current.isEditingCandidate).toBe(false);
      expect(result.current.timelineDraft).toEqual({ type: 'feedback', title: '', detail: '', date: '2026-05-10' });
    });
  });

  describe('candidate stage movement', () => {
    it('moves candidate forward one stage', () => {
      const { result } = renderState();
      act(() => result.current.moveSelectedCandidateBy(1));
      const moved = result.current.candidateRecords.find((c) => c.id === 'cand-1');
      expect(moved?.currentStage).toBe('Recruiter Interview');
      expect(moved?.lastActivityDate).toBe('2026-05-10');
    });

    it('moves candidate backward one stage', () => {
      const { result } = renderState();
      act(() => result.current.handleVacancySelect('vac-2'));
      act(() => result.current.moveSelectedCandidateBy(1)); // cand-5: New -> Screening
      const moved = result.current.candidateRecords.find((c) => c.id === 'cand-5');
      expect(moved?.currentStage).toBe('Screening');
    });

    it('does not move past the first or last stage', () => {
      const { result } = renderState();
      act(() => result.current.moveSelectedCandidateBy(-1)); // cand-1 is at Screening, can go back to New
      expect(result.current.candidateRecords.find((c) => c.id === 'cand-1')?.currentStage).toBe('New');

      act(() => result.current.moveSelectedCandidateBy(-1)); // Already at New, should not change
      expect(result.current.candidateRecords.find((c) => c.id === 'cand-1')?.currentStage).toBe('New');
    });

    it('moveCandidateToStage moves to exact stage', () => {
      const { result } = renderState();
      act(() => result.current.moveCandidateToStage('cand-1', 'Offer'));
      expect(result.current.candidateRecords.find((c) => c.id === 'cand-1')?.currentStage).toBe('Offer');
    });
  });

  describe('candidate creation', () => {
    it('creates a candidate with form data', () => {
      const { result } = renderState();
      act(() => result.current.setCandidateDraft({
        name: 'New Test',
        stage: 'New',
        source: 'LinkedIn',
        location: 'Tel Aviv',
        score: '85',
        nextInterview: '',
        summary: 'Test candidate',
      }));
      act(() => {
        const e = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
        result.current.handleCandidateCreate(e);
      });
      const newCandidate = result.current.candidateRecords.find((c) => c.name === 'New Test');
      expect(newCandidate).toBeDefined();
      expect(newCandidate?.currentStage).toBe('New');
      expect(newCandidate?.vacancyId).toBe('vac-1');
      expect(result.current.selectedCandidateId).toBe(newCandidate!.id);
    });

    it('does not create candidate with empty name', () => {
      const { result } = renderState();
      const initialCount = result.current.candidateRecords.length;
      act(() => result.current.setCandidateDraft({
        name: '',
        stage: 'New',
        source: 'LinkedIn',
        location: 'Tel Aviv',
        score: '85',
        nextInterview: '',
        summary: 'Test',
      }));
      act(() => {
        const e = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
        result.current.handleCandidateCreate(e);
      });
      expect(result.current.candidateRecords).toHaveLength(initialCount);
    });
  });

  describe('candidate editing', () => {
    it('updates candidate fields on edit', () => {
      const { result } = renderState();
      act(() => result.current.setIsEditingCandidate(true));
      act(() => result.current.setCandidateEditDraft((d) => ({ ...d, source: 'Referral', score: '95', location: 'Haifa' })));
      act(() => {
        const e = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
        result.current.handleCandidateEdit(e);
      });
      const updated = result.current.candidateRecords.find((c) => c.id === 'cand-1');
      expect(updated?.source).toBe('Referral');
      expect(updated?.score).toBe(95);
      expect(updated?.location).toBe('Haifa');
    });
  });

  describe('vacancy editing', () => {
    it('updates vacancy fields on edit', () => {
      const { result } = renderState();
      act(() => result.current.setIsEditingVacancy(true));
      act(() => result.current.setVacancyEditDraft((d) => ({ ...d, title: 'Updated Title', status: 'Paused' })));
      act(() => {
        const e = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
        result.current.handleVacancyEdit(e);
      });
      const updated = result.current.vacancyRecords.find((v) => v.id === 'vac-1');
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe('Paused');
    });
  });

  describe('timeline operations', () => {
    it('creates a timeline entry', () => {
      const { result } = renderState();
      const initialCount = result.current.timelineRecords.length;
      act(() => result.current.setTimelineDraft({
        type: 'interview',
        title: 'Test interview',
        detail: 'Went well',
        date: '2026-05-10',
      }));
      act(() => {
        const e = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
        result.current.handleTimelineCreate(e);
      });
      expect(result.current.timelineRecords).toHaveLength(initialCount + 1);
      const newEntry = result.current.timelineRecords.find((t) => t.title === 'Test interview');
      expect(newEntry).toBeDefined();
      expect(newEntry?.candidateId).toBe('cand-1');
    });
  });

  describe('vacancy filter and sort', () => {
    it('filters vacancies by status', () => {
      const { result } = renderState();
      act(() => result.current.setVacancyFilter('Closing Soon'));
      expect(result.current.filteredVacancies).toHaveLength(1);
      expect(result.current.filteredVacancies[0].title).toBe('Product Designer');
    });

    it('sorts vacancies by title', () => {
      const { result } = renderState();
      act(() => result.current.setVacancySort('title'));
      expect(result.current.filteredVacancies[0].title).toBe('Product Designer');
      expect(result.current.filteredVacancies[2].title).toBe('Technical Recruiter');
    });

    it('auto-selects first visible vacancy when current selection is filtered out', () => {
      const { result } = renderState();
      act(() => result.current.handleVacancySelect('vac-1'));
      act(() => result.current.setVacancyFilter('Closing Soon'));
      // vac-1 is Active, so filtered out -> should auto-select vac-3
      expect(result.current.selectedVacancyId).toBe('vac-3');
    });
  });

  describe('saved vacancy views', () => {
    it('saves current filter and sort to a slot', () => {
      const { result } = renderState();
      act(() => result.current.setVacancyFilter('Active'));
      act(() => result.current.setVacancySort('title'));
      act(() => result.current.saveCurrentVacancyView('active-work'));
      const savedView = result.current.savedVacancyViews['active-work'];
      expect(savedView).not.toBeNull();
      expect(savedView!.vacancyFilter).toBe('Active');
      expect(savedView!.vacancySort).toBe('title');
      expect(savedView!.slotId).toBe('active-work');
      expect(savedView!.lastSavedAt).toBeDefined();
    });

    it('applies a saved view filter and sort', () => {
      const { result } = renderState();
      // Save active-work with Closing Soon + title
      act(() => result.current.setVacancyFilter('Closing Soon'));
      act(() => result.current.setVacancySort('title'));
      act(() => result.current.saveCurrentVacancyView('active-work'));

      // Change to something else
      act(() => result.current.setVacancyFilter('all'));
      act(() => result.current.setVacancySort('attention'));

      // Apply the saved view
      act(() => result.current.applySavedVacancyView('active-work'));
      expect(result.current.vacancyFilter).toBe('Closing Soon');
      expect(result.current.vacancySort).toBe('title');
    });

    it('renames a saved view', () => {
      const { result } = renderState();
      act(() => result.current.saveCurrentVacancyView('active-work'));
      act(() => result.current.renameSavedVacancyView('active-work', 'My Custom View'));
      expect(result.current.savedVacancyViews['active-work']?.customName).toBe('My Custom View');
    });

    it('clears a saved view and associated default', () => {
      const { result } = renderState();
      act(() => result.current.saveCurrentVacancyView('urgent-hiring'));
      act(() => result.current.setDefaultVacancyViewSlot('urgent-hiring'));
      act(() => result.current.clearSavedVacancyView('urgent-hiring'));
      expect(result.current.savedVacancyViews['urgent-hiring']).toBeNull();
      expect(result.current.defaultVacancyViewSlot).toBeNull();
    });

    it('sets and clears default vacancy view slot', () => {
      const { result } = renderState();
      act(() => result.current.saveCurrentVacancyView('active-work'));
      act(() => result.current.setDefaultVacancyViewSlot('active-work'));
      expect(result.current.defaultVacancyViewSlot).toBe('active-work');
      act(() => result.current.setDefaultVacancyViewSlot(null));
      expect(result.current.defaultVacancyViewSlot).toBeNull();
    });

    it('persists saved views to localStorage', () => {
      const { result } = renderState();
      act(() => result.current.setVacancyFilter('Active'));
      act(() => result.current.saveCurrentVacancyView('active-work'));
      const stored = JSON.parse(localStorage.getItem('hr-recruitment-crm:saved-vacancy-views') || '{}');
      expect(stored['active-work'].vacancyFilter).toBe('Active');
    });
  });

  describe('timeline filter', () => {
    it('filters timeline by type', () => {
      const { result } = renderState();
      const allCount = result.current.selectedTimeline.length;
      act(() => result.current.setTimelineFilter('interview'));
      expect(result.current.selectedTimeline.length).toBeLessThan(allCount);
      result.current.selectedTimeline.forEach((entry) => {
        expect(entry.type).toBe('interview');
      });
    });
  });

  describe('computed values', () => {
    it('computes filteredCandidateCount', () => {
      const { result } = renderState();
      expect(result.current.filteredCandidateCount).toBe(10); // all vacancies shown
      act(() => result.current.setVacancyFilter('Closing Soon'));
      expect(result.current.filteredCandidateCount).toBeGreaterThan(0); // vac-3 candidates
    });

    it('computes vacancyAttentionSummaries', () => {
      const { result } = renderState();
      expect(Object.keys(result.current.vacancyAttentionSummaries)).toHaveLength(3);
    });

    it('computes vacancyStageSnapshots', () => {
      const { result } = renderState();
      expect(result.current.vacancyStageSnapshots['vac-1']['Screening']).toBe(1);
    });
  });
});