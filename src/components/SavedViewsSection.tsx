import type { SavedVacancyView, SavedVacancyViewSlotId } from '../types';
import { savedVacancyViewSlots } from '../constants';
import { getFilterLabel, getSortLabel, formatLastSaved } from '../utils';

interface SavedViewsSectionProps {
  savedVacancyViews: Record<SavedVacancyViewSlotId, SavedVacancyView | null>;
  vacancyFilter: string;
  vacancySort: string;
  saveCurrentVacancyView: (slotId: SavedVacancyViewSlotId) => void;
  applySavedVacancyView: (slotId: SavedVacancyViewSlotId) => void;
  renameSavedVacancyView: (slotId: SavedVacancyViewSlotId, customName: string) => void;
  clearSavedVacancyView: (slotId: SavedVacancyViewSlotId) => void;
  defaultVacancyViewSlot: SavedVacancyViewSlotId | null;
  setDefaultVacancyViewSlot: (slot: SavedVacancyViewSlotId | null) => void;
}

export function SavedViewsSection({
  savedVacancyViews,
  vacancyFilter,
  vacancySort,
  saveCurrentVacancyView,
  applySavedVacancyView,
  renameSavedVacancyView,
  clearSavedVacancyView,
  defaultVacancyViewSlot,
  setDefaultVacancyViewSlot,
}: SavedViewsSectionProps) {
  return (
    <div className="saved-view-section">
      <div className="saved-view-section-header">
        <div>
          <span className="detail-label">Saved views</span>
          <strong>Return to your preferred filter + sort setup</strong>
        </div>
        <span>Saved locally for this browser</span>
      </div>

      <div className="saved-view-list">
        {savedVacancyViewSlots.map((slot) => {
          const savedView = savedVacancyViews[slot.id];
          const isActiveView =
            savedView?.vacancyFilter === vacancyFilter && savedView?.vacancySort === vacancySort;

          return (
            <div key={slot.id} className={`saved-view-card ${isActiveView ? 'active' : ''}`}>
              <div>
                <strong>{savedView?.customName || slot.label}</strong>
                {savedView?.lastSavedAt && (
                  <span className="saved-view-timestamp">
                    Saved {formatLastSaved(savedView.lastSavedAt)}
                  </span>
                )}
                <p>
                  {savedView
                    ? `${getFilterLabel(savedView.vacancyFilter)} • ${getSortLabel(savedView.vacancySort)}`
                    : slot.description}
                </p>
                <label className="saved-view-name-field">
                  <span>View name</span>
                  <input
                    type="text"
                    value={savedView?.customName ?? ''}
                    onChange={(e) => renameSavedVacancyView(slot.id, e.target.value)}
                    placeholder={slot.label}
                    disabled={!savedView}
                    maxLength={28}
                  />
                </label>
                <label className="saved-view-default-toggle">
                  <input
                    type="checkbox"
                    checked={defaultVacancyViewSlot === slot.id}
                    onChange={(e) => setDefaultVacancyViewSlot(e.target.checked ? slot.id : null)}
                    disabled={!savedView}
                  />
                  <span>Open by default on load</span>
                </label>
              </div>
              <div className="saved-view-actions">
                <button
                  type="button"
                  className="stage-action-button"
                  onClick={() => applySavedVacancyView(slot.id)}
                  disabled={!savedView}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="stage-action-button primary"
                  onClick={() => saveCurrentVacancyView(slot.id)}
                >
                  Save current
                </button>
                <button
                  type="button"
                  className="stage-action-button"
                  onClick={() => clearSavedVacancyView(slot.id)}
                  disabled={!savedView}
                >
                  Clear
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
