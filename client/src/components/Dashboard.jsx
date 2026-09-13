import React from 'react';
import { useApp } from '../App.jsx';
import { fmt, todayISO, isoWeek, monthKey, monthLabel, sumEntries } from '../utils.js';

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-key">{label}</div>
      <div className="stat-val">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { members, entries } = useApp();

  const allTotal  = sumEntries(entries);
  const wk        = isoWeek(todayISO());
  const mk        = monthKey(todayISO());

  const weekEntries  = entries.filter(e => {
    const w = isoWeek(e.tarehe);
    return w.year === wk.year && w.week === wk.week;
  });
  const monthEntries = entries.filter(e => monthKey(e.tarehe) === mk);
  const weekTotal    = sumEntries(weekEntries);
  const monthTotal   = sumEntries(monthEntries);

  return (
    <>
      <div className="card">
        <h2>Muhtasari wa Jumla</h2>
        <p className="hint">Hesabu hizi zinajisasisha zenyewe kila mchango unapoingizwa.</p>
        <div className="stat-grid">
          <StatCard label="Wanachama"                value={members.length} />
          <StatCard label="Jumla ya Hisa (Idadi)"    value={fmt(allTotal.hisaIdadi)} />
          <StatCard label="Thamani ya Hisa (TZS)"    value={`TZS ${fmt(allTotal.hisaThamani)}`} />
          <StatCard label="Jumla ya Jamii (TZS)"     value={`TZS ${fmt(allTotal.jamii)}`} />
          <StatCard label="Mar. Mikopo - Hisa"        value={`TZS ${fmt(allTotal.marejeshoHisa)}`} />
          <StatCard label="Mar. Mikopo - Jamii"       value={`TZS ${fmt(allTotal.marejeshoJamii)}`} />
          <StatCard label="Bima ya Mkopo"             value={`TZS ${fmt(allTotal.bima)}`} />
          <StatCard label="Faini"                     value={`TZS ${fmt(allTotal.faini)}`} />
        </div>
      </div>

      <div className="card">
        <h2>
          Wiki Hii&nbsp;
          <span className="scope-badge">Wiki {wk.week}, {wk.year}</span>
        </h2>
        <div className="stat-grid">
          <StatCard label="Hisa (Idadi)"   value={fmt(weekTotal.hisaIdadi)} />
          <StatCard label="Thamani (TZS)"  value={`TZS ${fmt(weekTotal.hisaThamani)}`} />
          <StatCard label="Jamii (TZS)"    value={`TZS ${fmt(weekTotal.jamii)}`} />
        </div>
      </div>

      <div className="card">
        <h2>
          Mwezi Huu&nbsp;
          <span className="scope-badge">{monthLabel(mk)}</span>
        </h2>
        <div className="stat-grid">
          <StatCard label="Hisa (Idadi)"   value={fmt(monthTotal.hisaIdadi)} />
          <StatCard label="Thamani (TZS)"  value={`TZS ${fmt(monthTotal.hisaThamani)}`} />
          <StatCard label="Jamii (TZS)"    value={`TZS ${fmt(monthTotal.jamii)}`} />
        </div>
      </div>

      {members.length === 0 && (
        <div className="card">
          <div className="empty-state">
            Bado hakuna wanachama. Anza kwa kwenda kwenye tab ya <strong>Wanachama</strong> kusajili wa kwanza.
          </div>
        </div>
      )}
    </>
  );
}
