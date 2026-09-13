/**
 * routes/mikopo.js  —  Loan book API
 *
 * GET    /api/mikopo                  public  — all loans (with repayment totals)
 * GET    /api/mikopo/:id              public  — single loan detail + repayments
 * GET    /api/mikopo/member/:memberId public  — all loans for a member
 * POST   /api/mikopo                  admin   — create a new loan
 * PUT    /api/mikopo/:id              admin   — edit loan details
 * DELETE /api/mikopo/:id              admin   — delete loan (cascades repayments)
 *
 * GET    /api/mikopo/:id/marejesho         public  — list repayments for a loan
 * POST   /api/mikopo/:id/marejesho         admin   — record a repayment
 * DELETE /api/mikopo/:id/marejesho/:rId    admin   — delete a repayment
 */

const express = require('express');
const db = require('../db');
const { requireAdmin, requireAuth, isOfficer } = require('../middleware/auth');
const router = express.Router();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function rowToLoan(r) {
  return {
    id:             r.id,
    memberId:       r.member_id,
    memberJina:     r.member_jina  || '',
    kiasi:          Number(r.kiasi)          || 0,
    ribaAsilimia:   Number(r.riba_asilimia)  || 0,
    kiasiRiba:      Number(r.kiasi_riba)     || 0,
    jumlaKulipa:    Number(r.jumla_kulipa)   || 0,
    tarehekutoa:    r.tarehe_kutoa,
    tareheMwisho:   r.tarehe_mwisho,
    mieziYaKulipa:  Number(r.miezi_ya_kulipa) || 1,
    hali:           r.hali || 'hai',
    maelezo:        r.maelezo || '',
    adminId:        r.admin_id || '',
    createdAt:      r.created_at,
    // Aggregated from repayments (populated by enrichLoan)
    jumlaIlipolipwa: 0,
    saladoBaki:      0,
    marejeshoCount:  0,
  };
}

function rowToRepayment(r) {
  return {
    id:        r.id,
    mkopoId:   r.mkopo_id,
    memberId:  r.member_id,
    kiasi:     Number(r.kiasi) || 0,
    tarehe:    r.tarehe,
    maelezo:   r.maelezo || '',
    adminId:   r.admin_id || '',
    createdAt: r.created_at,
  };
}

/**
 * Attach repayment aggregates (jumlaIlipolipwa, saladoBaki, count) to a loan object.
 * Also auto-updates hali to 'imelipwa' if fully paid.
 */
function enrichLoan(loan) {
  const rows = db.all(
    'SELECT COALESCE(SUM(kiasi),0) AS total, COUNT(*) AS cnt FROM marejesho_mikopo WHERE mkopo_id = ?',
    [loan.id]
  );
  const paid  = Number(rows[0]?.total) || 0;
  const count = Number(rows[0]?.cnt)   || 0;
  loan.jumlaIlipolipwa = paid;
  loan.saladoBaki      = Math.max(0, loan.jumlaKulipa - paid);
  loan.marejeshoCount  = count;

  // Auto-update hali if fully paid
  if (loan.saladoBaki === 0 && loan.jumlaKulipa > 0 && loan.hali !== 'imelipwa') {
    db.run("UPDATE mikopo SET hali = 'imelipwa' WHERE id = ?", [loan.id]);
    loan.hali = 'imelipwa';
  }
  return loan;
}

/**
 * Compute hali based on due date and balance:
 *   imelipwa  — fully paid
 *   imechelewa — overdue (past due date, still balance)
 *   hai        — active, not yet due
 */
function computeHali(loan) {
  if (loan.saladoBaki <= 0) return 'imelipwa';
  const today = new Date().toISOString().slice(0, 10);
  if (loan.tareheMwisho < today) return 'imechelewa';
  return 'hai';
}

// ─── GET /api/mikopo ─────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  try {
    let rows;
    if (isOfficer(req.user)) {
      rows = db.all(`SELECT m.*, mb.jina AS member_jina FROM mikopo m
        LEFT JOIN members mb ON mb.id = m.member_id ORDER BY m.created_at DESC`);
    } else {
      // Member sees own loans only
      rows = db.all(`SELECT m.*, mb.jina AS member_jina FROM mikopo m
        LEFT JOIN members mb ON mb.id = m.member_id
        WHERE m.member_id = ? ORDER BY m.created_at DESC`, [req.user.memberId]);
    }
    const loans = rows.map(r => enrichLoan(rowToLoan(r)));
    loans.forEach(l => {
      const nh = computeHali(l);
      if (nh !== l.hali) { db.run('UPDATE mikopo SET hali=? WHERE id=?',[nh,l.id]); l.hali=nh; }
    });
    res.json(loans);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/mikopo/member/:memberId ────────────────────────────────────────
