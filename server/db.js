/**
 * db.js  —  sql.js (pure-JS SQLite) with file persistence
 */
const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'kikoba.db');

let db;
let SQL;

function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ─── Schema DDL (fresh DB) ────────────────────────────────────────────────────
function applySchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Roles: admin | mwenyekiti | katibu | mwasibu
    CREATE TABLE IF NOT EXISTS admins (
      id            TEXT    PRIMARY KEY,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'admin',
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id         TEXT PRIMARY KEY,
      jina       TEXT NOT NULL,
      namba      TEXT DEFAULT '',
      simu       TEXT DEFAULT '',
      created_at INTEGER NOT NULL
    );

    -- Member portal accounts (linked to a member record)
    CREATE TABLE IF NOT EXISTS member_accounts (
      id            TEXT    PRIMARY KEY,
      member_id     TEXT    NOT NULL UNIQUE,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    INTEGER NOT NULL,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS entries (
      id                TEXT    PRIMARY KEY,
      member_id         TEXT    NOT NULL,
      tarehe            TEXT    NOT NULL,
      hisa_idadi        REAL    NOT NULL DEFAULT 0,
      hisa_thamani      REAL    NOT NULL DEFAULT 0,
      jamii             REAL    NOT NULL DEFAULT 0,
      marejeshо_hisa    REAL    NOT NULL DEFAULT 0,
      marejeshо_jamii   REAL    NOT NULL DEFAULT 0,
      bima              REAL    NOT NULL DEFAULT 0,
      faini             REAL    NOT NULL DEFAULT 0,
      created_at        INTEGER NOT NULL,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bei_historia (
      id                TEXT    PRIMARY KEY,
      aina              TEXT    NOT NULL,
      thamani_ya_zamani REAL    NOT NULL DEFAULT 0,
      thamani_mpya      REAL    NOT NULL DEFAULT 0,
      sababu            TEXT    DEFAULT '',
      admin_id          TEXT    DEFAULT '',
      created_at        INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mikopo (
      id               TEXT    PRIMARY KEY,
      member_id        TEXT    NOT NULL,
      kiasi            REAL    NOT NULL DEFAULT 0,
      riba_asilimia    REAL    NOT NULL DEFAULT 0,
      kiasi_riba       REAL    NOT NULL DEFAULT 0,
      jumla_kulipa     REAL    NOT NULL DEFAULT 0,
      tarehe_kutoa     TEXT    NOT NULL,
      tarehe_mwisho    TEXT    NOT NULL,
      miezi_ya_kulipa  INTEGER NOT NULL DEFAULT 1,
      hali             TEXT    NOT NULL DEFAULT 'hai',
      maelezo          TEXT    DEFAULT '',
      admin_id         TEXT    DEFAULT '',
      created_at       INTEGER NOT NULL,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS marejesho_mikopo (
      id         TEXT    PRIMARY KEY,
      mkopo_id   TEXT    NOT NULL,
      member_id  TEXT    NOT NULL,
      kiasi      REAL    NOT NULL DEFAULT 0,
      tarehe     TEXT    NOT NULL,
      maelezo    TEXT    DEFAULT '',
      admin_id   TEXT    DEFAULT '',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (mkopo_id)  REFERENCES mikopo(id)   ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id)  ON DELETE CASCADE
    );
  `);

  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('groupName',       'SHUGHULI ZA KIBENKI')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('sharePrice',      '25000')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('jamiiKiwango',    '10000')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('bimaKiwango',     '0')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('hisaIdadiChaguo', '1')`);

  persist();
}

// ─── Migration (existing DB) ─────────────────────────────────────────────────
function migrate() {
  // Ensure base tables exist
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
    created_at INTEGER NOT NULL
  );`);

  // Add role column if missing (safe on existing DBs)
  try { db.run(`ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'`); } catch {}

  // Member portal accounts table
  db.run(`CREATE TABLE IF NOT EXISTS member_accounts (
    id            TEXT    PRIMARY KEY,
    member_id     TEXT    NOT NULL UNIQUE,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    INTEGER NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );`);

  // Other tables
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('jamiiKiwango',    '10000')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('bimaKiwango',     '0')`);
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('hisaIdadiChaguo', '1')`);

  db.run(`CREATE TABLE IF NOT EXISTS bei_historia (
    id TEXT PRIMARY KEY, aina TEXT NOT NULL,
    thamani_ya_zamani REAL NOT NULL DEFAULT 0, thamani_mpya REAL NOT NULL DEFAULT 0,
    sababu TEXT DEFAULT '', admin_id TEXT DEFAULT '', created_at INTEGER NOT NULL
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS mikopo (
    id TEXT PRIMARY KEY, member_id TEXT NOT NULL,
    kiasi REAL NOT NULL DEFAULT 0, riba_asilimia REAL NOT NULL DEFAULT 0,
    kiasi_riba REAL NOT NULL DEFAULT 0, jumla_kulipa REAL NOT NULL DEFAULT 0,
    tarehe_kutoa TEXT NOT NULL, tarehe_mwisho TEXT NOT NULL,
    miezi_ya_kulipa INTEGER NOT NULL DEFAULT 1, hali TEXT NOT NULL DEFAULT 'hai',
    maelezo TEXT DEFAULT '', admin_id TEXT DEFAULT '', created_at INTEGER NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS marejesho_mikopo (
    id TEXT PRIMARY KEY, mkopo_id TEXT NOT NULL, member_id TEXT NOT NULL,
    kiasi REAL NOT NULL DEFAULT 0, tarehe TEXT NOT NULL,
    maelezo TEXT DEFAULT '', admin_id TEXT DEFAULT '', created_at INTEGER NOT NULL,
    FOREIGN KEY (mkopo_id)  REFERENCES mikopo(id)  ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  );`);

  persist();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    migrate();
  } else {
    db = new SQL.Database();
    applySchema();
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────
function run(sql, params = []) { db.run(sql, params); persist(); }

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) { return all(sql, params)[0]; }

module.exports = { init, run, all, get, persist };
