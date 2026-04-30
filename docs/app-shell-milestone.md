# First App Shell Milestone

## Goal
Create a small frontend milestone that makes the recruitment workflow tangible before backend work starts.

## Milestone outcome
A user can open the app and understand the current hiring flow through three connected areas:
- a vacancy list
- a candidate pipeline view for one selected vacancy
- a candidate detail panel with timeline-style activity

## Screens and layout

### 1. Vacancy list
Shows the initial set of vacancies with:
- title
- team
- owner
- status
- candidate count

Purpose:
- make vacancy selection the main entry point
- keep the app anchored around active hiring work

### 2. Candidate pipeline view
For the selected vacancy, show candidates grouped by stage:
- new
- screening
- recruiter interview
- hiring manager interview
- panel or final interview
- offer
- hired
- rejected

Each candidate card should show:
- full name
- current stage
- source
- last activity date
- next scheduled interview if present

Purpose:
- make stage progress visible at a glance
- support the core recruiter workflow before advanced filtering exists

### 3. Candidate detail panel
When a candidate is selected, show:
- basic profile summary
- linked vacancy
- communication log
- interview list
- latest feedback entries

Purpose:
- keep the first prototype focused on progress clarity, not deep ATS complexity

## Required mock data for the milestone
- 3 vacancies
- 8 to 12 candidates across multiple stages
- at least 1 rejected candidate
- at least 1 hired candidate
- communication log examples for several candidates
- interview and feedback examples for several candidates

## v0 interaction rules
- vacancy selection updates the pipeline view
- candidate selection updates the detail panel
- stage changes can be mocked in UI state only
- no authentication
- no persistence yet
- no external integrations

## Why this is the right next step
- it turns the workflow foundation into a concrete UI slice
- it validates whether the chosen entities are enough for a useful first experience
- it keeps backend decisions deferred until the frontend flow is clearer

## Follow-up after this milestone
1. scaffold the React + TypeScript app shell
2. add mock domain data for vacancies, candidates, interviews, and feedback
3. implement the three-panel layout
4. decide whether the next iteration should focus on stage movement or candidate creation first
