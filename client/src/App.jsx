import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from './api/index.js';
import LoginPage    from './components/LoginPage.jsx';
import MemberPortal from './components/MemberPortal.jsx';
import Header       from './components/Header.jsx';
import Tabs         from './components/Tabs.jsx';
import Dashboard    from './components/Dashboard.jsx';
import Members      from './components/Members.jsx';
import EntryForm    from './components/EntryForm.jsx';
import MemberBook   from './components/MemberBook.jsx';
import GeneralBook  from './components/GeneralBook.jsx';
import LoanBook     from './components/LoanBook.jsx';
import Settings     from './components/Settings.jsx';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// Officers: admin | mwenyekiti | katibu | mwasibu
const OFFICER_ROLES = new Set(['admin', 'mwenyekiti', 'katibu', 'mwasibu']);const TABS = [
  { id: 'dashibodi',         label: 'Dashibodi' },
  { id: 'wanachama',         label: 'Wanachama' },
  { id: 'ingiza',            label: 'Ingiza Mchango', adminOnly: true },
  { id: 'kitabu-mwanachama', label: 'Kitabu cha Mwanachama' },
  { id: 'kitabu-jumla',      label: 'Kitabu cha Jumla' },
  { id: 'kitabu-mkopo',      label: 'Kitabu cha Mkopo' },
  { id: 'mipangilio',        label: 'Mipangilio', adminOnly: true },
];

/* ─── Stored user helpers ─────────────────────────────────────────────────── */
function readStoredUser() {
  try {
    // Prefer the new key; fall back to the legacy bat-file key
    const raw = localStorage.getItem('kikoba_user')
      || localStorage.getItem('kikoba_admin');
    if (!raw) return null;
    const u = JSON.parse(raw);
    // Old bat-file stored { id, username } without role — treat as admin
    if (u && !u.role) u.role = 'admin';
    return u;
  } catch { return null; }
}
function writeUser(u) {
  localStorage.setItem('kikoba_user', JSON.stringify(u));
  // keep legacy key for the bat autologin script
  if (OFFICER_ROLES.has(u?.role)) {
    localStorage.setItem('kikoba_admin', JSON.stringify(u));
  }
}
function clearUser() {
  localStorage.removeItem('kikoba_token');
  localStorage.removeItem('kikoba_user');
  localStorage.removeItem('kikoba_admin');
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  /* ── Theme ── */
  const [theme, setThemeState] = useState(() =>
    localStorage.getItem('kikoba_theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kikoba_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setThemeState(t => t === 'light' ? 'dark' : 'light');
  }

  const [user,     setUser]     = useState(readStoredUser);
  const [showLogin,setShowLogin]= useState(false);
  const [tab,      setTabState] = useState('dashibodi');
  const [members,  setMembers]  = useState([]);
  const [entries,  setEntries]  = useState([]);
  const [settings, setSettings] = useState({ groupName: '', sharePrice: 25000, jamiiKiwango: 10000, bimaKiwango: 0, hisaIdadiChaguo: 1 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const isOfficer = user && OFFICER_ROLES.has(user.role);
  const isMember  = user && user.role === 'mwanachama';

  /* ── Verify stored token on mount ── */
  useEffect(() => {
    const token = localStorage.getItem('kikoba_token');
    if (token && !user) {
      api.getMe()
        .then(d => {
          const u = d.user || d.admin;
          if (!u) { clearUser(); setUser(null); return; }
          if (!u.role) u.role = 'admin';
          setUser(u);
          writeUser(u);
        })
        .catch(() => { clearUser(); setUser(null); });
    }
  }, []);

  /* ── Load data when user is an officer ── */
  useEffect(() => {
    if (!user || isMember) {
      setLoading(false);
      return;
    }
    async function init() {
      try {
        const [m, e, s] = await Promise.all([
          api.getMembers(),
          api.getEntries(),
          api.getSettings(),
        ]);
        setMembers(m);
        setEntries(e);
        setSettings({
          groupName:       s.groupName       || '',
          sharePrice:      Number(s.sharePrice)      || 25000,
          jamiiKiwango:    Number(s.jamiiKiwango)     || 10000,
          bimaKiwango:     Number(s.bimaKiwango)      || 0,
          hisaIdadiChaguo: Number(s.hisaIdadiChaguo)  || 1,
        });
      } catch {
        setError('Imeshindwa kuunganisha na seva. Hakikisha seva inaendesha kwenye port 5000.');
      } finally { setLoading(false); }
    }
    init();
  }, [user]);

  /* ── Auth handlers ── */
  function handleLogin(u) {
    if (!u.role) u.role = 'admin';
    setUser(u);
    writeUser(u);
    setShowLogin(false);
    setTabState('dashibodi');
  }

  function handleLogout() {
    clearUser();
    setUser(null);
    setTabState('dashibodi');
    // Reload to clear all state
    setMembers([]); setEntries([]);
    setLoading(true);
  }

  /* ── Tab change for officers ── */
  function handleTabChange(id) {
    const t = TABS.find(x => x.id === id);
    if (t?.adminOnly && !isOfficer) { setShowLogin(true); return; }
    setShowLogin(false);
    setTabState(id);
  }

  /* ── Refresh helpers ── */
  const refreshMembers  = useCallback(async () => { setMembers(await api.getMembers()); }, []);
  const refreshEntries  = useCallback(async () => { setEntries(await api.getEntries()); }, []);
  const refreshSettings = useCallback(async () => {
    const s = await api.getSettings();
    setSettings({
      groupName:       s.groupName       || '',
      sharePrice:      Number(s.sharePrice)      || 25000,
      jamiiKiwango:    Number(s.jamiiKiwango)     || 10000,
      bimaKiwango:     Number(s.bimaKiwango)      || 0,
      hisaIdadiChaguo: Number(s.hisaIdadiChaguo)  || 1,
    });
  }, []);

  /* ── No user yet ── */
  if (!user || showLogin) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onCancel={user ? () => setShowLogin(false) : null}
      />
    );
  }

  /* ── Member portal ── */
  if (isMember) {
    return <MemberPortal user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />;
  }

  /* ── Officer loading / error ── */
  if (loading) return <div className="loading">Inapakia mfumo wa kikoba...</div>;
  if (error)   return (
    <div className="app-wrap">
      <div className="card" style={{ marginTop: 40 }}>
        <div className="empty-state" style={{ color: 'var(--red)' }}>{error}</div>
      </div>
    </div>
  );

  /* ── Officer app ── */
  const ctx = {
    admin: user, user, handleLogout,
    isAdmin: isOfficer, isOfficer,
    userRole: user.role,
    openLogin: () => setShowLogin(true),
    tab, setTab: handleTabChange,
    members, setMembers, refreshMembers,
    entries, setEntries, refreshEntries,
    settings, setSettings, refreshSettings,
    theme, toggleTheme,
  };

  const visibleTabs = TABS.filter(t => !t.adminOnly || isOfficer);

  return (
    <AppContext.Provider value={ctx}>
      <div className="app-wrap">
        <Header />
        <Tabs tabs={visibleTabs} activeTab={tab} onTabChange={handleTabChange} />
        <main>
          {tab === 'dashibodi'         && <Dashboard />}
          {tab === 'wanachama'         && <Members />}
          {tab === 'ingiza'            && <EntryForm />}
          {tab === 'kitabu-mwanachama' && <MemberBook />}
          {tab === 'kitabu-jumla'      && <GeneralBook />}
          {tab === 'kitabu-mkopo'      && <LoanBook />}
          {tab === 'mipangilio'        && <Settings />}
        </main>
      </div>
    </AppContext.Provider>
  );
}
