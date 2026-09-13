/**
 * api/index.js  —  Central API client
 *
 * BASE URL: VITE_API_URL env var (defaults to /api → proxied to localhost:5000)
 */
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = localStorage.getItem('kikoba_token');
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res  = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login            = (body)       => req('POST',   '/auth/login',            body);
export const setupAdmin       = (body)       => req('POST',   '/auth/setup',            body);
export const getMe            = ()           => req('GET',    '/auth/me-any');          // works for both roles
export const getAdmins        = ()           => req('GET',    '/auth/admins');
export const createAdmin      = (body)       => req('POST',   '/auth/admins',           body);
export const updateAdmin      = (id, body)   => req('PUT',    `/auth/admins/${id}`,     body);
export const deleteAdmin      = (id)         => req('DELETE', `/auth/admins/${id}`);

// Member portal accounts
export const getMemberAccounts    = ()           => req('GET',    '/auth/member-accounts');
export const createMemberAccount  = (body)       => req('POST',   '/auth/member-accounts',      body);
export const updateMemberAccount  = (id, body)   => req('PUT',    `/auth/member-accounts/${id}`, body);
export const deleteMemberAccount  = (id)         => req('DELETE', `/auth/member-accounts/${id}`);

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings    = ()       => req('GET', '/settings');
export const saveSettings   = (body)   => req('PUT', '/settings', body);
export const getBeiHistoria = ()       => req('GET', '/settings/historia');

// ── Members ───────────────────────────────────────────────────────────────────
export const getMembers   = ()          => req('GET',    '/members');
export const createMember = (body)      => req('POST',   '/members',       body);
export const updateMember = (id, body)  => req('PUT',    `/members/${id}`, body);
export const deleteMember = (id)        => req('DELETE', `/members/${id}`);

// ── Entries ───────────────────────────────────────────────────────────────────
export const getEntries   = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return req('GET', `/entries${qs ? '?' + qs : ''}`);
};
export const createEntry  = (body)      => req('POST',   '/entries',       body);
export const updateEntry  = (id, body)  => req('PUT',    `/entries/${id}`, body);
export const deleteEntry  = (id)        => req('DELETE', `/entries/${id}`);

// ── Mikopo (Loans) ────────────────────────────────────────────────────────────
export const getMikopo          = ()          => req('GET',    '/mikopo');
export const getMkopoByMember   = (memberId)  => req('GET',    `/mikopo/member/${memberId}`);
export const getMkopoById       = (id)        => req('GET',    `/mikopo/${id}`);
export const createMkopo        = (body)      => req('POST',   '/mikopo',           body);
export const updateMkopo        = (id, body)  => req('PUT',    `/mikopo/${id}`,     body);
export const deleteMkopo        = (id)        => req('DELETE', `/mikopo/${id}`);

// Repayments
export const getMarejesho    = (mkopoId)       => req('GET',    `/mikopo/${mkopoId}/marejesho`);
export const createMarejesho = (mkopoId, body) => req('POST',   `/mikopo/${mkopoId}/marejesho`, body);
export const deleteMarejesho = (mkopoId, rId)  => req('DELETE', `/mikopo/${mkopoId}/marejesho/${rId}`);
