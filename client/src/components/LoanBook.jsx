import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App.jsx';
import * as api from '../api/index.js';
import { fmt, todayISO, MONTHS_SW } from '../utils.js';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function dateLabel(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDate() + ' ' + MONTHS_SW[d.getMonth()] + ' ' + d.getFullYear();
}

/** Add N months to an ISO date string, return ISO date */
function addMonths(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setMonth(d.getMonth() + Number(n));
  return d.toISOString().slice(0, 10);
}

const HALI_LABEL = { hai: 'Hai', imelipwa: 'Imelipwa', imechelewa: 'Imechelewa' };
const HALI_CLASS = { hai: 'badge-hai', imelipwa: 'badge-imelipwa', imechelewa: 'badge-imechelewa' };

const EMPTY_LOAN = {
  memberId: '', kiasi: '', ribaAsilimia: 10,
  tarehekutoa: todayISO(), mieziYaKulipa: 3,
  tareheMwisho: '', maelezo: '',
};
const EMPTY_REP = { kiasi: '', tarehe: todayISO(), maelezo: '' };

/* ─── sub-component: progress bar ──────────────────────────────────────────── */
function RepayProgress({ paid, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <div className="repay-progress-wrap">
      <div className="repay-progress-bar" style={{ width: pct + '%' }} />
      <span className="repay-progress-label">{pct}%</span>
    </div>
  );
}

