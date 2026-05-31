import { type FormEvent } from 'react';
import type { Vacancy, VacancyStatus } from '../types';

interface VacancyEditSectionProps {
  selectedVacancy: Vacancy;
  isEditingVacancy: boolean;
  setIsEditingVacancy: (editing: boolean) => void;
  vacancyEditDraft: {
    title: string;
    team: string;
    owner: string;
    status: VacancyStatus;
  };
  setVacancyEditDraft: React.Dispatch<
    React.SetStateAction<{
      title: string;
      team: string;
      owner: string;
      status: VacancyStatus;
    }>
  >;
  vacancyCandidatesCount: number;
  handleVacancyEdit: (e: FormEvent<HTMLFormElement>) => void;
}

const vacancyStatuses: VacancyStatus[] = ['Active', 'Paused', 'Closing Soon'];

export function VacancyEditSection({
  selectedVacancy,
  isEditingVacancy,
  setIsEditingVacancy,
  vacancyEditDraft,
  setVacancyEditDraft,
  vacancyCandidatesCount,
  handleVacancyEdit,
}: VacancyEditSectionProps) {
  return (
    <div className="candidate-summary-card">
      <div className="candidate-summary-header">
        <div>
          <span className="detail-label">Vacancy details</span>
          <strong>Adjust title, owner, team, or status without leaving the hiring view</strong>
        </div>
        <button
          type="button"
          className="stage-action-button"
          onClick={() => {
            if (isEditingVacancy) {
              setVacancyEditDraft({
                title: selectedVacancy.title,
                team: selectedVacancy.team,
                owner: selectedVacancy.owner,
                status: selectedVacancy.status,
              });
            }
            setIsEditingVacancy(!isEditingVacancy);
          }}
          aria-label={isEditingVacancy ? 'Cancel vacancy edit' : 'Edit vacancy'}
        >
          {isEditingVacancy ? 'Cancel edit' : 'Edit vacancy'}
        </button>
      </div>

      {isEditingVacancy ? (
        <form className="candidate-edit-form" onSubmit={handleVacancyEdit}>
          <label className="form-field">
            <span>Title</span>
            <input
              value={vacancyEditDraft.title}
              onChange={(e) => setVacancyEditDraft((d) => ({ ...d, title: e.target.value }))}
              required
            />
          </label>

          <div className="form-field-row">
            <label className="form-field">
              <span>Team</span>
              <input
                value={vacancyEditDraft.team}
                onChange={(e) => setVacancyEditDraft((d) => ({ ...d, team: e.target.value }))}
                required
              />
            </label>

            <label className="form-field">
              <span>Owner</span>
              <input
                value={vacancyEditDraft.owner}
                onChange={(e) => setVacancyEditDraft((d) => ({ ...d, owner: e.target.value }))}
                required
              />
            </label>
          </div>

          <label className="form-field">
            <span>Status</span>
            <select
              value={vacancyEditDraft.status}
              onChange={(e) =>
                setVacancyEditDraft((d) => ({
                  ...d,
                  status: e.target.value as VacancyStatus,
                }))
              }
            >
              {vacancyStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="stage-action-button primary">
            Save vacancy updates
          </button>
        </form>
      ) : (
        <div className="detail-summary vacancy-detail-summary">
          <div>
            <span className="detail-label">Team</span>
            <strong>{selectedVacancy.team}</strong>
          </div>
          <div>
            <span className="detail-label">Owner</span>
            <strong>{selectedVacancy.owner}</strong>
          </div>
          <div>
            <span className="detail-label">Status</span>
            <strong>{selectedVacancy.status}</strong>
          </div>
          <div>
            <span className="detail-label">Pipeline size</span>
            <strong>{vacancyCandidatesCount} candidates</strong>
          </div>
        </div>
      )}
    </div>
  );
}
