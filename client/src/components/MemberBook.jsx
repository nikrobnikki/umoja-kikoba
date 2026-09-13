import React, { useState } from 'react';
import { useApp } from '../App.jsx';
import { fmt, isoWeek, monthKey, monthLabel, sumEntries } from '../utils.js';

export default function MemberBook() {
  const { members, entries } = useApp();
  const [memberId, setMemberId] = useState(members[0]?.id || '');

  if (members.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">Sajili wanachama kwanza ili kuona vitabu vyao.</div>
      </div>
    );
  }

  const member = members.find(m => m.id === memberId) || members[0];
  const list = entries
    .filter(e => e.memberId === (member?.id))
    .sort((a, b) => a.tarehe.localeCompare(b.tarehe));

  // Group by month → week
  const monthGroups = {};
  list.forEach(e => {
    const mk = monthKey(e.tarehe);
    if (!monthGroups[mk]) monthGroups[mk] = [];
    monthGroups[mk].push(e);
  });
  const monthKeys = Object.keys(monthGroups).sort();

  const grandTotal = sumEntries(list);

  function renderRows() {
    if (list.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="empty-state">Mwanachama huyu bado hajaingiza mchango wowote.</td>
        </tr>
      );
    }

    const rows = [];

    monthKeys.forEach(mk => {
      rows.push(
        <tr key={`month-header-${mk}`}>
          <td colSpan={9} style={{ background: 'var(--ink)', color: '#fff', fontWeight: 700, padding: '7px 8px' }}>
            {monthLabel(mk).toUpperCase()}
          </td>
        </tr>
      );

      const monthEntries = monthGroups[mk];
      const weekGroups = {};
      monthEntries.forEach(e => {
        const w = isoWeek(e.tarehe);
        const wk = `${w.year}-W${String(w.week).padStart(2, '0')}`;
        if (!weekGroups[wk]) weekGroups[wk] = [];
        weekGroups[wk].push(e);
      });

      Object.keys(weekGroups).sort().forEach(wk => {
        const wEntries = weekGroups[wk];
        const weekNum  = wk.split('-W')[1];

        wEntries.forEach(e => {
          rows.push(
            <tr key={e.id}>
              <td>{e.tarehe}</td>
              <td className="td-center">Wiki {weekNum}</td>
              <td className="td-num">{fmt(e.hisaIdadi)}</td>
              <td className="td-num">{fmt(e.hisaThamani)}</td>
              <td className="td-num">{fmt(e.jamii)}</td>
              <td className="td-num">{fmt(e.marejeshoHisa)}</td>
              <td className="td-num">{fmt(e.marejeshoJamii)}</td>
              <td className="td-num">{fmt(e.bima)}</td>
              <td className="td-num">{fmt(e.faini)}</td>
            </tr>
          );
        });

        const wt = sumEntries(wEntries);
        rows.push(
          <tr key={`week-sub-${wk}`} className="row-subtotal">
            <td colSpan={2}>JUMLA WIKI {weekNum}</td>
            <td className="td-num">{fmt(wt.hisaIdadi)}</td>
            <td className="td-num">{fmt(wt.hisaThamani)}</td>
            <td className="td-num">{fmt(wt.jamii)}</td>
            <td className="td-num">{fmt(wt.marejeshoHisa)}</td>
            <td className="td-num">{fmt(wt.marejeshoJamii)}</td>
            <td className="td-num">{fmt(wt.bima)}</td>
            <td className="td-num">{fmt(wt.faini)}</td>
          </tr>
        );
      });

      const mt = sumEntries(monthEntries);
      rows.push(
        <tr key={`month-sub-${mk}`} className="row-subtotal-month">
          <td colSpan={2}>JUMLA YA MWEZI — {monthLabel(mk).toUpperCase()}</td>
          <td className="td-num">{fmt(mt.hisaIdadi)}</td>
          <td className="td-num">{fmt(mt.hisaThamani)}</td>
          <td className="td-num">{fmt(mt.jamii)}</td>
          <td className="td-num">{fmt(mt.marejeshoHisa)}</td>
          <td className="td-num">{fmt(mt.marejeshoJamii)}</td>
          <td className="td-num">{fmt(mt.bima)}</td>
          <td className="td-num">{fmt(mt.faini)}</td>
        </tr>
      );
    });

    rows.push(
      <tr key="grand-total" className="row-grand">
        <td colSpan={2}>JUMLA KUU (TANGU KUJIUNGA)</td>
        <td className="td-num">{fmt(grandTotal.hisaIdadi)}</td>
        <td className="td-num">{fmt(grandTotal.hisaThamani)}</td>
        <td className="td-num">{fmt(grandTotal.jamii)}</td>
        <td className="td-num">{fmt(grandTotal.marejeshoHisa)}</td>
        <td className="td-num">{fmt(grandTotal.marejeshoJamii)}</td>
        <td className="td-num">{fmt(grandTotal.bima)}</td>
        <td className="td-num">{fmt(grandTotal.faini)}</td>
      </tr>
    );

    return rows;
  }

  return (
    <>
      {/* Selector */}
      <div className="card no-print">
        <h2>Kitabu cha Mwanachama</h2>
        <p className="hint">
          Chagua mwanachama ili kuona kitabu chake binafsi cha hisa na jamii, kikiwa na jumla za kila wiki na kila mwezi.
        </p>
        <div style={{ maxWidth: 360 }}>
          <label className="form-label">Mwanachama</label>
          <select
            className="form-select"
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.jina}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0 }}>{member?.jina}</h2>
          <button className="btn-ghost no-print" onClick={() => window.print()}>Chapisha</button>
        </div>
        <p className="hint">
          Namba: {member?.namba || '-'} &middot; Simu: {member?.simu || '-'}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tarehe</th>
                <th>Wiki</th>
                <th>Hisa (Idadi)</th>
                <th>Hisa (TZS)</th>
                <th>Jamii</th>
                <th>Mar. Hisa</th>
                <th>Mar. Jamii</th>
                <th>Bima</th>
                <th>Faini</th>
              </tr>
            </thead>
            <tbody>{renderRows()}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
