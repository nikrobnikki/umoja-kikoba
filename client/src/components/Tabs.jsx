import React from 'react';

export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="tabs no-print" aria-label="Menyu kuu">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
          onClick={() => onTabChange(t.id)}
          aria-current={activeTab === t.id ? 'page' : undefined}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
