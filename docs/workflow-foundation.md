# Workflow Foundation

## Primary users

### Recruiter
- creates and updates vacancies
- sources and reviews candidates
- moves candidates through the hiring pipeline
- keeps communication history current

### Hiring manager
- defines role expectations
- reviews shortlisted candidates
- gives interview feedback
- makes stage progression decisions with the recruiter

### Coordinator or operations support
- schedules interviews
- keeps interview logistics organized
- reduces manual follow-up work across the team

## Core entities for the first prototype
- vacancy
- candidate
- stage
- interview
- feedback entry
- communication log

## Minimum workflow for v0
1. Create a vacancy with title, team, owner, and status.
2. Add a candidate linked to a vacancy.
3. Record source and current stage for the candidate.
4. Log communication events such as outreach, reply, or follow-up.
5. Schedule one or more interviews.
6. Store structured feedback per interview.
7. Move the candidate to the next stage, offer, rejected, or hired.

## Suggested initial pipeline
- new
- screening
- recruiter interview
- hiring manager interview
- panel or final interview
- offer
- hired
- rejected

## First prototype boundaries
- one workspace or team context only
- no complex permissions yet
- no external integrations yet
- timeline-style history instead of advanced analytics
- prioritize clarity of candidate progress over ATS completeness

## Why this matters now
This gives the project a concrete product shape without committing to backend architecture or heavy implementation details yet. It should make the next app-shell milestone easier to scope.
