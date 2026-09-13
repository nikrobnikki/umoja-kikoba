import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App.jsx';
import * as api from '../api/index.js';
import { fmt, isoWeek, dateLabel, getMonthWikiOptions, MONTHS_SW } from '../utils.js';

/* ── helpers ── */
function buildEmptyForm(memberId, wikiOptions, settings) {
  return {
    memberId:      memberId || '',
    tarehe:        wikiOptions[0]?.value || '',
    hisaIdadi:     Number(settings?.hisaIdadiChaguo) || 1,
    hisaThamani:   (Number(settings?.hisaIdadiChaguo) || 1) * (Number(settings?.sharePrice) || 0),
    jamii:         Number(settings?.jamiiKiwango) || 10000,
    marejeshoHisa: 0,
    marejeshoJamii:0,
    bima:          Number(settings?.bimaKiwango) || 0,
    faini:         0,
  };
}

export default function EntryForm() {
  const { members, entries, settings, isAdmin, refreshEntries } = useApp();

  /* ── Admin guard ── */
  if (!isAdmin) {
    return (
      <div className="card">
        <div className="admin-notice">
          <span className="admin-notice-icon">🔒</span>
          <div>
            <strong>Inahitaji Ruhusa ya Msimamizi</strong>
            <p>Kuingiza au kuhariri michango kunafanywa na <strong>msimamizi</strong> tu.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Mwezi / mwaka selector state ── */
  const today = new Date();
  const [selYear,  setSelYear]  = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1);

  /* ── Wiki options — huhesabiwa upya mwezi ukibadilika ── */
  const wikiOptions = useMemo(
    () => getMonthWikiOptions(selYear, selMonth),
    [selYear, selMonth]
  );

  /* ── Form state ── */
  const [form, setForm]           = useState(() => buildEmptyForm(members[0]?.id, wikiOptions, settings));
  const [editingId, setEditingId] = useState(null);
  const [flash, setFlash]         = useState(null);
  const [saving, setSaving]       = useState(false);

  /* ── Sync memberId wakati wanachama wanapakia ── */
  useEffect(() => {
    if (!form.memberId && members.length > 0) {
      setForm(f => ({ ...f, memberId: members[0].id }));
    }
  }, [members]);

  /* ── Mwezi ukibadilika: reset tarehe hadi wiki ya kwanza ya mwezi mpya ── */
  useEffect(() => {
    const firstOption = wikiOptions[0];
    if (firstOption) {
      setForm(f => ({ ...f, tarehe: firstOption.value }));
    }
  }, [wikiOptions]);

  /* ── Settings za masoko zikibadilika: sasisha defaults za fomu ── */
  useEffect(() => {
    if (!editingId) {
      setForm(f => ({
        ...f,
        hisaIdadi:    Number(settings.hisaIdadiChaguo) || 1,
        hisaThamani:  (Number(settings.hisaIdadiChaguo) || 1) * (Number(settings.sharePrice) || 0),
        jamii:        Number(settings.jamiiKiwango) || 10000,
        bima:         Number(settings.bimaKiwango) || 0,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.sharePrice, settings.jamiiKiwango, settings.bimaKiwango, settings.hisaIdadiChaguo]);

  /* ── Helpers ── */
  function flash_(msg, type = 'ok') {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 4000);
  }

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'hisaIdadi') {
        next.hisaThamani = (Number(value) || 0) * (Number(settings.sharePrice) || 0);
      }
      return next;
    });
  }

  function dateForOffset(dateStr, offset) {
    const date = new Date(`${dateStr}T00:00:00`);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  const selectedWiki = wikiOptions.find(option => option.value === form.tarehe)
    || wikiOptions.find(option => {
      const start = dateForOffset(option.value, -4);
      const end = dateForOffset(option.value, 2);
      return form.tarehe >= start && form.tarehe <= end;
    })
    || wikiOptions[0];
  const selectedWeekStart = selectedWiki ? dateForOffset(selectedWiki.value, -4) : '';
  const selectedWeekEnd = selectedWiki ? dateForOffset(selectedWiki.value, 2) : '';

  function startEdit(e) {
    // Gundua mwezi/mwaka wa entry hii na set selectors
    const d = new Date(e.tarehe + 'T00:00:00');
    setSelYear(d.getFullYear());
    setSelMonth(d.getMonth() + 1);
    setEditingId(e.id);
    setForm({
      memberId:       e.memberId,
      tarehe:         e.tarehe,
      hisaIdadi:      e.hisaIdadi,
      hisaThamani:    e.hisaThamani,
      jamii:          e.jamii,
      marejeshoHisa:  e.marejeshoHisa,
      marejeshoJamii: e.marejeshoJamii,
      bima:           e.bima,
      faini:          e.faini,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setSelYear(today.getFullYear());
    setSelMonth(today.getMonth() + 1);
    setForm(buildEmptyForm(members[0]?.id, wikiOptions, settings));
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!form.memberId || !form.tarehe) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.updateEntry(editingId, form);
        flash_('Mabadiliko yamehifadhiwa.');
        setEditingId(null);
      } else {
        await api.createEntry(form);
        flash_('Mchango umehifadhiwa.');
      }
      setForm(buildEmptyForm(form.memberId, wikiOptions, settings));
      await refreshEntries();
    } catch (err) {
      flash_(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Futa kumbukumbu hii ya mchango?')) return;
    try {
      await api.deleteEntry(id);
      await refreshEntries();
      flash_('Kumbukumbu imefutwa.');
    } catch (err) {
      flash_(err.message, 'error');
    }
  }

  function memberName(id) {
    const m = members.find(x => x.id === id);
    return m ? m.jina : '(Amefutwa)';
  }

  if (members.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          Sajili wanachama kwanza kwenye tab ya <strong>Wanachama</strong> kabla ya kuingiza michango.
        </div>
      </div>
    );
  }

  /* ── Year options: mwaka wa sasa na miaka 2 iliyopita ── */
  const yearOptions = [today.getFullYear(), today.getFullYear() - 1, today.getFullYear() - 2];

  const recent = [...entries]
    .sort((a, b) => b.tarehe.localeCompare(a.tarehe) || b.createdAt - a.createdAt)
    .slice(0, 20);

  return (
    <>
      <div className="card">
        <h2>{editingId ? 'Hariri Mchango' : 'Ingiza Mchango wa Mwanachama'}</h2>
        <p className="hint">
          Chagua mwezi na wiki — mfumo unahesabu tarehe ya Ijumaa ya wiki hiyo kiotomatiki.
          Bei ya hisa: TZS {fmt(settings.sharePrice)}.
        </p>

        {flash && <div className={`flash${flash.type === 'error' ? ' error' : ''}`}>{flash.msg}</div>}

        <form onSubmit={handleSubmit} noValidate>

          {/* ══ Row 1: Mwanachama ══ */}
          <div className="form-grid" style={{ gridTemplateColumns: '1fr', maxWidth: 400, marginBottom: 16 }}>
            <div className="form-field">
              <label className="form-label">Mwanachama *</label>
              <select
                className="form-select"
                required
                value={form.memberId}
                onChange={e => set('memberId', e.target.value)}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.jina}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ══ Wiki selector box ══ */}
          <div className="section-group" style={{ marginBottom: 16 }}>
            <div className="section-group-title">CHAGUA WIKI</div>
            <div className="section-group-body">

              {/* Mwezi + Mwaka */}
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-field">
                  <label className="form-label">Mwezi</label>
                  <select
                    className="form-select"
                    value={selMonth}
                    onChange={e => setSelMonth(Number(e.target.value))}
                  >
                    {MONTHS_SW.map((name, i) => (
                      <option key={i + 1} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Mwaka</label>
                  <select
                    className="form-select"
                    value={selYear}
                    onChange={e => setSelYear(Number(e.target.value))}
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Wiki buttons — generated automatically from month */}
              <div>
                <label className="form-label" style={{ marginBottom: 8 }}>
                  Wiki za {MONTHS_SW[selMonth - 1]} {selYear}
                  <span className="wiki-count-badge">{wikiOptions.length} wiki</span>
                </label>
                <div className="wiki-btn-group">
                  {wikiOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`wiki-btn${form.tarehe === opt.value ? ' active' : ''}`}
                      onClick={() => set('tarehe', opt.value)}
                    >
                      <span className="wiki-btn-num">Wiki {opt.wiki}</span>
                      <span className="wiki-btn-date">{opt.value}</span>
                    </button>
                  ))}
                </div>
                {form.tarehe && (
                  <div className="wiki-selected-label">
                    ✓ Imechaguliwa: <strong>
                      Wiki {selectedWiki?.wiki || isoWeek(form.tarehe).week}
                    </strong> — {dateLabel(form.tarehe)}
                  </div>
                )}
                <div className="form-field" style={{ maxWidth: 300, marginTop: 14 }}>
                  <label className="form-label">Tarehe husika</label>
                  <input
                    className="form-input"
                    type="date"
                    required
                    min={selectedWeekStart}
                    max={selectedWeekEnd}
                    value={form.tarehe}
                    onChange={e => set('tarehe', e.target.value)}
                  />
                  <span className="field-hint">
                    Chagua siku yoyote ndani ya Wiki {selectedWiki?.wiki || ''}.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ HISA ══ */}
          <div className="section-group" style={{ marginBottom: 16 }}>
            <div className="section-group-title">HISA</div>
            <div className="section-group-body">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-field">
                  <label className="form-label">Idadi ya Hisa</label>
                  <input
                    className="form-input"
                    type="number" min="0" step="1"
                    value={form.hisaIdadi}
                    onChange={e => set('hisaIdadi', e.target.value)}
                    placeholder="0"
                  />
                  <span className="field-hint">Hesabu ya hisa</span>
                </div>
                <div className="form-field">
                  <label className="form-label">Thamani ya Hisa (TZS)</label>
                  <input
                    className="form-input"
                    type="number" min="0" step="1"
                    value={form.hisaThamani}
                    onChange={e => set('hisaThamani', e.target.value)}
                    placeholder="0"
                  />
                  <span className="field-hint">Huhesabiwa kiotomatiki (bei × idadi)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ Malipo mengine ══ */}
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 18 }}>
            <div className="form-field">
              <label className="form-label">Jamii (TZS)</label>
              <input className="form-input" type="number" min="0" step="1"
                value={form.jamii} onChange={e => set('jamii', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Mar. Mkopo — Hisa (TZS)</label>
              <input className="form-input" type="number" min="0" step="1"
                value={form.marejeshoHisa} onChange={e => set('marejeshoHisa', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Mar. Mkopo — Jamii (TZS)</label>
              <input className="form-input" type="number" min="0" step="1"
                value={form.marejeshoJamii} onChange={e => set('marejeshoJamii', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Bima ya Mkopo (TZS)</label>
              <input className="form-input" type="number" min="0" step="1"
                value={form.bima} onChange={e => set('bima', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Faini (TZS)</label>
              <input className="form-input" type="number" min="0" step="1"
                value={form.faini} onChange={e => set('faini', e.target.value)} />
            </div>
          </div>

          <div className="row-actions">
            <button type="submit" className="btn-primary" disabled={saving || !form.tarehe}>
              {saving ? 'Inahifadhi...' : editingId ? 'Hifadhi Mabadiliko' : 'Hifadhi Mchango'}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={cancelEdit}>Ghairi</button>
            )}
          </div>
        </form>
      </div>

      {/* ── Recent entries ── */}
      <div className="card">
        <h2>Michango ya Hivi Karibuni</h2>
        {recent.length === 0 ? (
          <div className="empty-state">Hakuna mchango bado.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tarehe</th>
                  <th>Mwanachama</th>
                  <th>Wiki</th>
                  <th>Hisa (Idadi)</th>
                  <th>Hisa (TZS)</th>
                  <th>Jamii</th>
                  <th>Mar. Hisa</th>
                  <th>Mar. Jamii</th>
                  <th>Bima</th>
                  <th>Faini</th>
                  <th>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(e => {
                  const w = isoWeek(e.tarehe);
                  return (
                    <tr key={e.id}>
                      <td>{e.tarehe}</td>
                      <td>{memberName(e.memberId)}</td>
                      <td className="td-center">Wiki {w.week}</td>
                      <td className="td-num">{fmt(e.hisaIdadi)}</td>
                      <td className="td-num">{fmt(e.hisaThamani)}</td>
                      <td className="td-num">{fmt(e.jamii)}</td>
                      <td className="td-num">{fmt(e.marejeshoHisa)}</td>
                      <td className="td-num">{fmt(e.marejeshoJamii)}</td>
                      <td className="td-num">{fmt(e.bima)}</td>
                      <td className="td-num">{fmt(e.faini)}</td>
                      <td className="td-center">
                        <button className="btn-link"   onClick={() => startEdit(e)}>Hariri</button>
                        {' '}
                        <button className="btn-danger" onClick={() => handleDelete(e.id)}>Futa</button>
                      </td>
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
