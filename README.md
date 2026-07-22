# HR Recruitment CRM

A public project for exploring a CRM-like system for HR and recruitment teams to manage candidates, vacancies, hiring pipelines, communication history, statuses, and internal notes.

## Who it is for
- HR teams
- recruiters
- hiring teams

## Problem
Recruitment processes often become scattered across spreadsheets, chat messages, ATS tools, and ad hoc notes, making coordination and visibility harder.

## Current status
Early frontend prototype available, with a workflow foundation and a first app-shell implementation backed by mock recruitment data.

## Local development

### Frontend
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`

### Backend (`server/`)
The backend is an Express + SQLite API server using Drizzle ORM and better-sqlite3.

```bash
cd server
npm install

# Create tables and seed with mock data
npm run seed

# Start the API server on http://localhost:3001
npm run dev
```

### Full-stack development
Start both the frontend and backend concurrently:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
npm run dev
```

The frontend automatically detects the backend at `http://localhost:3001` via `VITE_API_BASE`
and falls back to mock data when the backend is unreachable.

## Key docs
- `docs/idea.md`
- `docs/scope.md`
- `docs/roadmap.md`
- `docs/workflow-foundation.md`
- `docs/app-shell-milestone.md`

## Implemented prototype slice
- vacancy selection as the main entry point
- stage-based candidate pipeline per vacancy
- candidate detail panel with timeline-style activity
- stage controls for step-by-step moves and direct stage reassignment
- local candidate creation flow with starting stage, score, location, and optional scheduling note
- mock data for vacancies, candidates, interviews, feedback, and communication history
- **Express + SQLite backend** with Drizzle ORM, REST API for vacancies, candidates, and timeline entries

## Repository visibility
This repository is public.
