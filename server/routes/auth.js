/**
 * routes/auth.js — Authentication for both officers and members
 *
 * POST /api/auth/setup                     — create very first admin (setup key)
 * POST /api/auth/login                     — login (officer or member)
 * GET  /api/auth/me                        — verify token, return current user
 *
 * ── Officer management (admin only) ──────────────────────────────────────────
 * GET    /api/auth/admins                  — list officers
 * POST   /api/auth/admins                  — create officer account
 * PUT    /api/auth/admins/:id              — update officer (role / password)
 * DELETE /api/auth/admins/:id              — remove officer
 *
 * ── Member account management (admin only) ───────────────────────────────────
 * GET    /api/auth/member-accounts         — list member portal accounts
 * POST   /api/auth/member-accounts         — create account for a member
 * PUT    /api/auth/member-accounts/:id     — change password / toggle active
 * DELETE /api/auth/member-accounts/:id     — remove member account
 */
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { requireAdmin, JWT_SECRET, OFFICER_ROLES } = require('../middleware/auth');

const router = express.Router();
const SETUP_KEY = process.env.SETUP_KEY || 'kikoba_setup_2026';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── POST /api/auth/setup ─────────────────────────────────────────────────────
router.post('/setup', async (req, res) => {
  try {
    const { username, password, setupKey } = req.body;
    if (setupKey !== SETUP_KEY) return res.status(403).json({ error: 'Ufunguo wa usanidi si sahihi.' });
    if (!username || !password) return res.status(400).json({ error: 'Jina la mtumiaji na nenosiri vinahitajika.' });
    // Input length limits
    if (username.length > 50)  return res.status(400).json({ error: 'Jina la mtumiaji ni refu sana (max 50).' });
    if (password.length < 6)   return res.status(400).json({ error: 'Nenosiri ni fupi sana (angalau herufi 6).' });
    if (password.length > 100) return res.status(400).json({ error: 'Nenosiri ni refu sana.' });
    if (db.get('SELECT id FROM admins LIMIT 1')) {
      return res.status(409).json({ error: 'Msimamizi tayari amesajiliwa. Tumia login.' });
    }
    db.run('INSERT INTO admins (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [uid(), username.trim().toLowerCase(), await bcrypt.hash(password, 10), 'admin', Date.now()]);
    res.status(201).json({ message: `Msimamizi "${username}" amesajiliwa.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Single endpoint — tries officers table first, then member_accounts
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Jina la mtumiaji na nenosiri vinahitajika.' });
    // Prevent oversized inputs
    if (username.length > 50 || password.length > 100) {
      return res.status(400).json({ error: 'Jina la mtumiaji au nenosiri si sahihi.' });
    }
    const uname = username.trim().toLowerCase();

    // 1. Try officer login
    const officer = db.get('SELECT * FROM admins WHERE username = ?', [uname]);
    if (officer) {
      if (!await bcrypt.compare(password, officer.password_hash)) {
        return res.status(401).json({ error: 'Jina la mtumiaji au nenosiri si sahihi.' });
      }
      const role = officer.role || 'admin';
      const token = jwt.sign({ id: officer.id, username: officer.username, role }, JWT_SECRET, { expiresIn: '8h' });
      return res.json({
        token,
        user: { id: officer.id, username: officer.username, role, type: 'officer' }
      });
    }

    // 2. Try member login
    const acct = db.get(`
      SELECT ma.*, m.jina AS member_jina
      FROM member_accounts ma
      JOIN members m ON m.id = ma.member_id
      WHERE ma.username = ?`, [uname]);
    if (acct) {
      if (!acct.active) return res.status(403).json({ error: 'Akaunti hii imezuiwa. Wasiliana na msimamizi.' });
      if (!await bcrypt.compare(password, acct.password_hash)) {
        return res.status(401).json({ error: 'Jina la mtumiaji au nenosiri si sahihi.' });
      }
      const token = jwt.sign(
        { id: acct.id, username: acct.username, role: 'mwanachama', memberId: acct.member_id },
        JWT_SECRET, { expiresIn: '8h' }
      );
      return res.json({
        token,
        user: {
          id: acct.id, username: acct.username, role: 'mwanachama',
          memberId: acct.member_id, memberJina: acct.member_jina,
          type: 'member'
        }
      });
    }

    return res.status(401).json({ error: 'Jina la mtumiaji au nenosiri si sahihi.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAdmin, (req, res) => res.json({ user: req.user }));

// Also allow members to call /me
const jwt2 = require('jsonwebtoken');
router.get('/me-any', (req, res) => {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unahitaji kuingia.' });
  try {
    const payload = jwt2.verify(token, JWT_SECRET);
    if (!payload.role) payload.role = 'admin';
    // If member, return extra info
    if (payload.role === 'mwanachama' && payload.memberId) {
      const acct = db.get(`
        SELECT ma.*, m.jina AS member_jina
        FROM member_accounts ma JOIN members m ON m.id = ma.member_id
        WHERE ma.id = ?`, [payload.id]);
      if (acct) {
        return res.json({ user: { ...payload, memberJina: acct.member_jina, type: 'member' } });
      }
    }
    res.json({ user: { ...payload, type: 'officer' } });
  } catch {
    res.status(401).json({ error: 'Kikao kimekwisha. Ingia tena.' });
  }
});

// ─── Officers CRUD ────────────────────────────────────────────────────────────
router.get('/admins', requireAdmin, (req, res) => {
  const rows = db.all('SELECT id, username, role, created_at FROM admins ORDER BY created_at ASC');
  res.json(rows.map(r => ({ id: r.id, username: r.username, role: r.role || 'admin', createdAt: r.created_at })));
});

router.post('/admins', requireAdmin, async (req, res) => {
  try {
    const { username, password, role = 'admin' } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Jina la mtumiaji na nenosiri vinahitajika.' });
    if (!OFFICER_ROLES.has(role)) return res.status(400).json({ error: `Cheo "${role}" hakitambuliwi.` });
    const uname = username.trim().toLowerCase();
    if (db.get('SELECT id FROM admins WHERE username = ?', [uname])) {
      return res.status(409).json({ error: 'Jina hilo tayari linatumika.' });
    }
    const id = uid();
    db.run('INSERT INTO admins (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, uname, await bcrypt.hash(password, 10), role, Date.now()]);
    res.status(201).json({ id, username: uname, role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/admins/:id', requireAdmin, async (req, res) => {
  try {
    const { password, role } = req.body;
    if (role && !OFFICER_ROLES.has(role)) return res.status(400).json({ error: `Cheo "${role}" hakitambuliwi.` });
    if (password) {
      db.run('UPDATE admins SET password_hash = ? WHERE id = ?', [await bcrypt.hash(password, 10), req.params.id]);
    }
    if (role) {
      db.run('UPDATE admins SET role = ? WHERE id = ?', [role, req.params.id]);
    }
    const updated = db.get('SELECT id, username, role, created_at FROM admins WHERE id = ?', [req.params.id]);
    if (!updated) return res.status(404).json({ error: 'Msimamizi hakupatikana.' });
    res.json({ id: updated.id, username: updated.username, role: updated.role });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/admins/:id', requireAdmin, (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Huwezi kujifuta mwenyewe.' });
    if (db.all('SELECT id FROM admins').length <= 1) {
      return res.status(400).json({ error: 'Lazima kuwe na afisa mmoja angalau.' });
    }
    db.run('DELETE FROM admins WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Member accounts CRUD ─────────────────────────────────────────────────────
router.get('/member-accounts', requireAdmin, (req, res) => {
  const rows = db.all(`
    SELECT ma.id, ma.member_id, ma.username, ma.active, ma.created_at, m.jina AS member_jina
    FROM member_accounts ma
    JOIN members m ON m.id = ma.member_id
    ORDER BY m.jina ASC`);
  res.json(rows.map(r => ({
    id: r.id, memberId: r.member_id, username: r.username,
    active: !!r.active, memberJina: r.member_jina, createdAt: r.created_at
  })));
});

router.post('/member-accounts', requireAdmin, async (req, res) => {
  try {
    const { memberId, username, password } = req.body;
    if (!memberId || !username || !password) {
      return res.status(400).json({ error: 'memberId, username na password vinahitajika.' });
    }
    const member = db.get('SELECT id, jina FROM members WHERE id = ?', [memberId]);
    if (!member) return res.status(404).json({ error: 'Mwanachama hakupatikana.' });

    const uname = username.trim().toLowerCase();
    // Check uniqueness across both tables
    if (db.get('SELECT id FROM admins WHERE username = ?', [uname])) {
      return res.status(409).json({ error: 'Jina hilo tayari linatumika na afisa.' });
    }
    if (db.get('SELECT id FROM member_accounts WHERE username = ?', [uname])) {
      return res.status(409).json({ error: 'Jina hilo tayari linatumika.' });
    }
    if (db.get('SELECT id FROM member_accounts WHERE member_id = ?', [memberId])) {
      return res.status(409).json({ error: 'Mwanachama huyu tayari ana akaunti.' });
    }
    const id = uid();
    db.run('INSERT INTO member_accounts (id, member_id, username, password_hash, active, created_at) VALUES (?, ?, ?, ?, 1, ?)',
      [id, memberId, uname, await bcrypt.hash(password, 10), Date.now()]);
    res.status(201).json({ id, memberId, username: uname, active: true, memberJina: member.jina });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/member-accounts/:id', requireAdmin, async (req, res) => {
  try {
    const { password, active } = req.body;
    if (password) {
      db.run('UPDATE member_accounts SET password_hash = ? WHERE id = ?',
        [await bcrypt.hash(password, 10), req.params.id]);
    }
    if (active !== undefined) {
      db.run('UPDATE member_accounts SET active = ? WHERE id = ?', [active ? 1 : 0, req.params.id]);
    }
    const row = db.get(`
      SELECT ma.id, ma.member_id, ma.username, ma.active, ma.created_at, m.jina AS member_jina
      FROM member_accounts ma JOIN members m ON m.id = ma.member_id WHERE ma.id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Akaunti haikupatikana.' });
    res.json({ id: row.id, memberId: row.member_id, username: row.username,
      active: !!row.active, memberJina: row.member_jina });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/member-accounts/:id', requireAdmin, (req, res) => {
  try {
    db.run('DELETE FROM member_accounts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
