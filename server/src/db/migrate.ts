import { rawDb } from './index.ts';

function pushSchema() {
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS vacancies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      team TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      vacancy_id TEXT NOT NULL REFERENCES vacancies(id),
      name TEXT NOT NULL,
      current_stage TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'LinkedIn',
      last_activity_date TEXT NOT NULL,
      next_interview TEXT,
      score INTEGER NOT NULL DEFAULT 70,
      location TEXT NOT NULL,
      summary TEXT NOT NULL
    )
  `);

  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS timeline_entries (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES candidates(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      detail TEXT NOT NULL
    )
  `);

  console.log('✓ Tables created (if not already present)');
}

pushSchema();
rawDb.close();