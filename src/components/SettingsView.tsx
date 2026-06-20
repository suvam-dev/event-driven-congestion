'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');
  const [isDarkMode, setIsDarkMode] = useState(
    () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [language, setLanguage] = useState('English');
  const [timeZone, setTimeZone] = useState('IST (UTC+5:30)');
  const [zoomLevel, setZoomLevel] = useState('Zone Level');

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [criticalThreshold, setCriticalThreshold] = useState(85);

  // Integrations State
  const [apiKey, setApiKey] = useState('uf_live_8f3d1b9c2a5e7b4a6f9c');
  const [webhookUrl, setWebhookUrl] = useState('https://api.municipal.gov/traffic/webhook');
  const [mapStyle, setMapStyle] = useState('Vector Outline');
  const [speedUnit, setSpeedUnit] = useState('km/h');

  // Success alert indicator
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('urbanflow-theme', 'dark');
      setAlertMsg("Dark Mode theme enabled.");
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('urbanflow-theme', 'light');
      setAlertMsg("Light Mode theme enabled.");
    }
  };

  const handleSave = () => {
    setAlertMsg("Settings profiles synchronized successfully.");
  };

  // Dismiss banner automatically
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => setAlertMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  return (
    <div className="view-container animate-fade-in" style={{ padding: '24px' }}>
      {/* Alert Banner */}
      {alertMsg && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 1000,
          background: '#0f172a', border: '1px solid #334155', borderLeft: '4px solid #10b981',
          padding: '12px 18px', borderRadius: '8px', color: '#f8fafc', fontSize: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span>🛡️</span>
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="page-title" style={{ fontWeight: '700', fontSize: '24px', color: '#0f172a' }}>System Settings</h2>
          <p className="page-subtitle" style={{ margin: 0 }}>Configure telemetry preferences, map layers thresholds, dark mode displays, and API key integrations.</p>
        </div>
        <button className="btn btn--primary" onClick={handleSave}>
          💾 Save Configuration
        </button>
      </div>

      {/* Settings BEM Layout Panel */}
      <div className="settings-layout" style={{ display: 'flex', gap: '24px' }}>
        {/* Sidebar Nav */}
        <div className="settings-sidebar" style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'general', label: 'General & Theme' },
            { id: 'notifications', label: 'Alert Rules' },
            { id: 'display', label: 'Map Configurations' },
            { id: 'data', label: 'Data & Privacy' },
            { id: 'integrations', label: 'APIs & Webhooks' },
            { id: 'about', label: 'License & System' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
              style={{
                textAlign: 'left', padding: '10px 14px', borderRadius: '6px', fontSize: '13px',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s', width: '100%',
                fontWeight: activeTab === item.id ? '700' : '500',
                background: activeTab === item.id ? 'var(--navy)' : 'transparent',
                color: activeTab === item.id ? 'var(--white)' : 'var(--slate)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Pane */}
        <div className="settings-content" style={{ flex: 1 }}>
          {activeTab === 'general' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>General Settings</h3>
              
              <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Dark Mode toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Dark Mode Theme</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Switch display between light and dark municipal console views.</span>
                  </div>
                  <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={(e) => handleThemeToggle(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      background: isDarkMode ? '#10b981' : '#cbd5e1', transition: '.3s', borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
                        background: 'white', transition: '.3s', borderRadius: '50%',
                        transform: isDarkMode ? 'translateX(18px)' : 'none'
                      }}></span>
                    </span>
                  </label>
                </div>

                {/* Auto-refresh */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Auto-refresh dashboard metrics</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Updates coordinate congestion overlays and volume trends every 30 seconds.</span>
                  </div>
                  <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      background: autoRefresh ? '#10b981' : '#cbd5e1', transition: '.3s', borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
                        background: 'white', transition: '.3s', borderRadius: '50%',
                        transform: autoRefresh ? 'translateX(18px)' : 'none'
                      }}></span>
                    </span>
                  </label>
                </div>

                {/* Language Select */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Console Language</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Select preferred language overlay.</span>
                  </div>
                  <select
                    className="form-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ width: '160px', background: '#ffffff', borderColor: '#cbd5e1', fontSize: '12px', padding: '4px 8px' }}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi / हिंदी</option>
                    <option value="Tamil">Tamil / தமிழ்</option>
                    <option value="Marathi">Marathi / मराठी</option>
                  </select>
                </div>

                {/* Time zone Select */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Operation Time Zone</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Align simulation timestamps and charts logs.</span>
                  </div>
                  <select
                    className="form-select"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    style={{ width: '180px', background: '#ffffff', borderColor: '#cbd5e1', fontSize: '12px', padding: '4px 8px' }}
                  >
                    <option value="IST (UTC+5:30)">IST (UTC+5:30)</option>
                    <option value="UTC">UTC</option>
                    <option value="GMT">GMT</option>
                  </select>
                </div>

                {/* Map Default Zoom Select */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Map Default Zoom Level</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Set starting frame for the interactive SVG maps.</span>
                  </div>
                  <select
                    className="form-select"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(e.target.value)}
                    style={{ width: '150px', background: '#ffffff', borderColor: '#cbd5e1', fontSize: '12px', padding: '4px 8px' }}
                  >
                    <option value="City Wide">City Wide</option>
                    <option value="Zone Level">Zone Level</option>
                    <option value="Street Level">Street Level</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Notification Alert Rules</h3>
              
              <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Email Incident Reports</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Send daily operational incident audits to chief officers.</span>
                  </div>
                  <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      background: emailAlerts ? '#10b981' : '#cbd5e1', transition: '.3s', borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
                        background: 'white', transition: '.3s', borderRadius: '50%',
                        transform: emailAlerts ? 'translateX(18px)' : 'none'
                      }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>SMS Emergency Broadcasts</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Dispatch immediate SMS notifications to field responders on gridlock alert.</span>
                  </div>
                  <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                      background: smsAlerts ? '#10b981' : '#cbd5e1', transition: '.3s', borderRadius: '34px'
                    }}>
                      <span style={{
                        position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
                        background: 'white', transition: '.3s', borderRadius: '50%',
                        transform: smsAlerts ? 'translateX(18px)' : 'none'
                      }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>Critical Congestion Threshold Trigger</strong>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>{criticalThreshold}% Congestion</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#ef4444', height: '6px', borderRadius: '3px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Triggers warning overlay flags in main control dashboard whenever a zone registers above this load capacity.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Map Configurations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '6px', color: '#334155' }}>Default Map Layer Style</strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Vector Outline', 'Dark Satellite', 'Simplified Transit'].map((style) => (
                      <button
                        key={style}
                        className={`btn btn--sm ${mapStyle === style ? 'btn--primary' : 'btn--ghost'}`}
                        onClick={() => { setMapStyle(style); setAlertMsg(`Map base rendered in ${style} style.`); }}
                        style={{ padding: '6px 12px' }}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ height: '1px', background: '#f1f5f9', margin: '10px 0' }}></div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '6px', color: '#334155' }}>Telemetry Speed Units</strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={`btn btn--sm ${speedUnit === 'km/h' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => { setSpeedUnit('km/h'); setAlertMsg('System units set to km/h.'); }}>km/h</button>
                    <button className={`btn btn--sm ${speedUnit === 'mph' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => { setSpeedUnit('mph'); setAlertMsg('System units set to mph.'); }}>mph</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Data & Privacy Controls</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                <p style={{ margin: 0, color: '#64748b' }}>Maintain security protocols and clear cached simulation models databases.</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button className="btn btn--secondary" onClick={() => setAlertMsg("Exporting system transaction log file...")}>
                    📄 Export Diagnostic Log
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      if (confirm("Are you sure you want to flush the cached simulation indexes?")) {
                        setAlertMsg("Local cache buffer flushed.");
                      }
                    }}
                    style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    🗑 Flush Simulation Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>APIs & Webhooks</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>Live API Key Token</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
                  />
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '3px' }}>Use this key to fetch real-time zone congestion telemetry programmatically.</span>
                </div>

                <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }}></div>

                <div>
                  <label style={{ fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>Critical Incident Webhook URL</label>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    style={{ width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '3px' }}>Sends POST payloads to your municipal server immediately when a high priority warning occurs.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>System Information</h3>
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Application Version</span>
                  <strong>UrbanFlow v2.4.1</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Last Source Update</span>
                  <strong>June 20, 2026</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Security License</span>
                  <strong>Gov-Municipal Tier-1 SLA</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span>Connected Sensor Nodes</span>
                  <strong>482 Active Inductor Loops</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
