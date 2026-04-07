import path from 'path';
import fs from 'fs';
import initSqlJs from 'sql.js';

let db = null;
let initPromise = null;

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'geopolitics.db');

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

async function initDb() {
  ensureDir();
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id              TEXT PRIMARY KEY,
      source          TEXT NOT NULL,
      title           TEXT NOT NULL,
      link            TEXT NOT NULL UNIQUE,
      pub_date        TEXT NOT NULL,
      description     TEXT DEFAULT '',
      fetched_at      TEXT NOT NULL DEFAULT (datetime('now')),
      countries       TEXT DEFAULT '[]',
      title_countries TEXT DEFAULT '[]',
      event_type      TEXT DEFAULT 'Report',
      event_color     TEXT DEFAULT '#888888',
      zone            TEXT DEFAULT 'Global'
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_event_type ON articles(event_type)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS article_fingerprints (
      fingerprint TEXT PRIMARY KEY,
      article_id  TEXT NOT NULL REFERENCES articles(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fetch_log (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      source         TEXT NOT NULL,
      fetched_at     TEXT NOT NULL DEFAULT (datetime('now')),
      articles_found INTEGER DEFAULT 0,
      articles_new   INTEGER DEFAULT 0,
      status         TEXT DEFAULT 'ok',
      error_message  TEXT
    )
  `);

  return db;
}

export async function getDb() {
  if (db) return db;
  if (!initPromise) initPromise = initDb();
  return initPromise;
}

function save() {
  if (!db) return;
  ensureDir();
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function upsertArticle(article) {
  const d = await getDb();
  const {
    id,
    source,
    title,
    link,
    pubDate,
    description = '',
    countries = [],
    titleCountries = [],
    eventType = 'Report',
    eventColor = '#888888',
    zone = 'Global',
  } = article;

  try {
    d.run(
      `INSERT OR IGNORE INTO articles
         (id, source, title, link, pub_date, description, countries, title_countries, event_type, event_color, zone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, source, title, link, pubDate, description,
       JSON.stringify(countries), JSON.stringify(titleCountries),
       eventType, eventColor, zone]
    );
    const changes = d.getRowsModified();
    if (changes > 0) save();
    return changes > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Fingerprints
// ---------------------------------------------------------------------------

export async function insertFingerprint(fingerprint, articleId) {
  const d = await getDb();
  d.run(`INSERT OR IGNORE INTO article_fingerprints (fingerprint, article_id) VALUES (?, ?)`,
    [fingerprint, articleId]);
}

export async function hasFingerprint(fingerprint) {
  const d = await getDb();
  const stmt = d.prepare(`SELECT 1 FROM article_fingerprints WHERE fingerprint = ? LIMIT 1`);
  stmt.bind([fingerprint]);
  const found = stmt.step();
  stmt.free();
  return found;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

function buildWhereClause({ source, eventType, fromDate, toDate }) {
  const conditions = [];
  const params = [];

  if (source) {
    conditions.push('source = ?');
    params.push(source);
  }
  if (eventType) {
    conditions.push('event_type = ?');
    params.push(eventType);
  }
  if (fromDate) {
    conditions.push('pub_date >= ?');
    params.push(fromDate);
  }
  if (toDate) {
    conditions.push('pub_date <= ?');
    params.push(toDate + 'T23:59:59Z');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

function parseArticleRow(cols, vals) {
  const row = {};
  cols.forEach((col, i) => { row[col] = vals[i]; });

  return {
    id: row.id,
    source: row.source,
    title: row.title,
    link: row.link,
    pubDate: row.pub_date,
    description: row.description,
    countries: JSON.parse(row.countries || '[]'),
    titleCountries: JSON.parse(row.title_countries || '[]'),
    eventType: row.event_type,
    eventColor: row.event_color,
    color: row.event_color,
    zone: row.zone,
  };
}

export async function queryArticles({ source, eventType, fromDate, toDate, limit = 50, offset = 0 } = {}) {
  const d = await getDb();
  const { where, params } = buildWhereClause({ source, eventType, fromDate, toDate });

  const sql = `SELECT * FROM articles ${where} ORDER BY pub_date DESC LIMIT ? OFFSET ?`;
  const stmt = d.prepare(sql);
  stmt.bind([...params, limit, offset]);

  const results = [];
  while (stmt.step()) {
    results.push(parseArticleRow(stmt.getColumnNames(), stmt.get()));
  }
  stmt.free();
  return results;
}

export async function getArticleCount({ source, eventType, fromDate, toDate } = {}) {
  const d = await getDb();
  const { where, params } = buildWhereClause({ source, eventType, fromDate, toDate });

  const sql = `SELECT COUNT(*) AS count FROM articles ${where}`;
  const stmt = d.prepare(sql);
  stmt.bind(params);
  stmt.step();
  const count = stmt.get()[0];
  stmt.free();
  return count;
}

// ---------------------------------------------------------------------------
// Fetch log
// ---------------------------------------------------------------------------

export async function logFetch(source, found, newCount, status = 'ok', errorMessage = null) {
  const d = await getDb();
  d.run(
    `INSERT INTO fetch_log (source, articles_found, articles_new, status, error_message)
     VALUES (?, ?, ?, ?, ?)`,
    [source, found, newCount, status, errorMessage]
  );
  save();
}

export async function getLastFetchTime(source) {
  const d = await getDb();
  const stmt = d.prepare(
    `SELECT fetched_at FROM fetch_log WHERE source = ? AND status = 'ok' ORDER BY fetched_at DESC LIMIT 1`
  );
  stmt.bind([source]);
  let result = null;
  if (stmt.step()) result = stmt.get()[0];
  stmt.free();
  return result;
}

// ---------------------------------------------------------------------------
// Source stats
// ---------------------------------------------------------------------------

export async function getSourceStats() {
  const d = await getDb();
  const stmt = d.prepare(`
    SELECT source, COUNT(*) AS articleCount
    FROM articles
    GROUP BY source
    ORDER BY source
  `);

  const results = [];
  while (stmt.step()) {
    const vals = stmt.get();
    const cols = stmt.getColumnNames();
    const row = {};
    cols.forEach((c, i) => { row[c] = vals[i]; });
    results.push(row);
  }
  stmt.free();

  // Get last fetch times
  for (const row of results) {
    row.lastFetch = await getLastFetchTime(row.source);
  }

  return results;
}

export function saveDb() {
  save();
}