/* ─── sub-component: single loan card ──────────────────────────────────────── */
function LoanCard({ loan, isAdmin, onRepayment, onEdit, onDelete }) {
  const [expanded, setExpanded]   = useState(false);
  const [repForm,  setRepForm]    = useState(EMPTY_REP);
  const [repSaving, setRepSaving] = useState(false);
  const [repFlash,  setRepFlash]  = useState(null);
  const [detail,    setDetail]    = useState(null); // full loan with marejesho[]
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function toggleDetail() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (!detail) {
      setLoadingDetail(true);
      try {
        const d = await api.getMkopoById(loan.id);
        setDetail(d);
      } catch { /* ignore */ }
      setLoadingDetail(false);
    }
  }

  async function submitRep(e) {
    e.preventDefault();
    setRepSaving(true);
    try {
      const result = await api.createMarejesho(loan.id, repForm);
      setDetail(prev => prev ? {
        ...result.loan,
        marejesho: [...(prev.marejesho || []), result.repayment]
      } : null);
      setRepForm(EMPTY_REP);
      setRepFlash({ msg: 'Malipo yamehifadhiwa.', type: 'ok' });
      setTimeout(() => setRepFlash(null), 3500);
      onRepayment(result.loan); // bubble updated loan up
    } catch (err) {
      setRepFlash({ msg: err.message, type: 'error' });
      setTimeout(() => setRepFlash(null), 4000);
    } finally {
      setRepSaving(false);
    }
  }

  async function deleteRep(rId) {
    if (!confirm('Futa rekodi hii ya malipo?')) return;
    try {
      await api.deleteMarejesho(loan.id, rId);
      const updated = await api.getMkopoById(loan.id);
      setDetail(updated);
      onRepayment(updated);
    } catch (err) {
      setRepFlash({ msg: err.message, type: 'error' });
    }
  }

  // Compute instalment suggestion
  const instalmentSugg = loan.mieziYaKulipa > 0
    ? Math.ceil(loan.jumlaKulipa / loan.mieziYaKulipa)
    : loan.jumlaKulipa;

  const marejeshoList = detail?.marejesho || [];

  return (
    <div className={`loan-card loan-card--${loan.hali}`}>
      {/* ── Summary row ── */}
      <div className="loan-card-header" onClick={toggleDetail} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && toggleDetail()}>
        <div className="loan-card-left">
          <span className={`loan-badge ${HALI_CLASS[loan.hali]}`}>
            {HALI_LABEL[loan.hali] || loan.hali}
          </span>
          <div className="loan-card-amounts">
            <span className="loan-amount-main">TZS {fmt(loan.kiasi)}</span>
            <span className="loan-amount-sub">
              + riba {loan.ribaAsilimia}% = <strong>TZS {fmt(loan.jumlaKulipa)}</strong>
            </span>
          </div>
        </div>
        <div className="loan-card-right">
          <div className="loan-dates">
            <span>Kutolewa: <strong>{dateLabel(loan.tarehekutoa)}</strong></span>
            <span>Mwisho: <strong className={loan.hali === 'imechelewa' ? 'text-red' : ''}>
              {dateLabel(loan.tareheMwisho)}
            </strong></span>
            <span>{loan.mieziYaKulipa} miezi</span>
          </div>
          <div className="loan-card-chevron">{expanded ? '▲' : '▼'}</div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="loan-card-progress">
        <div className="loan-progress-labels">
          <span>Imelipwa: <strong className="text-green">TZS {fmt(loan.jumlaIlipolipwa)}</strong></span>
          <span>Baki: <strong className={loan.saladoBaki > 0 ? 'text-red' : 'text-green'}>
            TZS {fmt(loan.saladoBaki)}
          </strong></span>
        </div>
        <RepayProgress paid={loan.jumlaIlipolipwa} total={loan.jumlaKulipa} />
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="loan-card-body">
          {loan.maelezo && (
            <p className="loan-maelezo">📝 {loan.maelezo}</p>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div className="loan-admin-actions">
              <button className="btn-link" onClick={() => onEdit(loan)}>Hariri Mkopo</button>
              <button className="btn-danger" onClick={() => onDelete(loan.id)}>Futa Mkopo</button>
            </div>
          )}

          {/* ── Repayment history table ── */}
          <h4 className="loan-section-title">Historia ya Marejesho</h4>
          {loadingDetail ? (
            <div className="empty-state" style={{ padding: '10px 0' }}>Inapakia...</div>
          ) : marejeshoList.length === 0 ? (
            <div className="empty-state" style={{ padding: '10px 0' }}>
              Hakuna malipo yaliyorekodiwa bado.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tarehe</th>
                    <th>Kiasi Kilicholipwa</th>
                    <th>Maelezo</th>
                    {isAdmin && <th>Futa</th>}
                  </tr>
                </thead>
                <tbody>
                  {marejeshoList.map((r, i) => (
                    <tr key={r.id}>
                      <td className="td-center">{i + 1}</td>
                      <td>{dateLabel(r.tarehe)}</td>
                      <td className="td-num">TZS {fmt(r.kiasi)}</td>
                      <td style={{ fontSize: 12, color: '#6a6252' }}>{r.maelezo || '—'}</td>
                      {isAdmin && (
                        <td className="td-center">
                          <button className="btn-danger" onClick={() => deleteRep(r.id)}>Futa</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Running totals row */}
                  <tr className="row-subtotal">
                    <td colSpan={2} style={{ fontWeight: 700 }}>JUMLA ILIYOLIPWA</td>
                    <td className="td-num">TZS {fmt(loan.jumlaIlipolipwa)}</td>
                    <td colSpan={isAdmin ? 2 : 1} />
                  </tr>
                  <tr style={{ background: loan.saladoBaki > 0 ? '#FFF0EE' : '#EEF8F2' }}>
                    <td colSpan={2} style={{ fontWeight: 700 }}>BAKI YA KULIPA</td>
                    <td className="td-num" style={{ fontWeight: 700, color: loan.saladoBaki > 0 ? 'var(--red)' : 'var(--green)' }}>
                      TZS {fmt(loan.saladoBaki)}
                    </td>
                    <td colSpan={isAdmin ? 2 : 1} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── Add repayment form (admin only) ── */}
          {isAdmin && loan.hali !== 'imelipwa' && (
            <div className="loan-rep-form">
              <h4 className="loan-section-title">Ingiza Malipo</h4>
              {repFlash && (
                <div className={`flash${repFlash.type === 'error' ? ' error' : ''}`} style={{ marginBottom: 8 }}>
                  {repFlash.msg}
                </div>
              )}
              <form onSubmit={submitRep} noValidate>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
                  <div className="form-field">
                    <label className="form-label">Kiasi (TZS)</label>
                    <input className="form-input" type="number" min="1" required
                      placeholder={`Pendekezo: ${fmt(instalmentSugg)}`}
                      value={repForm.kiasi}
                      onChange={e => setRepForm(f => ({ ...f, kiasi: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Tarehe ya Malipo</label>
                    <input className="form-input" type="date" required
                      value={repForm.tarehe}
                      onChange={e => setRepForm(f => ({ ...f, tarehe: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Maelezo (hiari)</label>
                    <input className="form-input" type="text"
                      placeholder="mf. Malipo ya kwanza"
                      value={repForm.maelezo}
                      onChange={e => setRepForm(f => ({ ...f, maelezo: e.target.value }))} />
                  </div>
                </div>
                <div className="row-actions">
                  <button type="submit" className="btn-primary" disabled={repSaving}>
                    {repSaving ? 'Inahifadhi...' : 'Hifadhi Malipo'}
                  </button>
                  <span className="field-hint" style={{ alignSelf: 'center' }}>
                    Baki baada ya malipo: TZS {fmt(Math.max(0, loan.saladoBaki - (Number(repForm.kiasi) || 0)))}
                  </span>
                </div>
              </form>
            </div>
          )}

          {loan.hali === 'imelipwa' && (
            <div className="loan-paid-notice">✓ Mkopo huu umelipwa kikamilifu.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LoanBook() {
  const { members, isAdmin } = useApp();

  /* ── State ── */
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [flash,   setFlash]   = useState(null);

  // Loan form
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState(EMPTY_LOAN);
  const [saving, setSaving]       = useState(false);

  /* ── Init: pick first member ── */
  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [members]);

  /* ── Load loans when member changes ── */
  useEffect(() => {
    if (!selectedMemberId) return;
    fetchLoans(selectedMemberId);
  }, [selectedMemberId]);

  const fetchLoans = useCallback(async (mid) => {
    setLoading(true);
    try {
      const data = await api.getMkopoByMember(mid || selectedMemberId);
      setLoans(data);
    } catch (err) {
      setFlash({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedMemberId]);

  function flashMsg(msg, type = 'ok') {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 4000);
  }

  /* ── Form helpers ── */
  function openNewForm() {
    setForm({ ...EMPTY_LOAN, memberId: selectedMemberId, tarehekutoa: todayISO() });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEditForm(loan) {
    setForm({
      memberId:      loan.memberId,
      kiasi:         loan.kiasi,
      ribaAsilimia:  loan.ribaAsilimia,
      tarehekutoa:   loan.tarehekutoa,
      mieziYaKulipa: loan.mieziYaKulipa,
      tareheMwisho:  loan.tareheMwisho,
      maelezo:       loan.maelezo,
    });
    setEditingId(loan.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_LOAN);
  }

  // Auto-calculate tareheMwisho when kutoa date or miezi changes
  function setField(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'tarehekutoa' || field === 'mieziYaKulipa') {
        const base = field === 'tarehekutoa' ? value : f.tarehekutoa;
        const m    = field === 'mieziYaKulipa' ? value : f.mieziYaKulipa;
        if (base && m) next.tareheMwisho = addMonths(base, m);
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.memberId || !form.kiasi || !form.tarehekutoa || !form.tareheMwisho) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.updateMkopo(editingId, form);
        setLoans(prev => prev.map(l => l.id === editingId ? { ...updated, marejesho: l.marejesho } : l));
        flashMsg('Mkopo umesasishwa.');
      } else {
        const created = await api.createMkopo(form);
        if (created.memberId === selectedMemberId) {
          setLoans(prev => [created, ...prev]);
        }
        flashMsg('Mkopo mpya umehifadhiwa.');
      }
      cancelForm();
    } catch (err) {
      flashMsg(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Una uhakika unataka kufuta mkopo huu? Marejesho yake yote pia yatafutwa.')) return;
    try {
      await api.deleteMkopo(id);
      setLoans(prev => prev.filter(l => l.id !== id));
      flashMsg('Mkopo umefutwa.');
    } catch (err) {
      flashMsg(err.message, 'error');
    }
  }

  // Bubble updated loan from LoanCard (after repayment)
  function handleRepayment(updatedLoan) {
    setLoans(prev => prev.map(l => l.id === updatedLoan.id ? { ...updatedLoan, marejesho: l.marejesho } : l));
  }

  /* ── Stats for selected member ── */
  const totalLoans     = loans.length;
  const totalKiasi     = loans.reduce((s, l) => s + l.kiasi, 0);
  const totalIlipolipwa = loans.reduce((s, l) => s + l.jumlaIlipolipwa, 0);
  const totalBaki      = loans.reduce((s, l) => s + l.saladoBaki, 0);
  const activeLoans    = loans.filter(l => l.hali === 'hai').length;
  const overdueLoans   = loans.filter(l => l.hali === 'imechelewa').length;
  const paidLoans      = loans.filter(l => l.hali === 'imelipwa').length;

  const selectedMember = members.find(m => m.id === selectedMemberId);

  if (members.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">Sajili wanachama kwanza kwenye tab ya <strong>Wanachama</strong>.</div>
      </div>
    );
  }

  /* Preview calculation while filling form */
  const previewKiasi     = Number(form.kiasi)       || 0;
  const previewRiba      = Number(form.ribaAsilimia) || 0;
  const previewKiasiRiba = Math.round(previewKiasi * previewRiba / 100);
  const previewJumla     = previewKiasi + previewKiasiRiba;

  return (
    <>
      {/* ══ Member selector ══ */}
      <div className="card no-print">
        <h2>Kitabu cha Mikopo</h2>
        <p className="hint">Chagua mwanachama kuona mikopo yake yote, historia ya marejesho na hali ya kila mkopo.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1, minWidth: 200, maxWidth: 380 }}>
            <label className="form-label">Mwanachama</label>
            <select className="form-select" value={selectedMemberId}
              onChange={e => { setSelectedMemberId(e.target.value); setShowForm(false); }}>
              {members.map(m => <option key={m.id} value={m.id}>{m.jina}</option>)}
            </select>
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={openNewForm}
              style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
              + Toa Mkopo Mpya
            </button>
          )}
        </div>
      </div>

      {flash && <div className={`flash${flash.type === 'error' ? ' error' : ''}`}>{flash.msg}</div>}

      {/* ══ New / Edit loan form ══ */}
      {showForm && isAdmin && (
        <div className="card" id="loan-form-card">
          <h2>{editingId ? 'Hariri Mkopo' : 'Toa Mkopo Mpya'}</h2>
          <p className="hint">Thamani ya riba na tarehe ya mwisho vinajihesabu kiotomatiki.</p>
          <form onSubmit={handleSubmit} noValidate>

            {/* Member */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr', maxWidth: 380, marginBottom: 14 }}>
              <div className="form-field">
                <label className="form-label">Mwanachama *</label>
                <select className="form-select" required value={form.memberId}
                  onChange={e => setField('memberId', e.target.value)}>
                  {members.map(m => <option key={m.id} value={m.id}>{m.jina}</option>)}
                </select>
              </div>
            </div>

            {/* Amounts */}
            <div className="section-group" style={{ marginBottom: 14 }}>
              <div className="section-group-title">KIASI CHA MKOPO</div>
              <div className="section-group-body">
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
                  <div className="form-field">
                    <label className="form-label">Kiasi cha Mkopo (TZS) *</label>
                    <input className="form-input mkt-input" type="number" min="1" required
                      value={form.kiasi}
                      onChange={e => setField('kiasi', e.target.value)}
                      placeholder="mf. 500,000" />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Riba (%)</label>
                    <input className="form-input" type="number" min="0" step="0.1"
                      value={form.ribaAsilimia}
                      onChange={e => setField('ribaAsilimia', e.target.value)} />
                    <span className="field-hint">0 = hakuna riba</span>
                  </div>
                </div>
                {/* Preview */}
                {previewKiasi > 0 && (
                  <div className="mkt-preview" style={{ marginTop: 8, marginBottom: 0 }}>
                    <span className="mkt-preview-title">Hesabu:</span>
                    <span>TZS {fmt(previewKiasi)} + {previewRiba}% riba</span>
                    <span>= Riba: <strong>TZS {fmt(previewKiasiRiba)}</strong></span>
                    <span>= Jumla: <strong>TZS {fmt(previewJumla)}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="section-group" style={{ marginBottom: 14 }}>
              <div className="section-group-title">MUDA WA KULIPA</div>
              <div className="section-group-body">
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
                  <div className="form-field">
                    <label className="form-label">Tarehe ya Kutoa *</label>
                    <input className="form-input" type="date" required
                      value={form.tarehekutoa}
                      onChange={e => setField('tarehekutoa', e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Miezi ya Kulipa</label>
                    <input className="form-input" type="number" min="1" max="60"
                      value={form.mieziYaKulipa}
                      onChange={e => setField('mieziYaKulipa', e.target.value)} />
                    <span className="field-hint">Italingana na tarehe ya mwisho</span>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Tarehe ya Mwisho *</label>
                    <input className="form-input" type="date" required
                      value={form.tareheMwisho}
                      onChange={e => setField('tareheMwisho', e.target.value)} />
                  </div>
                </div>
                {previewKiasi > 0 && form.mieziYaKulipa > 0 && (
                  <div className="field-hint" style={{ marginTop: 6 }}>
                    Kiwango cha kila mwezi (takriban):
                    TZS {fmt(Math.ceil(previewJumla / form.mieziYaKulipa))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-field" style={{ maxWidth: 480, marginBottom: 16 }}>
              <label className="form-label">Maelezo (hiari)</label>
              <input className="form-input" type="text"
                placeholder="mf. Mkopo wa biashara"
                value={form.maelezo}
                onChange={e => setField('maelezo', e.target.value)} />
            </div>

            <div className="row-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Inahifadhi...' : editingId ? 'Hifadhi Mabadiliko' : 'Toa Mkopo'}
              </button>
              <button type="button" className="btn-ghost" onClick={cancelForm}>Ghairi</button>
            </div>
          </form>
        </div>
      )}

      {/* ══ Member stats ══ */}
      {selectedMember && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedMember.jina}</h2>
              <p className="hint" style={{ margin: '2px 0 0' }}>
                Namba: {selectedMember.namba || '—'} · Simu: {selectedMember.simu || '—'}
              </p>
            </div>
            <button className="btn-ghost no-print" onClick={() => window.print()}>Chapisha</button>
          </div>

          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
            <div className="stat-card">
              <div className="stat-key">Mikopo Yote</div>
              <div className="stat-val">{totalLoans}</div>
            </div>
            <div className="stat-card">
              <div className="stat-key">Jumla ya Mikopo</div>
              <div className="stat-val" style={{ fontSize: 16 }}>TZS {fmt(totalKiasi)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-key">Imelipwa</div>
              <div className="stat-val" style={{ color: 'var(--green)' }}>TZS {fmt(totalIlipolipwa)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-key">Baki ya Kulipa</div>
              <div className="stat-val" style={{ color: totalBaki > 0 ? 'var(--red)' : 'var(--green)', fontSize: 16 }}>
                TZS {fmt(totalBaki)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-key">Hai</div>
              <div className="stat-val">{activeLoans}</div>
            </div>
            <div className="stat-card">
              <div className="stat-key">Imechelewa</div>
              <div className="stat-val" style={{ color: overdueLoans > 0 ? 'var(--red)' : 'inherit' }}>
                {overdueLoans}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-key">Imelipwa Kamili</div>
              <div className="stat-val" style={{ color: 'var(--green)' }}>{paidLoans}</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Loans list ══ */}
      <div className="card">
        <h2>Mikopo ya {selectedMember?.jina || '—'}</h2>
        {loading ? (
          <div className="loading" style={{ padding: '20px 0' }}>Inapakia mikopo...</div>
        ) : loans.length === 0 ? (
          <div className="empty-state">
            Hakuna mkopo uliosajiliwa kwa mwanachama huyu.
            {isAdmin && (
              <div style={{ marginTop: 12 }}>
                <button className="btn-primary" onClick={openNewForm}>+ Toa Mkopo wa Kwanza</button>
              </div>
            )}
          </div>
        ) : (
          <div className="loans-list">
            {loans.map(loan => (
              <LoanCard
                key={loan.id}
                loan={loan}
                isAdmin={isAdmin}
                onRepayment={handleRepayment}
                onEdit={openEditForm}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
