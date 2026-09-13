/**
 * routes/entries.js
 *
 * GET /api/entries
 *   - Officer  → all entries (or filtered by ?memberId / ?date)
 *   - Member   → own entries only (memberId forced to their id)
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

function rowToEntry(r) {
  return {
    id:             r.id,
    memberId:       r.member_id,
    tarehe:         r.tarehe,
    hisaIdadi:      r.hisa_idadi,
    hisaThamani:    r.hisa_thamani,
    jamii:          r.jamii,
    marejeshoHisa:  r.marejeshо_hisa,
    marejeshoJamii: r.marejeshо_jamii,
    bima:           r.bima,
    faini:          r.faini,
    createdAt:      r.created_at,
  };
}

// GET /api/entries — requires auth
router.get('/', requireAuth, (req, res) => {
  try {
    let { memberId, date } = req.query;

    // Member can only ever see their own entries
    if (!isOfficer(req.user)) {
      memberId = req.user.memberId;
    }

    let sql = 'SELECT * FROM entries WHERE 1=1';
    const params = [];
    if (memberId) { sql += ' AND member_id = ?'; params.push(memberId); }
    if (date)     { sql += ' AND tarehe = ?';    params.push(date); }
    sql += ' ORDER BY tarehe ASC, created_at ASC';

    res.json(db.all(sql, params).map(rowToEntry));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — officer only
router.post('/', requireAdmin, (req, res) => {
  try {
    const {
      memberId, tarehe,
      hisaIdadi = 0, hisaThamani = 0, jamii = 0,
      marejeshoHisa = 0, marejeshoJamii = 0,
      bima = 0, faini = 0
    } = req.body;
    if (!memberId || !tarehe) return res.status(400).json({ error: 'memberId na tarehe vinahitajika.' });
    if (!db.get('SELECT id FROM members WHERE id = ?', [memberId])) {
      return res.status(404).json({ error: 'Mwanachama hakupatikana.' });
    }
    const id = uid();
    db.run(`INSERT INTO entries
      (id, member_id, tarehe, hisa_idadi, hisa_thamani, jamii,
       marejeshо_hisa, marejeshо_jamii, bima, faini, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, memberId, tarehe,
       Number(hisaIdadi)||0, Number(hisaThamani)||0, Number(jamii)||0,
       Number(marejeshoHisa)||0, Number(marejeshoJamii)||0,
       Number(bima)||0, Number(faini)||0, Date.now()]);
    res.status(201).json(rowToEntry(db.get('SELECT * FROM entries WHERE id = ?', [id])));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT — officer only
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const {
      memberId, tarehe,
      hisaIdadi = 0, hisaThamani = 0, jamii = 0,
      marejeshoHisa = 0, marejeshoJamii = 0, bima = 0, faini = 0
    } = req.body;
    db.run(`UPDATE entries SET
      member_id = ?, tarehe = ?,
      hisa_idadi = ?, hisa_thamani = ?, jamii = ?,
      marejeshо_hisa = ?, marejeshо_jamii = ?,
      bima = ?, faini = ?
      WHERE id = ?`,
      [memberId, tarehe,
       Number(hisaIdadi)||0, Number(hisaThamani)||0, Number(jamii)||0,
       Number(marejeshoHisa)||0, Number(marejeshoJamii)||0,
       Number(bima)||0, Number(faini)||0, req.params.id]);
    const row = db.get('SELECT * FROM entries WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Kumbukumbu haikupatikana.' });
    res.json(rowToEntry(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE — officer only
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    db.run('DELETE FROM entries WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
