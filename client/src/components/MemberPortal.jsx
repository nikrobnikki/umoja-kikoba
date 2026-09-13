import React, { useState, useEffect } from 'react';
import * as api from '../api/index.js';
import { fmt, isoWeek, monthKey, monthLabel, sumEntries, MONTHS_SW } from '../utils.js';
import ThemeToggle from './ThemeToggle.jsx';

/* ─── helpers ── */
function dateLabel(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.getDate() + ' ' + MONTHS_SW[dt.getMonth()] + ' ' + dt.getFullYear();
}

const HALI_LABEL = { hai: 'Hai', imelipwa: 'Imelipwa', imechelewa: 'Imechelewa' };
const HALI_CLASS = { hai: 'badge-hai', imelipwa: 'badge-imelipwa', imechelewa: 'badge-imechelewa' };

/* ─── Stat card ── */
function Stat({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-key">{label}</div>
      <div className="stat-val" style={color ? { color } : {}}>{value}</div>
    </div>
  );
}

/* ─── Section header ── */
function SectionTitle({ children }) {
  return (
    <div className="portal-section-title">{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function MemberPortal({ user, onLogout, theme, toggleTheme }) {
  const [member,  setMember]  = useState(null);
  const [entries, setEntries] = useState([]);
  const [loans,   setLoans]   = useState([]);
  const [settings,setSettings]= useState({ sharePrice: 25000 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [activeTab, setActiveTab] = useState('dashibodi');
  const [expandedLoan, setExpandedLoan] = useState(null);

  /* ── Load all data for this member ── */
  useEffect(() => {
    async function load() {
      try {
        const [members, ents, lns, sett] = await Promise.all([
          api.getMembers(),
          api.getEntries(),
          api.getMkopoByMember(user.memberId),
          api.getSettings(),
        ]);
        setMember(members[0] || null);    // filtered to own record by server
        setEntries(ents);
        setLoans(lns);
        setSettings(sett);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.memberId]);

  async function loadLoanDetail(loanId) {
    if (expandedLoan?.id === loanId) { setExpandedLoan(null); return; }
    try {
      const detail = await api.getMkopoById(loanId);
      setExpandedLoan(detail);
    } catch { /* ignore */ }
  }

  if (loading) return <div className="loading">Inapakia taarifa zako...</div>;
  if (error)   return <div className="app-wrap"><div className="card"><div className="empty-state" style={{ color: 'var(--red)' }}>{error}</div></div></div>;

  /* ── Aggregates ── */
  const totals       = sumEntries(entries);
  const totalLoanKiasi   = loans.reduce((s, l) => s + l.kiasi, 0);
  const totalLoanBaki    = loans.reduce((s, l) => s + l.saladoBaki, 0);
  const totalLoanPaid    = loans.reduce((s, l) => s + l.jumlaIlipolipwa, 0);
  const activeLoans  = loans.filter(l => l.hali === 'hai').length;
  const overdueLoans = loans.filter(l => l.hali === 'imechelewa').length;

  /* ── Weekly / monthly breakdown ── */
  const byMonth = {};
  entries.forEach(e => {
    const mk = monthKey(e.tarehe);
    if (!byMonth[mk]) byMonth[mk] = [];
    byMonth[mk].push(e);
  });
  const monthKeys = Object.keys(byMonth).sort().reverse().slice(0, 6);

  const TABS = [
    { id: 'dashibodi',  label: 'Dashibodi' },
    { id: 'michango',   label: 'Michango Yangu' },
    { id: 'mikopo',     label: 'Mikopo Yangu' },
  ];

  return (
    <div className="app-wrap">
      {/* ── Header ── */}
      <div className="cover">
        <div className="cover-top">
          <div style={{ flex: 1 }}>
            <input className="cover-input" readOnly
              value={settings.groupName || 'MFUMO WA KIKOBA'} />
            <p className="cover-subtitle">Ukurasa Wako Binafsi — Karibu, {user.memberJina || user.username}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div className="stamp">AKAUNTI<br />YA<br />MWANACHAMA</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <div className="admin-bar">
                <span className="admin-bar-name">
                  <span className="admin-bar-dot" />
                  {user.username}
                </span>
                <button className="admin-bar-logout" onClick={onLogout}>Toka</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <nav className="tabs no-print">
        {TABS.map(t => (
          <button key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ══ DASHIBODI ══ */}
      {activeTab === 'dashibodi' && (
        <>
          {/* Member info card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ margin: '0 0 4px' }}>{member?.jina}</h2>
                <p className="hint" style={{ margin: 0 }}>
                  Namba: {member?.namba || '—'} &middot; Simu: {member?.simu || '—'}
                </p>
              </div>
              <button className="btn-ghost no-print" onClick={() => window.print()}>Chapisha</button>
            </div>
          </div>

          {/* Hisa summary */}
          <div className="card">
            <SectionTitle>Muhtasari wa Hisa na Michango</SectionTitle>
            <div className="stat-grid">
              <Stat label="Jumla ya Hisa (Idadi)" value={fmt(totals.hisaIdadi)} />
              <Stat label="Thamani ya Hisa (TZS)" value={`TZS ${fmt(totals.hisaThamani)}`} />
              <Stat label="Jumla ya Jamii (TZS)"  value={`TZS ${fmt(totals.jamii)}`} />
              <Stat label="Marejesho - Hisa"       value={`TZS ${fmt(totals.marejeshoHisa)}`} />
              <Stat label="Marejesho - Jamii"      value={`TZS ${fmt(totals.marejeshoJamii)}`} />
              <Stat label="Bima ya Mkopo"          value={`TZS ${fmt(totals.bima)}`} />
              <Stat label="Faini"                  value={`TZS ${fmt(totals.faini)}`} color={totals.faini > 0 ? 'var(--red)' : undefined} />
            </div>
          </div>

          {/* Loan summary */}
          <div className="card">
            <SectionTitle>Muhtasari wa Mikopo</SectionTitle>
            <div className="stat-grid">
              <Stat label="Mikopo Yote"        value={loans.length} />
              <Stat label="Jumla ya Mikopo"    value={`TZS ${fmt(totalLoanKiasi)}`} />
              <Stat label="Jumla Imelipwa"     value={`TZS ${fmt(totalLoanPaid)}`} color="var(--green)" />
              <Stat label="Baki ya Kulipa"     value={`TZS ${fmt(totalLoanBaki)}`} color={totalLoanBaki > 0 ? 'var(--red)' : 'var(--green)'} />
              <Stat label="Mikopo Hai"         value={activeLoans} />
              <Stat label="Imechelewa"         value={overdueLoans} color={overdueLoans > 0 ? 'var(--red)' : undefined} />
            </div>
          </div>

          {/* Recent entries mini table */}
          {entries.length > 0 && (
            <div className="card">
              <SectionTitle>Michango ya Hivi Karibuni</SectionTitle>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tarehe</th><th>Wiki</th>
                      <th>Hisa (Idadi)</th><th>Hisa (TZS)</th>
                      <th>Jamii</th><th>Mar. Hisa</th><th>Mar. Jamii</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...entries].sort((a,b) => b.tarehe.localeCompare(a.tarehe)).slice(0,5).map(e => {
                      const w = isoWeek(e.tarehe);
                      return (
                        <tr key={e.id}>
                          <td>{e.tarehe}</td>
                          <td className="td-center">Wiki {w.week}</td>
                          <td className="td-num">{fmt(e.hisaIdadi)}</td>
                          <td className="td-num">{fmt(e.hisaThamani)}</td>
                          <td className="td-num">{fmt(e.jamii)}</td>
                          <td className="td-num">{fmt(e.marejeshoHisa)}</td>
                          <td className="td-num">{fmt(e.marejeshoJamii)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {entries.length > 5 && (
                <p className="foot-note" style={{ marginTop: 8 }}>
                  Inaonyesha rekodi 5 za hivi karibuni kati ya {entries.length}. Nenda kwenye <strong>Michango Yangu</strong> kuona zote.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ MICHANGO YANGU ══ */}
      {activeTab === 'michango' && (
        <div className="card">
          <h2>Michango Yangu Yote</h2>
          <p className="hint">Mchanganyiko wa hisa na jamii zako zote tangu kujiunga.</p>

          {entries.length === 0 ? (
            <div className="empty-state">Hakuna mchango bado.</div>
          ) : (
            <>
              {/* Group by month */}
              {monthKeys.map(mk => {
                const mEntries = byMonth[mk] || [];
                const mt = sumEntries(mEntries);
                return (
                  <div key={mk} style={{ marginBottom: 22 }}>
                    <div className="portal-month-header">{monthLabel(mk).toUpperCase()}</div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Tarehe</th><th>Wiki</th>
                            <th>Hisa (Idadi)</th><th>Hisa (TZS)</th>
                            <th>Jamii</th><th>Mar. Hisa</th><th>Mar. Jamii</th>
                            <th>Bima</th><th>Faini</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...mEntries].sort((a,b)=>a.tarehe.localeCompare(b.tarehe)).map(e => {
                            const w = isoWeek(e.tarehe);
                            return (
                              <tr key={e.id}>
                                <td>{e.tarehe}</td>
                                <td className="td-center">Wiki {w.week}</td>
                                <td className="td-num">{fmt(e.hisaIdadi)}</td>
                                <td className="td-num">{fmt(e.hisaThamani)}</td>
                                <td className="td-num">{fmt(e.jamii)}</td>
                                <td className="td-num">{fmt(e.marejeshoHisa)}</td>
                                <td className="td-num">{fmt(e.marejeshoJamii)}</td>
                                <td className="td-num">{fmt(e.bima)}</td>
                                <td className="td-num">{fmt(e.faini)}</td>
                              </tr>
                            );
                          })}
                          {/* Month subtotal */}
                          <tr className="row-subtotal">
                            <td colSpan={2}>JUMLA YA {monthLabel(mk).toUpperCase()}</td>
                            <td className="td-num">{fmt(mt.hisaIdadi)}</td>
                            <td className="td-num">{fmt(mt.hisaThamani)}</td>
                            <td className="td-num">{fmt(mt.jamii)}</td>
                            <td className="td-num">{fmt(mt.marejeshoHisa)}</td>
                            <td className="td-num">{fmt(mt.marejeshoJamii)}</td>
                            <td className="td-num">{fmt(mt.bima)}</td>
                            <td className="td-num">{fmt(mt.faini)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Grand total */}
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table>
                  <tbody>
                    <tr className="row-grand">
                      <td colSpan={2}>JUMLA KUU (TANGU KUJIUNGA)</td>
                      <td className="td-num">{fmt(totals.hisaIdadi)}</td>
                      <td className="td-num">{fmt(totals.hisaThamani)}</td>
                      <td className="td-num">{fmt(totals.jamii)}</td>
                      <td className="td-num">{fmt(totals.marejeshoHisa)}</td>
                      <td className="td-num">{fmt(totals.marejeshoJamii)}</td>
                      <td className="td-num">{fmt(totals.bima)}</td>
                      <td className="td-num">{fmt(totals.faini)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ MIKOPO YANGU ══ */}
      {activeTab === 'mikopo' && (
        <div className="card">
          <h2>Mikopo Yangu</h2>
          <p className="hint">Taarifa za mikopo yako yote, marejesho uliyolipa na kiasi kilichobaki.</p>

          {loans.length === 0 ? (
            <div className="empty-state">Huna mkopo wowote uliosajiliwa.</div>
          ) : (
            <div className="loans-list">
              {loans.map(loan => (
                <div key={loan.id} className={`loan-card loan-card--${loan.hali}`}>
                  {/* Header */}
                  <div className="loan-card-header"
                    onClick={() => loadLoanDetail(loan.id)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && loadLoanDetail(loan.id)}>
                    <div className="loan-card-left">
                      <span className={`loan-badge ${HALI_CLASS[loan.hali]}`}>
                        {HALI_LABEL[loan.hali]}
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
                        <span className={loan.hali === 'imechelewa' ? 'text-red' : ''}>
                          Mwisho: <strong>{dateLabel(loan.tareheMwisho)}</strong>
                        </span>
                        <span>{loan.mieziYaKulipa} miezi</span>
                      </div>
                      <div className="loan-card-chevron">
                        {expandedLoan?.id === loan.id ? '▲' : '▼'}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="loan-card-progress">
                    <div className="loan-progress-labels">
                      <span>Imelipwa: <strong className="text-green">TZS {fmt(loan.jumlaIlipolipwa)}</strong></span>
                      <span>Baki: <strong className={loan.saladoBaki > 0 ? 'text-red' : 'text-green'}>
                        TZS {fmt(loan.saladoBaki)}
                      </strong></span>
                    </div>
                    <div className="repay-progress-wrap">
                      <div className="repay-progress-bar"
                        style={{ width: loan.jumlaKulipa > 0
                          ? Math.min(100, Math.round((loan.jumlaIlipolipwa/loan.jumlaKulipa)*100)) + '%'
                          : '0%' }} />
                      <span className="repay-progress-label">
                        {loan.jumlaKulipa > 0
                          ? Math.min(100, Math.round((loan.jumlaIlipolipwa/loan.jumlaKulipa)*100))
                          : 0}%
                      </span>
                    </div>
                  </div>

                  {/* Expanded repayments */}
                  {expandedLoan?.id === loan.id && (
                    <div className="loan-card-body">
                      {loan.maelezo && <p className="loan-maelezo">📝 {loan.maelezo}</p>}
                      <h4 className="loan-section-title">Historia ya Marejesho</h4>
                      {!expandedLoan.marejesho ? (
                        <div className="empty-state" style={{ padding: '10px 0' }}>Inapakia...</div>
                      ) : expandedLoan.marejesho.length === 0 ? (
                        <div className="empty-state" style={{ padding: '10px 0' }}>Hakuna malipo bado.</div>
                      ) : (
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th><th>Tarehe</th>
                                <th>Kiasi Kilicholipwa</th><th>Maelezo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expandedLoan.marejesho.map((r, i) => (
                                <tr key={r.id}>
                                  <td className="td-center">{i + 1}</td>
                                  <td>{dateLabel(r.tarehe)}</td>
                                  <td className="td-num">TZS {fmt(r.kiasi)}</td>
                                  <td style={{ fontSize: 12, color: '#6a6252' }}>{r.maelezo || '—'}</td>
                                </tr>
                              ))}
                              <tr className="row-subtotal">
                                <td colSpan={2}>JUMLA ILIYOLIPWA</td>
                                <td className="td-num">TZS {fmt(loan.jumlaIlipolipwa)}</td>
                                <td />
                              </tr>
                              <tr style={{ background: loan.saladoBaki > 0 ? '#FFF0EE' : '#EEF8F2' }}>
                                <td colSpan={2} style={{ fontWeight: 700 }}>BAKI YA KULIPA</td>
                                <td className="td-num" style={{ fontWeight: 700,
                                  color: loan.saladoBaki > 0 ? 'var(--red)' : 'var(--green)' }}>
                                  TZS {fmt(loan.saladoBaki)}
                                </td>
                                <td />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                      {loan.hali === 'imelipwa' && (
                        <div className="loan-paid-notice">✓ Mkopo huu umelipwa kikamilifu.</div>
                      )}
                      {loan.hali === 'imechelewa' && (
                        <div className="flash error" style={{ marginTop: 10 }}>
                          ⚠ Mkopo huu umechelewa kulipwa. Tarehe ya mwisho ilikuwa {dateLabel(loan.tareheMwisho)}.
                          Wasiliana na msimamizi.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
