# HR Recruitment CRM

A public project for exploring a CRM-like system for HR and recruitment teams to manage candidates, vacancies, hiring pipelines, communication history, statuses, and internal notes.

## Who it is for
- HR teams
- recruiters
- hiring teams

## Problem
Recruitment processes often become scattered across spreadsheets, chat messages, ATS tools, and ad hoc notes, making coordination and visibility harder.

## Current status
Full-stack MVP complete. React + TypeScript + Vite frontend connected to an Express + SQLite backend via REST API (Drizzle ORM). All CRUD operations (vacancies, candidates, timeline) go through the API with graceful fallback to mock data when the backend is unreachable. Includes stage controls, saved views, candidate creation and editing, timeline entries, and optimistic optimistic mutation support.

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

## Implemented features
- vacancy selection as the main entry point with status filtering and sorting
- stage-based candidate pipeline per vacancy with visual stage columns
- candidate detail panel with timeline-style activity
- stage controls for step-by-step moves and direct stage reassignment with optimistic revert on API failure
- candidate creation and editing with fields for stage, score, location, source, and summaries
- timeline entries (create/update) for tracking candidate activity
- saved view definitions for quick pipeline filtering
- **Express + SQLite backend** with Drizzle ORM, full REST API for vacancies, candidates, and timeline entries
- Frontend automatically loads data from backend on mount, falls back to mock data when offline

## Repository visibility
This repository is public.
