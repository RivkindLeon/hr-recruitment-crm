import express from 'express';
import cors from 'cors';
import { db } from './db/index.ts';
import { vacancies, candidates, timelineEntries } from './db/schema.ts';
import { eq, sql } from 'drizzle-orm';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// ── Health ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const vacancyCount = db
    .select({ count: sql<number>`count(*)` })
    .from(vacancies)
    .get();
  res.json({
    status: 'ok',
    vacancyCount: vacancyCount?.count ?? 0,
    timestamp: new Date().toISOString(),
  });
});

// ── Full snapshot ───────────────────────────────────────────────────────
app.get('/api/snapshot', (_req, res) => {
  const allVacancies = db.select().from(vacancies).all();
  const allCandidates = db.select().from(candidates).all();
  const allTimeline = db.select().from(timelineEntries).all();

  res.json({
    vacancies: allVacancies,
    candidates: allCandidates,
    timeline: allTimeline,
  });
});

// ── Vacancies ───────────────────────────────────────────────────────────
app.get('/api/vacancies', (_req, res) => {
  const all = db.select().from(vacancies).all();
  res.json(all);
});

app.get('/api/vacancies/:id', (req, res) => {
  const v = db.select().from(vacancies).where(eq(vacancies.id, req.params.id)).get();
  if (!v) {
    res.status(404).json({ error: 'Vacancy not found' });
    return;
  }
  res.json(v);
});

app.put('/api/vacancies/:id', (req, res) => {
  const { title, team, owner, status } = req.body;

  const existing = db.select().from(vacancies).where(eq(vacancies.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({ error: 'Vacancy not found' });
    return;
  }

  db.update(vacancies)
    .set({
      title: title ?? existing.title,
      team: team ?? existing.team,
      owner: owner ?? existing.owner,
      status: status ?? existing.status,
    })
    .where(eq(vacancies.id, req.params.id))
    .run();

  const updated = db.select().from(vacancies).where(eq(vacancies.id, req.params.id)).get();
  res.json(updated);
});

// ── Candidates for a vacancy ────────────────────────────────────────────
app.get('/api/vacancies/:vacancyId/candidates', (req, res) => {
  const all = db
    .select()
    .from(candidates)
    .where(eq(candidates.vacancyId, req.params.vacancyId))
    .all();
  res.json(all);
});

// ── Candidates ──────────────────────────────────────────────────────────
app.get('/api/candidates', (_req, res) => {
  const all = db.select().from(candidates).all();
  res.json(all);
});

app.get('/api/candidates/:id', (req, res) => {
  const c = db.select().from(candidates).where(eq(candidates.id, req.params.id)).get();
  if (!c) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }
  res.json(c);
});

app.post('/api/candidates', (req, res) => {
  const { vacancyId, name, currentStage, source, lastActivityDate, nextInterview, score, location, summary } = req.body;

  if (!vacancyId || !name || !location || !summary) {
    res.status(400).json({ error: 'Missing required fields: vacancyId, name, location, summary' });
    return;
  }

  const id = `cand-${Date.now()}`;
  db.insert(candidates)
    .values({
      id,
      vacancyId,
      name,
      currentStage: currentStage ?? 'New',
      source: source ?? 'LinkedIn',
      lastActivityDate: lastActivityDate ?? new Date().toISOString().split('T')[0],
      nextInterview: nextInterview ?? null,
      score: score != null ? Number(score) : 70,
      location,
      summary,
    })
    .run();

  const created = db.select().from(candidates).where(eq(candidates.id, id)).get();
  res.status(201).json(created);
});

app.put('/api/candidates/:id', (req, res) => {
  const { currentStage, source, score, location, summary, nextInterview } = req.body;

  const existing = db.select().from(candidates).where(eq(candidates.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({ error: 'Candidate not found' });
    return;
  }

  db.update(candidates)
    .set({
      currentStage: currentStage ?? existing.currentStage,
      source: source ?? existing.source,
      nextInterview: nextInterview !== undefined ? nextInterview : existing.nextInterview,
      score: score != null ? Number(score) : existing.score,
      location: location ?? existing.location,
      summary: summary ?? existing.summary,
    })
    .where(eq(candidates.id, req.params.id))
    .run();

  const updated = db.select().from(candidates).where(eq(candidates.id, req.params.id)).get();
  res.json(updated);
});

// ── Timeline for a candidate ────────────────────────────────────────────
app.get('/api/candidates/:candidateId/timeline', (req, res) => {
  const all = db
    .select()
    .from(timelineEntries)
    .where(eq(timelineEntries.candidateId, req.params.candidateId))
    .all();
  res.json(all);
});

// ── Timeline entries ────────────────────────────────────────────────────
app.post('/api/timeline', (req, res) => {
  const { candidateId, type, title, date, detail } = req.body;

  if (!candidateId || !title || !detail) {
    res.status(400).json({ error: 'Missing required fields: candidateId, title, detail' });
    return;
  }

  const id = `t${Date.now()}`;
  db.insert(timelineEntries)
    .values({
      id,
      candidateId,
      type: type ?? 'feedback',
      title,
      date: date ?? new Date().toISOString().split('T')[0],
      detail,
    })
    .run();

  const created = db.select().from(timelineEntries).where(eq(timelineEntries.id, id)).get();
  res.status(201).json(created);
});

app.put('/api/timeline/:id', (req, res) => {
  const { type, title, date, detail } = req.body;

  const existing = db.select().from(timelineEntries).where(eq(timelineEntries.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({ error: 'Timeline entry not found' });
    return;
  }

  db.update(timelineEntries)
    .set({
      type: type ?? existing.type,
      title: title ?? existing.title,
      date: date ?? existing.date,
      detail: detail ?? existing.detail,
    })
    .where(eq(timelineEntries.id, req.params.id))
    .run();

  const updated = db.select().from(timelineEntries).where(eq(timelineEntries.id, req.params.id)).get();
  res.json(updated);
});

// ── Startup ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`📋 HR Recruitment CRM API running on http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   GET    /api/snapshot              — full data snapshot`);
  console.log(`   GET    /api/health                — health check`);
  console.log(`   GET    /api/vacancies             — list all vacancies`);
  console.log(`   GET    /api/vacancies/:id         — get a vacancy by id`);
  console.log(`   PUT    /api/vacancies/:id         — update a vacancy`);
  console.log(`   GET    /api/vacancies/:id/candidates — candidates for a vacancy`);
  console.log(`   GET    /api/candidates            — list all candidates`);
  console.log(`   GET    /api/candidates/:id        — get a candidate by id`);
  console.log(`   POST   /api/candidates            — create a candidate`);
  console.log(`   PUT    /api/candidates/:id        — update a candidate`);
  console.log(`   GET    /api/candidates/:id/timeline — timeline for a candidate`);
  console.log(`   POST   /api/timeline              — create a timeline entry`);
  console.log(`   PUT    /api/timeline/:id          — update a timeline entry`);
});