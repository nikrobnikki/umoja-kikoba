const express = require('express');
const db = require('../db');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const router = express.Router();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Settng keys zinazohifadhi nambari za soko
const MARKET_KEYS = ['sharePrice', 'jamiiKiwango', 'bimaKiwango', 'hisaIdadiChaguo'];

// GET /api/settings  — any authenticated user (officer or member)
router.get('/', requireAuth, (req, res) => {
  try {
    const rows = db.all('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings  — admin only
router.put('/', requireAdmin, (req, res) => {
  try {
    const allowed = ['groupName', 'sharePrice', 'jamiiKiwango', 'bimaKiwango', 'hisaIdadiChaguo'];
    const { sababu = '', ...rest } = req.body;

    // Read current values before saving (for history)
    const currentRows = db.all('SELECT key, value FROM settings');
    const current = {};
    currentRows.forEach(r => { current[r.key] = r.value; });

    allowed.forEach(key => {
      if (rest[key] === undefined) return;
      const newVal = String(key === 'groupName' ? rest[key] : Number(rest[key]) || 0);

      // Record history for market-rate fields that actually changed
      if (MARKET_KEYS.includes(key) && current[key] !== undefined) {
        const oldNum = Number(current[key]) || 0;
        const newNum = Number(newVal) || 0;
        if (oldNum !== newNum) {
          db.run(
            `INSERT INTO bei_historia (id, aina, thamani_ya_zamani, thamani_mpya, sababu, admin_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uid(), key, oldNum, newNum, sababu.trim(), req.admin.id, Date.now()]
          );
        }
      }

      db.run(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, newVal]
      );
    });

    const rows = db.all('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/historia  — admin only — bei za masoko historia
router.get('/historia', requireAdmin, (req, res) => {
  try {
    const rows = db.all(`
      SELECT h.*, a.username
      FROM bei_historia h
      LEFT JOIN admins a ON a.id = h.admin_id
      ORDER BY h.created_at DESC
      LIMIT 100
    `);
    res.json(rows.map(r => ({
      id:              r.id,
      aina:            r.aina,
      thamaniYaZamani: r.thamani_ya_zamani,
      thamaniMpya:     r.thamani_mpya,
      sababu:          r.sababu,
      adminJina:       r.username || '—',
      createdAt:       r.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
