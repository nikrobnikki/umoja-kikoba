import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import * as api from '../api/index.js';
import { fmt } from '../utils.js';

const EMPTY_FORM = { jina: '', namba: '', simu: '' };

export default function Members() {
  const { members, entries, isAdmin, refreshMembers, refreshEntries, handleLogout } = useApp();
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [flash, setFlash]         = useState(null);
  const [saving, setSaving]       = useState(false);

  function flash_(msg, type = 'ok') {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 4000);
  }

  function startEdit(m) {
    setEditingId(m.id);
    setForm({ jina: m.jina, namba: m.namba || '', simu: m.simu || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.jina.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateMember(editingId, form);
        flash_('Mabadiliko yamehifadhiwa.');
        setEditingId(null);
        setForm(EMPTY_FORM);
      } else {
        await api.createMember(form);
        flash_('Mwanachama amesajiliwa.');
        setForm(EMPTY_FORM);
      }
      await refreshMembers();
    } catch (err) {
      if (err.message.includes('msimamizi') || err.message.includes('token')) {
        handleLogout();
      }
      flash_(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m) {
    if (!confirm(`Una uhakika unataka kumfuta "${m.jina}"?\nKumbukumbu zake za michango pia zitafutwa.`)) return;
    try {
      await api.deleteMember(m.id);
      await refreshMembers();
      await refreshEntries();
      flash_('Mwanachama amefutwa.');
    } catch (err) {
      flash_(err.message, 'error');
    }
  }

  function memberTotals(memberId) {
    const me = entries.filter(e => e.memberId === memberId);
    return me.reduce(
      (acc, e) => ({
        hisaIdadi:   acc.hisaIdadi   + (Number(e.hisaIdadi)   || 0),
        hisaThamani: acc.hisaThamani + (Number(e.hisaThamani) || 0),
        jamii:       acc.jamii       + (Number(e.jamii)       || 0),
      }),
      { hisaIdadi: 0, hisaThamani: 0, jamii: 0 }
    );
  }

  return (
    <>
      {/* ── Admin-only: registration form ── */}
      {isAdmin ? (
        <div className="card">
          <h2>{editingId ? 'Hariri Mwanachama' : 'Sajili Mwanachama Mpya'}</h2>
          <p className="hint">Jaza taarifa za mwanachama ili aweze kuanza kuingiza hisa na jamii.</p>

          {flash && <div className={`flash${flash.type === 'error' ? ' error' : ''}`}>{flash.msg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Jina Kamili *</label>
                <input
                  className="form-input"
                  required
                  value={form.jina}
                  onChange={e => setForm(f => ({ ...f, jina: e.target.value }))}
                  placeholder="mf. Joram Mwasapile"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Namba ya Usajili (hiari)</label>
                <input
                  className="form-input"
                  value={form.namba}
                  onChange={e => setForm(f => ({ ...f, namba: e.target.value }))}
                  placeholder="mf. KB-014"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Namba ya Simu (hiari)</label>
                <input
                  className="form-input"
                  value={form.simu}
                  onChange={e => setForm(f => ({ ...f, simu: e.target.value }))}
                  placeholder="mf. 0765xxxxxx"
                />
              </div>
            </div>
            <div className="row-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Inahifadhi...' : editingId ? 'Hifadhi Mabadiliko' : 'Sajili Mwanachama'}
              </button>
              {editingId && (
                <button type="button" className="btn-ghost" onClick={cancelEdit}>Ghairi</button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* Non-admin: read-only notice */
        <div className="card">
          <div className="admin-notice">
            <span className="admin-notice-icon">🔒</span>
            <div>
              <strong>Tazama tu</strong>
              <p>Usajili, uhariri, na ufutaji wa wanachama unafanywa na <strong>msimamizi</strong> tu.</p>
            </div>
          </div>
          {flash && <div className={`flash${flash.type === 'error' ? ' error' : ''}`}>{flash.msg}</div>}
        </div>
      )}

      {/* ── Members list (visible to all) ── */}
      <div className="card">
        <h2>Orodha ya Wanachama ({members.length})</h2>
        {members.length === 0 ? (
          <div className="empty-state">Hakuna mwanachama bado.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>NA</th>
                  <th>Jina</th>
                  <th>Namba</th>
                  <th>Simu</th>
                  <th>Jumla Hisa</th>
                  <th>Thamani (TZS)</th>
                  <th>Jumla Jamii</th>
                  {isAdmin && <th>Vitendo</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const t = memberTotals(m.id);
                  return (
                    <tr key={m.id}>
                      <td className="td-center">{i + 1}</td>
                      <td>{m.jina}</td>
                      <td>{m.namba || '-'}</td>
                      <td>{m.simu  || '-'}</td>
                      <td className="td-num">{fmt(t.hisaIdadi)}</td>
                      <td className="td-num">TZS {fmt(t.hisaThamani)}</td>
                      <td className="td-num">TZS {fmt(t.jamii)}</td>
                      {isAdmin && (
                        <td className="td-center">
                          <button className="btn-link"   onClick={() => startEdit(m)}>Hariri</button>
                          {' '}
                          <button className="btn-danger" onClick={() => handleDelete(m)}>Futa</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
