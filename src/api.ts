import type { Candidate, TimelineEntry, Vacancy } from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

/** AbortSignal signal that times out after `ms` milliseconds. */
function timeoutSignal(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

// ────────────────────────────────────────────────────────────────────────────
// Response shapes
// ────────────────────────────────────────────────────────────────────────────

export interface ApiSnapshot {
  vacancies: Vacancy[];
  candidates: Candidate[];
  timeline: TimelineEntry[];
}

export interface ApiError {
  error: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Generic helpers
// ────────────────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit, timeoutMs = 8000): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    signal: options?.signal ?? timeoutSignal(timeoutMs),
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error ?? `HTTP ${res.status} from ${path}`);
  }

  return res.json() as Promise<T>;
}

// ────────────────────────────────────────────────────────────────────────────
// Health
// ────────────────────────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: timeoutSignal(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Snapshot – full state in one call
// ────────────────────────────────────────────────────────────────────────────

export async function fetchSnapshot(): Promise<ApiSnapshot> {
  return apiFetch<ApiSnapshot>('/api/snapshot');
}

// ────────────────────────────────────────────────────────────────────────────
// Vacancies
// ────────────────────────────────────────────────────────────────────────────

export async function fetchVacancies(): Promise<Vacancy[]> {
  return apiFetch<Vacancy[]>('/api/vacancies');
}

export async function fetchVacancy(id: string): Promise<Vacancy> {
  return apiFetch<Vacancy>(`/api/vacancies/${encodeURIComponent(id)}`);
}

export async function updateVacancy(id: string, data: Partial<Vacancy>): Promise<Vacancy> {
  return apiFetch<Vacancy>(`/api/vacancies/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Candidates
// ────────────────────────────────────────────────────────────────────────────

export async function fetchCandidatesForVacancy(vacancyId: string): Promise<Candidate[]> {
  return apiFetch<Candidate[]>(`/api/vacancies/${encodeURIComponent(vacancyId)}/candidates`);
}

export async function fetchCandidate(id: string): Promise<Candidate> {
  return apiFetch<Candidate>(`/api/candidates/${encodeURIComponent(id)}`);
}

export async function createCandidate(data: Omit<Candidate, 'id'>): Promise<Candidate> {
  return apiFetch<Candidate>('/api/candidates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCandidate(id: string, data: Partial<Candidate>): Promise<Candidate> {
  return apiFetch<Candidate>(`/api/candidates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Timeline
// ────────────────────────────────────────────────────────────────────────────

export async function fetchTimelineForCandidate(candidateId: string): Promise<TimelineEntry[]> {
  return apiFetch<TimelineEntry[]>(`/api/candidates/${encodeURIComponent(candidateId)}/timeline`);
}

export async function createTimelineEntry(data: Omit<TimelineEntry, 'id'>): Promise<TimelineEntry> {
  return apiFetch<TimelineEntry>('/api/timeline', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTimelineEntry(
  id: string,
  data: Partial<TimelineEntry>,
): Promise<TimelineEntry> {
  return apiFetch<TimelineEntry>(`/api/timeline/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
