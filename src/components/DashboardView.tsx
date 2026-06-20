'use client';

import React, { useState } from 'react';

interface DashboardViewProps {
  setActiveView?: (view: string) => void;
}

export default function DashboardView({ setActiveView }: DashboardViewProps = {}) {
  const [events] = useState([
    { id: 'EVT-2024-003', name: 'Ganesh Chaturthi', type: 'Religious', date: '2024-09-07', location: 'Central Avenue', status: 'Active', impact: 'Critical' },
    { id: 'EVT-2024-008', name: 'Road Widening Phase 2', type: 'Construction', date: '2024-08-01', location: 'Highway 4', status: 'Active', impact: 'Medium' },
    { id: 'EVT-2024-004', name: 'Marathon 2024', type: 'Marathon', date: '2024-11-17', location: 'Ring Road', status: 'Planned', impact: 'High' },
    { id: 'EVT-2024-006', name: 'Diwali Celebrations', type: 'Festival', date: '2024-11-01', location: 'Market Square', status: 'Planned', impact: 'Critical' }
  ]);

  const [lastRefreshed, setLastRefreshed] = useState('2 min ago');

  const [activities] = useState([
    { id: 1, type: 'incident', text: 'Accident reported at Central Ave / Ring Road junction. Delay estimated at 22 min.', time: '22 min ago', badgeColor: '#ef4444' },
    { id: 2, type: 'diversion', text: 'Diversion Route Alpha activated via Ring Road South (+8 min).', time: '8 min ago', badgeColor: '#10b981' },
    { id: 3, type: 'event', text: 'New Event Assessment created for "Diwali Celebrations" (Critical Impact).', time: '2 min ago', badgeColor: '#f59e0b' },
    { id: 4, type: 'personnel', text: '42 additional Traffic Personnel deployed to Central Sector.', time: 'Just now', badgeColor: '#3b82f6' }
  ]);

  return (
    <div className="view-container animate-fade-in" id="view-dashboard">
      <div className="hero" id="heroSection">
        <div className="hero__background"></div>
        <div className="hero__content">
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '100px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '12px', marginBottom: '24px' }}>
            <span className="live-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
            System Operational — All Zones Active
          </div>
          <h1 className="hero__title">Event-Driven Traffic<br />Impact Management</h1>
          <p className="hero__subtitle">Forecast congestion before it happens and optimize field operations for safer mobility.</p>
          <div className="hero__actions">
            <button className="hero__cta-primary" id="btnCreateAssessment" onClick={() => setActiveView?.('events')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Event Assessment
            </button>
            <button className="hero__cta-secondary" id="btnViewActive" onClick={() => setActiveView?.('events')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              View Active Events
            </button>
          </div>
          <div className="hero-stats" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginTop: '64px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '24px' }}>
            <div className="hero-stat">
              <span className="hero-stat-value" style={{ display: 'block', fontSize: '28px', fontWeight: '800', color: '#fff' }}>99.7%</span>
              <span className="hero-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>System Uptime</span>
            </div>
            <div className="hero-stat-divider" style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            <div className="hero-stat">
              <span className="hero-stat-value" style={{ display: 'block', fontSize: '28px', fontWeight: '800', color: '#fff' }}>24/7</span>
              <span className="hero-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Live Monitoring</span>
            </div>
            <div className="hero-stat-divider" style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            <div className="hero-stat">
              <span className="hero-stat-value" style={{ display: 'block', fontSize: '28px', fontWeight: '800', color: '#fff' }}>6 Zones</span>
              <span className="hero-stat-label" style={{ fontSize: '12px', color: '#94a3b8' }}>Coverage Area</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section" id="metricsSection" style={{ padding: '0 32px' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '24px', width: '100%' }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Operations Overview</h2>
          </div>
          <div className="section-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
            <span className="last-updated" style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Updated {lastRefreshed}
            </span>
            <button className="btn btn-ghost btn-sm" id="refreshMetrics" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setLastRefreshed('Just now')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Refresh
            </button>
          </div>
        </div>
        <div className="metrics-row" style={{ padding: '0 0 24px 0' }}>
          <div className="metric-card">
            <div className="metric-card__icon metric-card__icon--emerald">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>
            </div>
            <div className="metric-card__value">12</div>
            <div className="metric-card__label">Active Events</div>
            <div className="metric-card__trend metric-card__trend--up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              +3 from last week
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-card__icon metric-card__icon--amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div className="metric-card__value">47</div>
            <div className="metric-card__label">Congestion Zones</div>
            <div className="metric-card__trend metric-card__trend--down" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
              −5 from yesterday
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-card__icon metric-card__icon--blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="metric-card__value">284</div>
            <div className="metric-card__label">Personnel Deployed</div>
            <div className="metric-card__trend metric-card__trend--up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              +42 today
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-card__icon metric-card__icon--slate" style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#475569' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
            </div>
            <div className="metric-card__value">18</div>
            <div className="metric-card__label">Active Diversions</div>
            <div className="metric-card__trend" style={{ color: '#475569', backgroundColor: 'rgba(100, 116, 139, 0.1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              No change
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-card__icon metric-card__icon--emerald">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div className="metric-card__value">34%</div>
            <div className="metric-card__label">Delay Reduction</div>
            <div className="metric-card__trend metric-card__trend--up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              +8% improvement
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ padding: '0 32px 32px 32px' }}>
        <div className="dashboard-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Recent Active & Planned Events</h3>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Impact</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((evt) => (
                    <tr key={evt.id}>
                      <td><strong>{evt.name}</strong></td>
                      <td>{evt.type}</td>
                      <td>{evt.location}</td>
                      <td>
                        <span className={`badge badge--${evt.impact === 'Critical' ? 'critical' : evt.impact === 'High' ? 'warning' : 'info'}`}>
                          {evt.impact}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${evt.status === 'Active' ? 'active' : 'inactive'}`}>
                          {evt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }}></span>
                Live Activity Feed
              </h3>
            </div>
            <div className="activity-feed" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activities.map((act) => (
                <div key={act.id} className="feed-item" style={{ display: 'flex', gap: '12px', alignItems: 'start', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span className="feed-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: act.badgeColor, marginTop: '6px', flexShrink: 0 }}></span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>{act.text}</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