router.get('/member/:memberId', requireAuth, (req, res) => {
  try {
    // Member can only fetch their own — enforce
    const targetId = isOfficer(req.user) ? req.params.memberId : req.user.memberId;
    const rows = db.all(`SELECT m.*, mb.jina AS member_jina FROM mikopo m
      LEFT JOIN members mb ON mb.id = m.member_id
      WHERE m.member_id = ? ORDER BY m.created_at DESC`, [targetId]);
    const loans = rows.map(r => enrichLoan(rowToLoan(r)));
    loans.forEach(l => {
      const nh = computeHali(l);
      if (nh !== l.hali) { db.run('UPDATE mikopo SET hali=? WHERE id=?',[nh,l.id]); l.hali=nh; }
    });
    res.json(loans);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/mikopo/:id ─────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  try {
    const row = db.get(`SELECT m.*, mb.jina AS member_jina FROM mikopo m
      LEFT JOIN members mb ON mb.id = m.member_id WHERE m.id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Mkopo haukupatikana.' });
    // Member can only view their own loan
    if (!isOfficer(req.user) && row.member_id !== req.user.memberId) {
      return res.status(403).json({ error: 'Huna ruhusa kuona mkopo huu.' });
    }
    const loan = enrichLoan(rowToLoan(row));
    loan.marejesho = db.all(
      'SELECT * FROM marejesho_mikopo WHERE mkopo_id = ? ORDER BY tarehe ASC, created_at ASC',
      [req.params.id]).map(rowToRepayment);
    res.json(loan);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/mikopo  (create loan) — admin only ────────────────────────────
router.post('/', requireAdmin, (req, res) => {
  try {
    const {
      memberId, kiasi, ribaAsilimia = 0,
      tarehekutoa, tareheMwisho, mieziYaKulipa = 1,
      maelezo = ''
    } = req.body;

    if (!memberId || !kiasi || !tarehekutoa || !tareheMwisho) {
      return res.status(400).json({ error: 'memberId, kiasi, tarehekutoa na tareheMwisho vinahitajika.' });
    }
    const member = db.get('SELECT id FROM members WHERE id = ?', [memberId]);
    if (!member) return res.status(404).json({ error: 'Mwanachama hakupatikana.' });

    const kiasiNum      = Number(kiasi)        || 0;
    const ribaNum       = Number(ribaAsilimia) || 0;
    const kiasiRiba     = Math.round(kiasiNum * ribaNum / 100);
    const jumlaKulipa   = kiasiNum + kiasiRiba;

    const id = uid();
    db.run(`
      INSERT INTO mikopo
        (id, member_id, kiasi, riba_asilimia, kiasi_riba, jumla_kulipa,
         tarehe_kutoa, tarehe_mwisho, miezi_ya_kulipa, hali, maelezo, admin_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'hai', ?, ?, ?)`,
      [id, memberId, kiasiNum, ribaNum, kiasiRiba, jumlaKulipa,
       tarehekutoa, tareheMwisho, Number(mieziYaKulipa) || 1,
       maelezo.trim(), req.admin.id, Date.now()]
    );
    const row = db.get(`
      SELECT m.*, mb.jina AS member_jina FROM mikopo m
      LEFT JOIN members mb ON mb.id = m.member_id WHERE m.id = ?`, [id]);
    res.status(201).json(enrichLoan(rowToLoan(row)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/mikopo/:id  (edit loan) — admin only ───────────────────────────
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const {
      kiasi, ribaAsilimia = 0, tarehekutoa, tareheMwisho,
      mieziYaKulipa = 1, hali, maelezo = ''
    } = req.body;

    const existing = db.get('SELECT * FROM mikopo WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Mkopo haukupatikana.' });

    const kiasiNum    = Number(kiasi)        || Number(existing.kiasi);
    const ribaNum     = Number(ribaAsilimia) || Number(existing.riba_asilimia);
    const kiasiRiba   = Math.round(kiasiNum * ribaNum / 100);
    const jumlaKulipa = kiasiNum + kiasiRiba;

    db.run(`
      UPDATE mikopo SET
        kiasi = ?, riba_asilimia = ?, kiasi_riba = ?, jumla_kulipa = ?,
        tarehe_kutoa = ?, tarehe_mwisho = ?, miezi_ya_kulipa = ?,
        hali = ?, maelezo = ?
      WHERE id = ?`,
      [kiasiNum, ribaNum, kiasiRiba, jumlaKulipa,
       tarehekutoa || existing.tarehe_kutoa,
       tareheMwisho || existing.tarehe_mwisho,
       Number(mieziYaKulipa) || 1,
       hali || existing.hali,
       maelezo.trim(), req.params.id]
    );
    const row = db.get(`
      SELECT m.*, mb.jina AS member_jina FROM mikopo m
      LEFT JOIN members mb ON mb.id = m.member_id WHERE m.id = ?`, [req.params.id]);
    res.json(enrichLoan(rowToLoan(row)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/mikopo/:id — admin only ─────────────────────────────────────
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    db.run('DELETE FROM marejesho_mikopo WHERE mkopo_id = ?', [req.params.id]);
    db.run('DELETE FROM mikopo WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/mikopo/:id/marejesho ───────────────────────────────────────────
router.get('/:id/marejesho', requireAuth, (req, res) => {
  try {
    // Check loan ownership for members
    if (!isOfficer(req.user)) {
      const loan = db.get('SELECT member_id FROM mikopo WHERE id = ?', [req.params.id]);
      if (!loan || loan.member_id !== req.user.memberId) {
        return res.status(403).json({ error: 'Huna ruhusa kuona marejesho haya.' });
      }
    }
    const rows = db.all(
      'SELECT * FROM marejesho_mikopo WHERE mkopo_id = ? ORDER BY tarehe ASC, created_at ASC',
      [req.params.id]);
    res.json(rows.map(rowToRepayment));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/mikopo/:id/marejesho — admin only ─────────────────────────────
router.post('/:id/marejesho', requireAdmin, (req, res) => {
  try {
    const { kiasi, tarehe, maelezo = '' } = req.body;
    if (!kiasi || !tarehe) {
      return res.status(400).json({ error: 'kiasi na tarehe vinahitajika.' });
    }
    const loan = db.get('SELECT * FROM mikopo WHERE id = ?', [req.params.id]);
    if (!loan) return res.status(404).json({ error: 'Mkopo haukupatikana.' });

    const id = uid();
    db.run(`
      INSERT INTO marejesho_mikopo (id, mkopo_id, member_id, kiasi, tarehe, maelezo, admin_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, loan.member_id,
       Number(kiasi) || 0, tarehe, maelezo.trim(), req.admin.id, Date.now()]
    );

    // Update hali after repayment
    const row = db.get(`
      SELECT m.*, mb.jina AS member_jina FROM mikopo m
      LEFT JOIN members mb ON mb.id = m.member_id WHERE m.id = ?`, [req.params.id]);
    const enriched = enrichLoan(rowToLoan(row));
    const newHali  = computeHali(enriched);
    if (newHali !== enriched.hali) {
      db.run('UPDATE mikopo SET hali = ? WHERE id = ?', [newHali, req.params.id]);
      enriched.hali = newHali;
    }

    const repayment = db.get('SELECT * FROM marejesho_mikopo WHERE id = ?', [id]);
    res.status(201).json({ repayment: rowToRepayment(repayment), loan: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/mikopo/:id/marejesho/:rId — admin only ──────────────────────
router.delete('/:id/marejesho/:rId', requireAdmin, (req, res) => {
  try {
    db.run('DELETE FROM marejesho_mikopo WHERE id = ? AND mkopo_id = ?',
      [req.params.rId, req.params.id]);
    // Re-evaluate hali after deletion
    const row = db.get(`
      SELECT m.*, mb.jina AS member_jina FROM mikopo m
      LEFT JOIN members mb ON mb.id = m.member_id WHERE m.id = ?`, [req.params.id]);
    if (row) {
      const enriched = enrichLoan(rowToLoan(row));
      const newHali  = computeHali(enriched);
      db.run('UPDATE mikopo SET hali = ? WHERE id = ?', [newHali, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
