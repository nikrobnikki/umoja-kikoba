import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { fmt, todayISO, isoWeek, dateLabel, sumEntries } from '../utils.js';

export default function GeneralBook() {
  const { members, entries, settings } = useApp();

  const allDates  = [...new Set(entries.map(e => e.tarehe))].sort();
  const defaultDate = allDates.length ? allDates[allDates.length - 1] : todayISO();
  const [date, setDate] = useState(defaultDate);

  const dayEntries   = entries.filter(e => e.tarehe === date);
  const w            = isoWeek(date);
  const dayTotal     = sumEntries(dayEntries);
  const allTimeTotal = sumEntries(entries.filter(e => e.tarehe <= date));

  return (
    <>
      {/* ── Date selector (no-print) ── */}
      <div className="card no-print">
        <h2>Kitabu cha Makusanyo ya Jumla</h2>
        <p className="hint">
          Chagua tarehe ili kuona kitabu cha siku hiyo kama inavyoonekana kwenye kitabu halisi.
        </p>
        <div style={{ maxWidth: 440 }}>
          <label className="form-label">Chagua Tarehe</label>
          {allDates.length > 0 ? (
            <select className="form-select" value={date} onChange={e => setDate(e.target.value)}>
              {allDates.map(d => (
                <option key={d} value={d}>{d} — {dateLabel(d)}</option>
              ))}
            </select>
          ) : (
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* ══ LEDGER BOOK ══ */}
      <div className="ledger-book">

        {/* ── Page number top-left ── */}
        <div className="ledger-page-num">2</div>

        {/* ── Title ── */}
        <div className="ledger-title">{settings.groupName || 'SHUGHULI ZA KIBENKI'}</div>

        {/* ── Date + Day row ── */}
        <div className="ledger-meta">
          <div className="ledger-meta-item">
            <span className="ledger-meta-label">TAREHE</span>
            <span className="ledger-meta-value">{date}</span>
          </div>
          <div className="ledger-meta-item">
            <span className="ledger-meta-label">SIKU YA</span>
            <span className="ledger-meta-value ledger-meta-dotted">{dateLabel(date)}</span>
          </div>
        </div>

        {/* ── Sub-title ── */}
        <div className="ledger-subtitle">MAKUSANYO YA SIKU</div>

        {/* ── Main table ── */}
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th rowSpan={2} className="lt-na">NA</th>
                <th rowSpan={2} className="lt-jina">JINA LA<br />MWANACHAMA</th>
                <th colSpan={2} className="lt-group-hdr">HISA</th>
                <th rowSpan={2} className="lt-jamii">JAMII</th>
                <th colSpan={2} className="lt-group-hdr">MAREJESHO YA<br />MIKOPO</th>
                <th rowSpan={2} className="lt-bima">BIMA<br />YA<br />MKOPO</th>
                <th rowSpan={2} className="lt-faini">FAINI</th>
              </tr>
              <tr>
                <th className="lt-sub">IDADI</th>
                <th className="lt-sub">THAMANI</th>
                <th className="lt-sub">HISA</th>
                <th className="lt-sub">JAMII</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic', color: '#888' }}>
                    Hakuna wanachama waliosajiliwa.
                  </td>
                </tr>
              ) : (
                members.map((m, i) => {
                  const e = dayEntries.find(x => x.memberId === m.id);
                  return (
                    <tr key={m.id} className="lt-data-row">
                      <td className="lt-na">{i + 1}</td>
                      <td className="lt-jina-cell">{m.jina}</td>
                      <td className="lt-num">{e ? fmt(e.hisaIdadi)     : ''}</td>
                      <td className="lt-num">{e ? fmt(e.hisaThamani)   : ''}</td>
                      <td className="lt-num">{e ? fmt(e.jamii)         : ''}</td>
                      <td className="lt-num">{e ? fmt(e.marejeshoHisa) : ''}</td>
                      <td className="lt-num">{e ? fmt(e.marejeshoJamii): ''}</td>
                      <td className="lt-num">{e ? fmt(e.bima)          : ''}</td>
                      <td className="lt-num">{e ? fmt(e.faini)         : ''}</td>
                    </tr>
                  );
                })
              )}

              {/* ── JUMLA (day total) ── */}
              <tr className="lt-jumla-row">
                <td colSpan={2} className="lt-jumla-label">JUMLA</td>
                <td className="lt-num">{fmt(dayTotal.hisaIdadi)}</td>
                <td className="lt-num">{fmt(dayTotal.hisaThamani)}</td>
                <td className="lt-num">{fmt(dayTotal.jamii)}</td>
                <td className="lt-num">{fmt(dayTotal.marejeshoHisa)}</td>
                <td className="lt-num">{fmt(dayTotal.marejeshoJamii)}</td>
                <td className="lt-num">{fmt(dayTotal.bima)}</td>
                <td className="lt-num">{fmt(dayTotal.faini)}</td>
              </tr>

              {/* ── JUMLA KUU (all-time cumulative) ── */}
              <tr className="lt-jumla-row lt-jumla-kuu-row">
                <td colSpan={2} className="lt-jumla-label">JUMLA KUU</td>
                <td className="lt-num">{fmt(allTimeTotal.hisaIdadi)}</td>
                <td className="lt-num">{fmt(allTimeTotal.hisaThamani)}</td>
                <td className="lt-num">{fmt(allTimeTotal.jamii)}</td>
                <td className="lt-num">{fmt(allTimeTotal.marejeshoHisa)}</td>
                <td className="lt-num">{fmt(allTimeTotal.marejeshoJamii)}</td>
                <td className="lt-num">{fmt(allTimeTotal.bima)}</td>
                <td className="lt-num">{fmt(allTimeTotal.faini)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Wiki badge (bottom centre, oval like the photo) ── */}
        <div className="ledger-wiki-badge">WIKI YA {w.week}</div>

        {/* ── Print button ── */}
        <div className="no-print" style={{ textAlign: 'center', marginTop: 18 }}>
          <button className="btn-ghost" onClick={() => window.print()}>
            🖨️ Chapisha Kitabu cha Siku
          </button>
        </div>
      </div>
    </>
  );
}
