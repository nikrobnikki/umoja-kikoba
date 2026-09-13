/**
 * middleware/auth.js
 *
 * Roles hierarchy:
 *   admin | mwenyekiti | katibu | mwasibu  → OFFICER  (see everything, mutate)
 *   mwanachama                              → MEMBER   (own data only, read-only)
 *
 * Token payload for officers : { id, username, role }
 * Token payload for members  : { id, username, role:'mwanachama', memberId }
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kikoba_jwt_secret_change_me_in_production';
if (!process.env.JWT_SECRET) {
  console.warn('⚠  JWT_SECRET not set in .env — using insecure default.');
}

// Roles that can see and manage all data
const OFFICER_ROLES = new Set(['admin', 'mwenyekiti', 'katibu', 'mwasibu']);

/** Verify token and attach req.user = payload. Returns 401 if missing/invalid. */
function verifyToken(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unahitaji kuingia.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    // Back-compat: old tokens only have { id, username } → treat as admin
    if (!req.user.role) req.user.role = 'admin';
    next();
  } catch {
    return res.status(401).json({ error: 'Kikao kimekwisha. Ingia tena.' });
  }
}

/** Officer only (admin / mwenyekiti / katibu / mwasibu) */
function requireAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!OFFICER_ROLES.has(req.user.role)) {
      return res.status(403).json({ error: 'Huhitajiki ruhusa ya afisa.' });
    }
    // Keep legacy req.admin alias
    req.admin = req.user;
    next();
  });
}

/** Any authenticated user (officer OR member) */
function requireAuth(req, res, next) {
  verifyToken(req, res, next);
}

/** Helper used by routes to check if the caller is an officer */
function isOfficer(user) {
  return user && OFFICER_ROLES.has(user.role);
}

module.exports = { requireAdmin, requireAuth, verifyToken, isOfficer, JWT_SECRET, OFFICER_ROLES };
