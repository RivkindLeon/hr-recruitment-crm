import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

/**
 * Hiring vacancies / openings.
 */
export const vacancies = sqliteTable('vacancies', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  team: text('team').notNull(),
  owner: text('owner').notNull(),
  status: text('status').notNull(), // 'Active' | 'Paused' | 'Closing Soon'
});

/**
 * Candidates linked to a vacancy.
 */
export const candidates = sqliteTable('candidates', {
  id: text('id').primaryKey(),
  vacancyId: text('vacancy_id')
    .notNull()
    .references(() => vacancies.id),
  name: text('name').notNull(),
  currentStage: text('current_stage').notNull(), // CandidateStage
  source: text('source').notNull().default('LinkedIn'),
  lastActivityDate: text('last_activity_date').notNull(),
  nextInterview: text('next_interview'),
  score: integer('score').notNull().default(70),
  location: text('location').notNull(),
  summary: text('summary').notNull(),
});

/**
 * Timeline entries (feedback / interview / communication) per candidate.
 */
export const timelineEntries = sqliteTable('timeline_entries', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id')
    .notNull()
    .references(() => candidates.id),
  type: text('type').notNull(), // 'communication' | 'interview' | 'feedback'
  title: text('title').notNull(),
  date: text('date').notNull(),
  detail: text('detail').notNull(),
});