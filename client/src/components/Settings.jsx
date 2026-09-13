import React, { useState, useEffect } from 'react';
import { useApp } from '../App.jsx';
import * as api from '../api/index.js';
import { fmt } from '../utils.js';

const AINA_LABELS = {
  sharePrice:      'Bei ya Hisa (TZS)',
  jamiiKiwango:    'Kiwango cha Jamii (TZS)',
  bimaKiwango:     'Kiwango cha Bima (TZS)',
  hisaIdadiChaguo: 'Idadi ya Hisa (Chaguo-msingi)',
};

const OFFICER_ROLES = ['admin', 'mwenyekiti', 'katibu', 'mwasibu'];
const ROLE_LABELS   = { admin: 'Msimamizi', mwenyekiti: 'Mwenyekiti', katibu: 'Katibu', mwasibu: 'Mwasibu' };

export default function Settings() {
  const { settings, setSettings, members, entries, user, isAdmin } = useApp();

  /* ── System settings ── */
  const [sysForm,   setSysForm]   = useState({ groupName: settings.groupName });
  const [sysSaving, setSysSaving] = useState(false);
  const [sysFlash,  setSysFlash]  = useState(null);

  /* ── Market rates ── */
  const [mktForm, setMktForm] = useState({
    sharePrice: settings.sharePrice || 25000, jamiiKiwango: settings.jamiiKiwango || 10000,
    bimaKiwango: settings.bimaKiwango || 0,   hisaIdadiChaguo: settings.hisaIdadiChaguo || 1,
    sababu: '',
  });
  const [mktSaving, setMktSaving] = useState(false);
  const [mktFlash,  setMktFlash]  = useState(null);
  const [historia,  setHistoria]  = useState([]);
  const [showHist,  setShowHist]  = useState(false);

  /* ── Officers ── */
  const [officers,    setOfficers]    = useState([]);
  const [newOfficer,  setNewOfficer]  = useState({ username: '', password: '', role: 'admin' });
  const [addingOfficer, setAddingOfficer] = useState(false);
  const [offFlash,    setOffFlash]    = useState(null);

  /* ── Member accounts ── */
  const [memberAccounts,   setMemberAccounts]   = useState([]);
  const [maFlash,          setMaFlash]          = useState(null);
  const [newMa,            setNewMa]            = useState({ memberId: '', username: '', password: '' });
  const [addingMa,         setAddingMa]         = useState(false);
  const [pwdEdit,          setPwdEdit]          = useState(null); // { id, value }

  /* ── Load on mount ── */
  useEffect(() => {
    if (!isAdmin) return;
    api.getAdmins().then(setOfficers).catch(() => {});
    api.getMemberAccounts().then(setMemberAccounts).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    setSysForm({ groupName: settings.groupName });
    setMktForm(f => ({
      ...f,
      sharePrice: settings.sharePrice || 25000, jamiiKiwango: settings.jamiiKiwango || 10000,
      bimaKiwango: settings.bimaKiwango || 0,   hisaIdadiChaguo: settings.hisaIdadiChaguo || 1,
    }));
  }, [settings]);

  function fl(setter, msg, type = 'ok') {
    setter({ msg, type });
    setTimeout(() => setter(null), 5000);
  }

  /* ── Save system settings ── */
  async function saveSys(e) {
    e.preventDefault();
    setSysSaving(true);
    try {
      const s = await api.saveSettings({ groupName: sysForm.groupName.trim() || settings.groupName });
      setSettings(p => ({ ...p, groupName: s.groupName }));
      fl(setSysFlash, 'Jina la kikoba limehifadhiwa.');
    } catch (err) { fl(setSysFlash, err.message, 'error'); }
    finally { setSysSaving(false); }
  }

  /* ── Save market rates ── */
  async function saveMkt(e) {
    e.preventDefault();
    setMktSaving(true);
    try {
      const s = await api.saveSettings({
        sharePrice: Number(mktForm.sharePrice)||0, jamiiKiwango: Number(mktForm.jamiiKiwango)||0,
        bimaKiwango: Number(mktForm.bimaKiwango)||0, hisaIdadiChaguo: Number(mktForm.hisaIdadiChaguo)||1,
        sababu: mktForm.sababu.trim(),
      });
      setSettings(p => ({ ...p, sharePrice: Number(s.sharePrice), jamiiKiwango: Number(s.jamiiKiwango),
        bimaKiwango: Number(s.bimaKiwango), hisaIdadiChaguo: Number(s.hisaIdadiChaguo) }));
      setMktForm(f => ({ ...f, sababu: '' }));
      fl(setMktFlash, 'Bei za masoko zimehifadhiwa.');
      if (showHist) api.getBeiHistoria().then(setHistoria).catch(() => {});
    } catch (err) { fl(setMktFlash, err.message, 'error'); }
    finally { setMktSaving(false); }
  }

  /* ── Officers ── */
  async function addOfficer(e) {
    e.preventDefault();
    setAddingOfficer(true);
    try {
      await api.createAdmin(newOfficer);
      setNewOfficer({ username: '', password: '', role: 'admin' });
      setOfficers(await api.getAdmins());
      fl(setOffFlash, 'Afisa mpya ameongezwa.');
    } catch (err) { fl(setOffFlash, err.message, 'error'); }
    finally { setAddingOfficer(false); }
  }

  async function changeOfficerRole(id, role) {
    try {
      await api.updateAdmin(id, { role });
      setOfficers(await api.getAdmins());
      fl(setOffFlash, 'Cheo kimebadilishwa.');
    } catch (err) { fl(setOffFlash, err.message, 'error'); }
  }

  async function removeOfficer(id, username) {
    if (!confirm(`Futa afisa "${username}"?`)) return;
    try {
      await api.deleteAdmin(id);
      setOfficers(o => o.filter(x => x.id !== id));
      fl(setOffFlash, 'Afisa amefutwa.');
    } catch (err) { fl(setOffFlash, err.message, 'error'); }
  }

  /* ── Member accounts ── */
  async function createMemberAccount(e) {
    e.preventDefault();
    if (!newMa.memberId || !newMa.username || !newMa.password) return;
    setAddingMa(true);
    try {
      const created = await api.createMemberAccount(newMa);
      setMemberAccounts(a => [...a, created]);
      setNewMa({ memberId: '', username: '', password: '' });
      fl(setMaFlash, `Akaunti ya "${created.memberJina}" imeundwa.`);
    } catch (err) { fl(setMaFlash, err.message, 'error'); }
    finally { setAddingMa(false); }
  }

  async function toggleActive(acct) {
    try {
      const updated = await api.updateMemberAccount(acct.id, { active: !acct.active });
      setMemberAccounts(a => a.map(x => x.id === acct.id ? { ...x, active: updated.active } : x));
      fl(setMaFlash, `Akaunti ${updated.active ? 'imewashwa' : 'imezimwa'}.`);
    } catch (err) { fl(setMaFlash, err.message, 'error'); }
  }

  async function changePassword(id) {
    const pw = pwdEdit?.value?.trim();
    if (!pw) return;
    try {
      await api.updateMemberAccount(id, { password: pw });
      setPwdEdit(null);
      fl(setMaFlash, 'Nenosiri limebadilishwa.');
    } catch (err) { fl(setMaFlash, err.message, 'error'); }
  }

  async function deleteMemberAccount(id, jina) {
    if (!confirm(`Futa akaunti ya "${jina}"?`)) return;
    try {
      await api.deleteMemberAccount(id);
      setMemberAccounts(a => a.filter(x => x.id !== id));
      fl(setMaFlash, 'Akaunti imefutwa.');
    } catch (err) { fl(setMaFlash, err.message, 'error'); }
  }

  // Members without an account (for dropdown)
  const membersWithoutAccount = members.filter(
    m => !memberAccounts.some(a => a.memberId === m.id)
  );

  if (!isAdmin) {
    return (
      <div className="card">
        <div className="admin-notice">
          <span className="admin-notice-icon">🔒</span>
          <div>
            <strong>Inahitaji Ruhusa ya Msimamizi</strong>
            <p>Mipangilio inabadilishwa na <strong>msimamizi</strong> tu.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ══ 1. MIPANGILIO YA MFUMO ══ */}
      <div className="card">
        <h2>Mipangilio ya Mfumo</h2>
        <p className="hint">Jina la kikoba / kikundi linaloonekana kwenye vitabu na ripoti.</p>
        {sysFlash && <div className={`flash${sysFlash.type==='error'?' error':''}`}>{sysFlash.msg}</div>}
        <form onSubmit={saveSys} noValidate>
          <div className="form-grid" style={{ maxWidth: 380 }}>
            <div className="form-field">
              <label className="form-label">Jina la Kikoba / Kikundi</label>
              <input className="form-input" value={sysForm.groupName}
                onChange={e => setSysForm({ groupName: e.target.value })}
                placeholder="SHUGHULI ZA KIBENKI" />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={sysSaving}>
            {sysSaving ? 'Inahifadhi...' : 'Hifadhi Jina'}
          </button>
        </form>
      </div>

      {/* ══ 2. BEI ZA MASOKO ══ */}
      <div className="card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:4 }}>
          <div>
            <h2 style={{ margin:0 }}>Bei za Masoko</h2>
            <p className="hint" style={{ marginBottom:0 }}>Badilisha bei ya hisa, jamii na bima. Mabadiliko yanarekodiwa.</p>
          </div>
          <button className="btn-ghost" onClick={() => api.getBeiHistoria().then(h=>{setHistoria(h);setShowHist(true);}).catch(()=>{})}>
            📋 Historia
          </button>
        </div>
        <div className="market-summary">
          {[['Bei ya Hisa', settings.sharePrice, true],
            ['Idadi Kawaida', settings.hisaIdadiChaguo, false],
            ['Jamii',         settings.jamiiKiwango, true],
            ['Bima',          settings.bimaKiwango, true]
          ].map(([k,v,tzs]) => (
            <div key={k} className="mkt-val">
              <span className="mkt-val-label">{k}</span>
              <span className="mkt-val-num">{tzs ? `TZS ${fmt(v)}` : fmt(v)}</span>
            </div>
          ))}
        </div>
        {mktFlash && <div className={`flash${mktFlash.type==='error'?' error':''}`}>{mktFlash.msg}</div>}
        <form onSubmit={saveMkt} noValidate>
          <div className="form-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', marginBottom:14 }}>
            {[
              ['hisaIdadiChaguo','Idadi ya Hisa (Kawaida)','Idadi inayojazwa kwenye fomu'],
              ['sharePrice',     'Bei ya Hisa Moja (TZS)','Thamani = idadi × bei hii'],
              ['jamiiKiwango',   'Kiwango cha Jamii (TZS)','Kiwango cha kawaida kwa wiki'],
              ['bimaKiwango',    'Kiwango cha Bima (TZS)','Kiwango cha kawaida cha bima'],
            ].map(([k,label,hint]) => (
              <div className="form-field" key={k}>
                <label className="form-label">{label}</label>
                <input className={`form-input${k!=='hisaIdadiChaguo'?' mkt-input':''}`}
                  type="number" min="0" step="1"
                  value={mktForm[k]}
                  onChange={e => setMktForm(f=>({...f,[k]:e.target.value}))} />
                <span className="field-hint">{hint}</span>
              </div>
            ))}
          </div>
          <div className="form-field" style={{ maxWidth:480, marginBottom:16 }}>
            <label className="form-label">Sababu ya Mabadiliko (hiari)</label>
            <input className="form-input" value={mktForm.sababu}
              onChange={e => setMktForm(f=>({...f,sababu:e.target.value}))}
              placeholder="mf. Bei za masoko zimepanda" />
          </div>
          <div className="mkt-preview">
            <span className="mkt-preview-title">Hesabu:</span>
            <span>{fmt(mktForm.hisaIdadiChaguo||1)} hisa × TZS {fmt(mktForm.sharePrice)} = <strong>TZS {fmt((Number(mktForm.hisaIdadiChaguo)||1)*(Number(mktForm.sharePrice)||0))}</strong></span>
            <span>Jamii: <strong>TZS {fmt(mktForm.jamiiKiwango)}</strong></span>
            <span>Bima: <strong>TZS {fmt(mktForm.bimaKiwango)}</strong></span>
          </div>
          <button type="submit" className="btn-primary" disabled={mktSaving}>
            {mktSaving ? 'Inahifadhi...' : '💹 Hifadhi Bei za Masoko'}
          </button>
        </form>
        {showHist && (
          <div style={{ marginTop:22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <strong style={{ fontSize:13 }}>Historia ya Mabadiliko</strong>
              <button className="btn-link" onClick={()=>setShowHist(false)}>Ficha</button>
            </div>
            {historia.length===0 ? <div className="empty-state" style={{ padding:'12px 0' }}>Hakuna bado.</div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Tarehe</th><th>Aina</th><th>Zamani</th><th>Mpya</th><th>Mabadiliko</th><th>Sababu</th><th>Afisa</th></tr></thead>
                  <tbody>
                    {historia.map(h => {
                      const diff = h.thamaniMpya - h.thamaniYaZamani;
                      return (
                        <tr key={h.id}>
                          <td>{new Date(h.createdAt).toLocaleDateString('sw-TZ')}</td>
                          <td>{AINA_LABELS[h.aina]||h.aina}</td>
                          <td className="td-num">TZS {fmt(h.thamaniYaZamani)}</td>
                          <td className="td-num">TZS {fmt(h.thamaniMpya)}</td>
                          <td className="td-num" style={{ fontWeight:700, color: diff>=0?'var(--green)':'var(--red)' }}>
                            {diff>=0?'+':''}{fmt(diff)}
                          </td>
                          <td style={{ fontSize:12, fontStyle:'italic', color:'#6a6252' }}>{h.sababu||'—'}</td>
                          <td>{h.adminJina}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ 3. TAARIFA ZA DATA ══ */}
      <div className="card">
        <h2>Taarifa za Data</h2>
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-key">Wanachama</div><div className="stat-val">{members.length}</div></div>
          <div className="stat-card"><div className="stat-key">Michango</div><div className="stat-val">{entries.length}</div></div>
          <div className="stat-card"><div className="stat-key">Akaunti za Wanachama</div><div className="stat-val">{memberAccounts.length}</div></div>
        </div>
      </div>

      {/* ══ 4. AKAUNTI ZA WANACHAMA (Member Portal) ══ */}
      <div className="card">
        <h2>Akaunti za Wanachama (Portal)</h2>
        <p className="hint">
          Kila mwanachama anaweza kupata akaunti yake ya kuingia na kuona taarifa zake mwenyewe pekee —
          hisa, michango, na mikopo.
        </p>

        {maFlash && <div className={`flash${maFlash.type==='error'?' error':''}`}>{maFlash.msg}</div>}

        {/* Existing accounts table */}
        {memberAccounts.length > 0 && (
          <div className="table-wrap" style={{ marginBottom:20 }}>
            <table>
              <thead>
                <tr>
                  <th>Mwanachama</th><th>Jina la Mtumiaji</th>
                  <th>Hali</th><th>Imeundwa</th><th>Vitendo</th>
                </tr>
              </thead>
              <tbody>
                {memberAccounts.map(a => (
                  <tr key={a.id} style={{ opacity: a.active ? 1 : 0.55 }}>
                    <td><strong>{a.memberJina}</strong></td>
                    <td>
                      <code style={{ background:'#f2f0e8', padding:'1px 6px', borderRadius:4, fontSize:12 }}>
                        {a.username}
                      </code>
                    </td>
                    <td className="td-center">
                      <span className={`loan-badge ${a.active ? 'badge-imelipwa' : 'badge-imechelewa'}`}
                        style={{ cursor:'pointer' }} onClick={() => toggleActive(a)}
                        title="Bonyeza kubadilisha hali">
                        {a.active ? 'Hai' : 'Imezimwa'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'#888' }}>
                      {new Date(a.createdAt).toLocaleDateString('sw-TZ')}
                    </td>
                    <td className="td-center">
                      {/* Inline password change */}
                      {pwdEdit?.id === a.id ? (
                        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                          <input className="form-input" type="password" placeholder="Nenosiri jipya"
                            style={{ width:130, padding:'4px 8px', fontSize:12 }}
                            value={pwdEdit.value}
                            onChange={e => setPwdEdit(p=>({...p, value:e.target.value}))} />
                          <button className="btn-primary" style={{ padding:'4px 10px', fontSize:12 }}
                            onClick={() => changePassword(a.id)}>Hifadhi</button>
                          <button className="btn-ghost" style={{ padding:'4px 10px', fontSize:12 }}
                            onClick={() => setPwdEdit(null)}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                          <button className="btn-link"
                            onClick={() => setPwdEdit({ id:a.id, value:'' })}>
                            🔑 Nenosiri
                          </button>
                          <button className="btn-danger"
                            onClick={() => deleteMemberAccount(a.id, a.memberJina)}>
                            Futa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create new member account */}
        <div className="section-group">
          <div className="section-group-title">Unda Akaunti Mpya kwa Mwanachama</div>
          <div className="section-group-body">
            {membersWithoutAccount.length === 0 ? (
              <div className="empty-state" style={{ padding:'10px 0' }}>
                Wanachama wote wana akaunti tayari.
              </div>
            ) : (
              <form onSubmit={createMemberAccount} noValidate>
                <div className="form-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', marginBottom:14 }}>
                  <div className="form-field">
                    <label className="form-label">Chagua Mwanachama</label>
                    <select className="form-select" required value={newMa.memberId}
                      onChange={e => {
                        const m = members.find(x=>x.id===e.target.value);
                        const suggestedUsername = m ? m.jina.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g,'') : '';
                        setNewMa(n=>({...n, memberId:e.target.value, username: suggestedUsername}));
                      }}>
                      <option value="">— Chagua mwanachama —</option>
                      {membersWithoutAccount.map(m => (
                        <option key={m.id} value={m.id}>{m.jina}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Jina la Mtumiaji</label>
                    <input className="form-input" required value={newMa.username}
                      onChange={e => setNewMa(n=>({...n, username:e.target.value.toLowerCase().replace(/\s/g,'')}))}
                      placeholder="mf. joram" />
                    <span className="field-hint">Herufi ndogo, bila nafasi</span>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Nenosiri la Kwanza</label>
                    <input className="form-input" type="password" required value={newMa.password}
                      onChange={e => setNewMa(n=>({...n, password:e.target.value}))}
                      placeholder="••••••••" />
                    <span className="field-hint">Angalau herufi 6</span>
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={addingMa}>
                  {addingMa ? 'Inaunda...' : '+ Unda Akaunti'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ══ 5. WASIMAMIZI NA MAAFISA ══ */}
      <div className="card">
        <h2>Wasimamizi na Maafisa</h2>
        <p className="hint">
          Afisa mmoja anaweza kuwa na cheo moja: <strong>Msimamizi</strong>, <strong>Mwenyekiti</strong>,
          <strong> Katibu</strong>, au <strong>Mwasibu</strong>. Wote wanaweza kuona taarifa zote za wanachama.
        </p>

        {offFlash && <div className={`flash${offFlash.type==='error'?' error':''}`}>{offFlash.msg}</div>}

        {officers.length > 0 && (
          <div className="table-wrap" style={{ marginBottom:20 }}>
            <table>
              <thead>
                <tr><th>Jina la Mtumiaji</th><th>Cheo</th><th>Imeundwa</th><th>Vitendo</th></tr>
              </thead>
              <tbody>
                {officers.map(o => (
                  <tr key={o.id}>
                    <td>
                      {o.username}
                      {o.id === user?.id && <span className="you-badge">wewe</span>}
                    </td>
                    <td>
                      {o.id !== user?.id ? (
                        <select className="form-select" style={{ padding:'3px 28px 3px 8px', fontSize:12 }}
                          value={o.role || 'admin'}
                          onChange={e => changeOfficerRole(o.id, e.target.value)}>
                          {OFFICER_ROLES.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="loan-badge badge-hai">{ROLE_LABELS[o.role] || o.role}</span>
                      )}
                    </td>
                    <td style={{ fontSize:12, color:'#888' }}>
                      {new Date(o.createdAt).toLocaleDateString('sw-TZ')}
                    </td>
                    <td className="td-center">
                      {o.id !== user?.id ? (
                        <button className="btn-danger" onClick={() => removeOfficer(o.id, o.username)}>Futa</button>
                      ) : (
                        <span style={{ color:'#aaa', fontSize:12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={addOfficer} noValidate>
          <p style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>Ongeza Afisa Mpya</p>
          <div className="form-grid" style={{ maxWidth:560 }}>
            <div className="form-field">
              <label className="form-label">Jina la Mtumiaji</label>
              <input className="form-input" required value={newOfficer.username}
                onChange={e => setNewOfficer(o=>({...o, username:e.target.value}))}
                placeholder="mf. mwenyekiti1" />
            </div>
            <div className="form-field">
              <label className="form-label">Nenosiri</label>
              <input className="form-input" type="password" required value={newOfficer.password}
                onChange={e => setNewOfficer(o=>({...o, password:e.target.value}))}
                placeholder="••••••••" />
            </div>
            <div className="form-field">
              <label className="form-label">Cheo</label>
              <select className="form-select" value={newOfficer.role}
                onChange={e => setNewOfficer(o=>({...o, role:e.target.value}))}>
                {OFFICER_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={addingOfficer}>
            {addingOfficer ? 'Inaongeza...' : 'Ongeza Afisa'}
          </button>
        </form>
      </div>
    </>
  );
}
