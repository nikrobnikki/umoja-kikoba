/**
 * routes/members.js
 *
 * GET /api/members
 *   - Officer  → all members
 *   - Member   → own record only (array of 1)
 *   - No token → 401
 *
 * POST/PUT/DELETE → officer only
 */
const express = require('express');
const db = require('../db');
const { requireAdmin, requireAuth, isOfficer } = require('../middleware/auth');
const router = express.Router();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function buildResult(members) {
  const ids = members.map(m => m.id);
  if (ids.length === 0) return [];

  // Build placeholders for IN clause
  const placeholders = ids.map(() => '?').join(',');
  const totals = db.all(`
    SELECT
      member_id,
      COALESCE(SUM(hisa_idadi), 0)      AS hisaIdadi,
      COALESCE(SUM(hisa_thamani), 0)    AS hisaThamani,
      COALESCE(SUM(jamii), 0)           AS jamii,
      COALESCE(SUM(marejeshо_hisa), 0)  AS marejeshoHisa,
      COALESCE(SUM(marejeshо_jamii), 0) AS marejeshoJamii,
      COALESCE(SUM(bima), 0)            AS bima,
      COALESCE(SUM(faini), 0)           AS faini
    FROM entries WHERE member_id IN (${placeholders}) GROUP BY member_id`, ids);

  const totalsMap = {};
  totals.forEach(t => { totalsMap[t.member_id] = t; });

  return members.map(m => ({
    id: m.id, jina: m.jina, namba: m.namba, simu: m.simu, createdAt: m.created_at,
    totals: totalsMap[m.id] || {
      hisaIdadi: 0, hisaThamani: 0, jamii: 0,
      marejeshoHisa: 0, marejeshoJamii: 0, bima: 0, faini: 0
    }
  }));
}

// GET /api/members — requires auth; filters by memberId for mwanachama
router.get('/', requireAuth, (req, res) => {
  try {
    if (isOfficer(req.user)) {
      const members = db.all('SELECT * FROM members ORDER BY created_at ASC');
      return res.json(buildResult(members));
    }
    // mwanachama — own record only
    const member = db.get('SELECT * FROM members WHERE id = ?', [req.user.memberId]);
    return res.json(member ? buildResult([member]) : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — officer only
router.post('/', requireAdmin, (req, res) => {
  try {
    const { jina, namba = '', simu = '' } = req.body;
    if (!jina?.trim()) return res.status(400).json({ error: 'Jina linahitajika.' });
    if (jina.trim().length > 100) return res.status(400).json({ error: 'Jina ni refu sana (max 100).' });
    if (namba.length > 20)  return res.status(400).json({ error: 'Namba ni refu sana.' });
    if (simu.length > 20)   return res.status(400).json({ error: 'Namba ya simu ni refu sana.' });
    const member = {
      id: uid(), jina: jina.trim(), namba: namba.trim(),
      simu: simu.trim(), created_at: Date.now()
    };
    db.run(`INSERT INTO members (id, jina, namba, simu, created_at) VALUES (?, ?, ?, ?, ?)`,
      [member.id, member.jina, member.namba, member.simu, member.created_at]);
    res.status(201).json({ id: member.id, jina: member.jina, namba: member.namba,
      simu: member.simu, createdAt: member.created_at });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT — officer only
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { jina, namba = '', simu = '' } = req.body;
    if (!jina?.trim()) return res.status(400).json({ error: 'Jina linahitajika.' });
    db.run(`UPDATE members SET jina = ?, namba = ?, simu = ? WHERE id = ?`,
      [jina.trim(), namba.trim(), simu.trim(), req.params.id]);
    res.json({ id: req.params.id, jina: jina.trim(), namba: namba.trim(), simu: simu.trim() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE — officer only
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    db.run(`DELETE FROM entries WHERE member_id = ?`, [req.params.id]);
    db.run(`DELETE FROM members WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
