'use client';

import React, { useState } from 'react';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Navigation({ activeView, setActiveView }: NavigationProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);

  const handleNavClick = (view: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveView(view);
  };

  return (
    <nav className="navbar" id="topNav">
      <a href="#dashboard" className="navbar__logo" onClick={(e) => handleNavClick('dashboard', e)}>
        <svg className="navbar__logo-icon" viewBox="0 0 32 32" width="32" height="32">
          <rect width="32" height="32" rx="8" fill="#10B981" />
          <path d="M8 22V10l8 6-8 6z" fill="#fff" opacity=".9" />
          <path d="M16 22V10l8 6-8 6z" fill="#fff" opacity=".6" />
        </svg>
        <span className="navbar__logo-text">Urban<span>Flow</span></span>
      </a>

      <div className="navbar__links" id="navLinks">
        <a
          href="#dashboard"
          className={`navbar__link ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('dashboard', e)}
        >
          <svg className="navbar__link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          Dashboard
        </a>
        <a
          href="#events"
          className={`navbar__link ${activeView === 'events' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('events', e)}
        >
          <svg className="navbar__link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          Events
        </a>
        <a
          href="#analysis"
          className={`navbar__link ${activeView === 'analysis' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('analysis', e)}
        >
          <svg className="navbar__link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          Traffic Analysis
        </a>
        <a
          href="#resources"
          className={`navbar__link ${activeView === 'resources' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('resources', e)}
        >
          <svg className="navbar__link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          Resource Planning
        </a>
        <a
          href="#reports"
          className={`navbar__link ${activeView === 'reports' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('reports', e)}
        >
          <svg className="navbar__link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          Reports
        </a>
        <a
          href="#settings"
          className={`navbar__link ${activeView === 'settings' ? 'active' : ''}`}
          onClick={(e) => handleNavClick('settings', e)}
        >
          <svg className="navbar__link-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4" /></svg>
          Settings
        </a>
      </div>

      <div className="navbar__actions">
          <button
          className="navbar__notification"
          onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          {!notifRead && <span className="navbar__notification-badge">4</span>}
        </button>

        {notifOpen && (
          <div className="notification-dropdown show" style={{ position: 'absolute', right: '80px', top: '55px', backgroundColor: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--rounded-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-xl)', width: '320px', zIndex: 1000 }}>
            <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h4 style={{ margin: 0, color: 'var(--navy)' }}>Notifications</h4>
              <button className="notif-mark-all" onClick={() => { setNotifRead(true); setNotifOpen(false); }} style={{ fontSize: 'var(--text-xs)', color: 'var(--emerald)', fontWeight: 650 }}>Mark all read</button>
            </div>
            <div className="notif-list">
              <div className="notif-item" style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
                <div className="notif-icon notif-icon-success" style={{ color: 'var(--emerald)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="notif-content">
                  <div className="notif-title" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--navy)' }}>New event submitted</div>
                  <div className="notif-time" style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Just now</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}>
          <div className="navbar__avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--slate)', color: 'var(--white)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
            <span>AK</span>
          </div>
          <span style={{ color: 'var(--white)', fontSize: 'var(--text-sm)', fontWeight: 500 }} className="user-name">Anand Kumar</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gray-400)' }}><polyline points="6 9 12 15 18 9" /></svg>
        </div>

        {userOpen && (
          <div className="user-dropdown show" style={{ position: 'absolute', right: '20px', top: '55px', backgroundColor: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--rounded-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-xl)', width: '240px', zIndex: 1000 }}>
            <div className="dropdown-user-info" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div className="navbar__avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--slate)', color: 'var(--white)', fontWeight: 700, width: '40px', height: '40px' }}><span>AK</span></div>
              <div>
                <div className="dropdown-user-name" style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 'var(--text-sm)' }}>Anand Kumar</div>
                <div className="dropdown-user-role" style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>Traffic Commissioner</div>
              </div>
            </div>
            <div className="dropdown-divider" style={{ height: '1px', backgroundColor: 'var(--gray-100)', margin: 'var(--space-2) 0' }}></div>
            <button onClick={() => { setUserOpen(false); setActiveView('settings'); }} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', color: 'var(--slate)', fontSize: 'var(--text-sm)', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              My Profile
            </button>
            <button onClick={() => { setUserOpen(false); setActiveView('settings'); }} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', color: 'var(--slate)', fontSize: 'var(--text-sm)', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09" /></svg>
              Preferences
            </button>
            <div className="dropdown-divider" style={{ height: '1px', backgroundColor: 'var(--gray-100)', margin: 'var(--space-2) 0' }}></div>
            <button onClick={() => { setUserOpen(false); alert('Signed out successfully.'); }} className="dropdown-item dropdown-item-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', color: 'var(--red)', fontSize: 'var(--text-sm)', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
