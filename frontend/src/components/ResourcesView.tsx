'use client';

import React, { useState, useEffect } from 'react';

// Predefined event resource sets
const EVENT_RESOURCES: Record<string, {
  totalPersonnel: number;
  equipmentUnits: number;
  budget: string;
  readiness: number;
  officersNeeded: number;
  officersAllocated: number;
  barricadesNeeded: number;
  barricadesAllocated: number;
  conesAllocated: number;
  zones: { id: string; name: string; count: number; badgeColor: string }[];
  routes: { letter: string; name: string; capacity: number; delay: number; distance: number; baseLoad: number; colorClass: string; badge: string }[];
}> = {
  "evt-003": {
    totalPersonnel: 73,
    equipmentUnits: 167,
    budget: "₹4.2L",
    readiness: 86,
    officersNeeded: 45,
    officersAllocated: 41,
    barricadesNeeded: 30,
    barricadesAllocated: 28,
    conesAllocated: 120,
    zones: [
      { id: "Z1", name: "Main Event Perimeter", count: 12, badgeColor: "red" },
      { id: "Z2", name: "Northern Access Way", count: 8, badgeColor: "amber" },
      { id: "Z3", name: "Southern Junction Loop", count: 6, badgeColor: "amber" },
      { id: "Z4", name: "VIP Parking Entrance", count: 2, badgeColor: "emerald" },
    ],
    routes: [
      { letter: "α", name: "Route Alpha — Ring Road South", capacity: 3200, delay: 8, distance: 4.2, baseLoad: 62, colorClass: "emerald", badge: "Primary" },
      { letter: "β", name: "Route Beta — Highway 7 Bypass", capacity: 2800, delay: 12, distance: 6.8, baseLoad: 44, colorClass: "amber", badge: "Secondary" },
      { letter: "γ", name: "Route Gamma — Outer Service Rd", capacity: 1500, delay: 15, distance: 8.1, baseLoad: 28, colorClass: "slate", badge: "Tertiary" },
    ]
  },
  "evt-004": {
    totalPersonnel: 95,
    equipmentUnits: 210,
    budget: "₹5.8L",
    readiness: 92,
    officersNeeded: 60,
    officersAllocated: 58,
    barricadesNeeded: 45,
    barricadesAllocated: 42,
    conesAllocated: 150,
    zones: [
      { id: "Z1", name: "Start/Finish Line Plaza", count: 18, badgeColor: "red" },
      { id: "Z2", name: "Interstate Bypass Ramp", count: 14, badgeColor: "red" },
      { id: "Z3", name: "Water Stations Grid", count: 5, badgeColor: "emerald" },
      { id: "Z4", name: "Spectator Boulevard", count: 5, badgeColor: "amber" },
    ],
    routes: [
      { letter: "α", name: "Route Alpha — Ring Road South", capacity: 3200, delay: 18, distance: 4.2, baseLoad: 85, colorClass: "red", badge: "Overloaded" },
      { letter: "β", name: "Route Beta — Highway 7 Bypass", capacity: 2800, delay: 6, distance: 6.8, baseLoad: 35, colorClass: "emerald", badge: "Clear Corridor" },
      { letter: "γ", name: "Route Gamma — Outer Service Rd", capacity: 1500, delay: 20, distance: 8.1, baseLoad: 68, colorClass: "amber", badge: "Heavy Load" },
    ]
  },
  "evt-006": {
    totalPersonnel: 120,
    equipmentUnits: 340,
    budget: "₹8.5L",
    readiness: 79,
    officersNeeded: 80,
    officersAllocated: 64,
    barricadesNeeded: 70,
    barricadesAllocated: 55,
    conesAllocated: 250,
    zones: [
      { id: "Z1", name: "Market Entrance Plaza", count: 25, badgeColor: "red" },
      { id: "Z2", name: "West Gate Crossing", count: 15, badgeColor: "red" },
      { id: "Z3", name: "Pedestrian Walkway Lane", count: 10, badgeColor: "amber" },
      { id: "Z4", name: "Overflow Parking Area", count: 5, badgeColor: "emerald" },
    ],
    routes: [
      { letter: "α", name: "Route Alpha — Ring Road South", capacity: 3200, delay: 14, distance: 4.2, baseLoad: 72, colorClass: "amber", badge: "Heavy Traffic" },
      { letter: "β", name: "Route Beta — Highway 7 Bypass", capacity: 2800, delay: 22, distance: 6.8, baseLoad: 90, colorClass: "red", badge: "Gridlock Risk" },
      { letter: "γ", name: "Route Gamma — Outer Service Rd", capacity: 1500, delay: 10, distance: 8.1, baseLoad: 40, colorClass: "emerald", badge: "Stable" },
    ]
  }
};

export default function ResourcesView() {
  const [selectedEventId, setSelectedEventId] = useState('evt-003');
  const [activeResources, setActiveResources] = useState(EVENT_RESOURCES["evt-003"]);

  // Timeline scrubber playback state
  const [timelineVal, setTimelineVal] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Success alert message state
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Update active resources on dropdown change
  const handleEventChange = (id: string) => {
    setSelectedEventId(id);
    if (EVENT_RESOURCES[id]) {
      setActiveResources(EVENT_RESOURCES[id]);
      setAlertMsg(null);
    }
  };

  // Interactive allocation handlers
  const handleAddOfficer = () => {
    if (activeResources.officersAllocated >= activeResources.officersNeeded + 10) {
      setAlertMsg("Maximum shift allocation thresholds reached.");
      return;
    }
    setActiveResources((prev) => {
      const nextAllocated = prev.officersAllocated + 1;
      const nextTotal = prev.totalPersonnel + 1;
      const nextReadiness = Math.min(100, Math.round((nextAllocated / prev.officersNeeded) * 100));
      return {
        ...prev,
        officersAllocated: nextAllocated,
        totalPersonnel: nextTotal,
        readiness: nextReadiness
      };
    });
    setAlertMsg("Additional traffic responder dispatched to active grid sector.");
  };

  const handleAddBarricade = (zoneIdx: number) => {
    setActiveResources((prev) => {
      const updatedZones = [...prev.zones];
      updatedZones[zoneIdx].count += 2;
      return {
        ...prev,
        equipmentUnits: prev.equipmentUnits + 2,
        barricadesAllocated: prev.barricadesAllocated + 2,
        zones: updatedZones
      };
    });
    setAlertMsg(`2 barriers deployed to Zone ${activeResources.zones[zoneIdx].id}`);
  };

  // Playback timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimelineVal((prev) => {
          const next = prev + 2 * speed;
          if (next >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  // Alert dismiss timer
  useEffect(() => {
    if (alertMsg) {
      const timer = setTimeout(() => setAlertMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  // Convert timeline progress (0 - 100) into actual hour representation (6:00 AM to 10:00 PM)
  const getTimelineTimeLabel = (val: number) => {
    const totalMinutes = 6 * 60 + (val / 100) * (16 * 60); // 6:00 AM + hours * 60
    const hr24 = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    const ampm = hr24 >= 12 ? 'PM' : 'AM';
    const hr12 = hr24 > 12 ? hr24 - 12 : hr24 === 0 ? 12 : hr24;
    return `${hr12}:${String(mins).padStart(2, '0')} ${ampm}`;
  };

  // Calculate dynamic capacity load based on timeline scrubber progress
  const getDynamicLoad = (baseLoad: number) => {
    // Peak traffic curve modifier: peak around 9 AM (val=20) and 6 PM (val=75)
    const factor = Math.sin((timelineVal / 100) * Math.PI * 2.5);
    const wave = Math.round(factor * 15);
    return Math.min(100, Math.max(10, baseLoad + wave));
  };

  return (
    <div className="resources animate-fade-in">
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
      <div className="resources__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="resources__title" style={{ fontWeight: '700' }}>Resource Allocation & Dispatch</h2>
          <p className="page-subtitle" style={{ margin: 0 }}>Deploy personnel units, allocate physical barricades, and evaluate diversion capacity parameters.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="form-select"
            value={selectedEventId}
            onChange={(e) => handleEventChange(e.target.value)}
            style={{ minWidth: '240px', background: '#ffffff', borderColor: '#cbd5e1' }}
          >
            <option value="evt-003">Ganesh Chaturthi — Central Ave</option>
            <option value="evt-004">Marathon 2024 — Ring Road</option>
            <option value="evt-006">Diwali Celebrations — Market Square</option>
          </select>

          <button
            className="btn btn--primary"
            onClick={() => setAlertMsg("System configuration state stored successfully.")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            💾 Save Plan
          </button>
        </div>
      </div>

      {/* Resource Overview KPI Strip */}
      <div className="resource-overview-bar" style={{ display: 'flex', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '16px 24px', marginBottom: '24px', justifyContent: 'space-between' }}>
        <div className="resource-overview-item">
          <span className="resource-overview-label" style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personnel Deployed</span>
          <span className="resource-overview-value" style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{activeResources.totalPersonnel} <small style={{ fontSize: '12px', color: '#64748b' }}>active</small></span>
        </div>
        <div className="resource-overview-divider" style={{ width: '1px', background: '#e2e8f0' }}></div>
        <div className="resource-overview-item">
          <span className="resource-overview-label" style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equipment Units</span>
          <span className="resource-overview-value" style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{activeResources.equipmentUnits} <small style={{ fontSize: '12px', color: '#64748b' }}>units</small></span>
        </div>
        <div className="resource-overview-divider" style={{ width: '1px', background: '#e2e8f0' }}></div>
        <div className="resource-overview-item">
          <span className="resource-overview-label" style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget Cap Allocation</span>
          <span className="resource-overview-value" style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{activeResources.budget}</span>
        </div>
        <div className="resource-overview-divider" style={{ width: '1px', background: '#e2e8f0' }}></div>
        <div className="resource-overview-item">
          <span className="resource-overview-label" style={{ color: '#64748b', fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deployment Readiness</span>
          <span className="resource-overview-value" style={{ fontSize: '24px', fontWeight: '700', color: activeResources.readiness > 85 ? '#10b981' : '#f59e0b' }}>
            {activeResources.readiness}%
          </span>
        </div>
      </div>

      {/* Grid of 3 Core resource planning columns */}
      <div className="resources__grid" style={{ marginBottom: '24px' }}>
        {/* Column 1: Manpower Requirements */}
        <div className="resource-card resource-card--emerald">
          <div className="resource-card__header">
            <span className="resource-card__title">👮 Manpower Requirements</span>
            <span className="resource-card__count">{activeResources.officersAllocated} / {activeResources.officersNeeded} Officers</span>
          </div>
          <div className="resource-card__body">
            <div className="resource-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Shift Strength Progress</span>
                <strong style={{ color: '#0f172a' }}>{Math.round((activeResources.officersAllocated / activeResources.officersNeeded) * 100)}%</strong>
              </div>
              <div style={{ background: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                  background: '#10b981', height: '100%',
                  width: `${Math.min(100, (activeResources.officersAllocated / activeResources.officersNeeded) * 100)}%`,
                  borderRadius: '3px', transition: 'width 0.4s'
                }}></div>
              </div>
              <button
                className="btn btn--sm btn--primary"
                onClick={handleAddOfficer}
                style={{ width: '100%', marginTop: '4px', padding: '6px 12px', fontSize: '12px' }}
              >
                ➕ Dispatch Auxiliary Officer
              </button>
            </div>

            <div className="resource-divider" style={{ height: '1px', background: '#f1f5f9', margin: '14px 0' }}></div>

            <div style={{ fontSize: '12px' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '8px' }}>Shift Allocation Schedules:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#334155' }}>
                    <span>Morning: 6 AM — 2 PM</span>
                    <span>100% Filled</span>
                  </div>
                  <div style={{ background: '#e2e8f0', height: '4px', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ background: '#10b981', height: '100%', width: '100%' }}></div>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#334155' }}>
                    <span>Evening: 2 PM — 10 PM</span>
                    <span>{activeResources.officersAllocated > 41 ? '92%' : '84%'} Filled</span>
                  </div>
                  <div style={{ background: '#e2e8f0', height: '4px', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ background: '#f59e0b', height: '100%', width: activeResources.officersAllocated > 41 ? '92%' : '84%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="resource-divider" style={{ height: '1px', background: '#f1f5f9', margin: '14px 0' }}></div>

            <div style={{ fontSize: '12px' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '8px' }}>Active Emergency Teams:</strong>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Team Alpha (West Bypass) — Ready
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span> Team Bravo (CBD Core) — On Route
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span> Team Charlie (South Bypass) — Standby
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Column 2: Barricading Plan */}
        <div className="resource-card resource-card--amber">
          <div className="resource-card__header">
            <span className="resource-card__title">🚧 Barricading Plan</span>
            <span className="resource-card__count">{activeResources.barricadesAllocated} / {activeResources.barricadesNeeded} Units</span>
          </div>
          <div className="resource-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{activeResources.barricadesAllocated}</div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Barriers Block</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{activeResources.conesAllocated}</div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Traffic Cones</div>
              </div>
            </div>

            <div style={{ fontSize: '12px' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '8px' }}>Placement Sectors & deployment:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeResources.zones.map((zone, idx) => (
                  <div key={zone.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge badge--${zone.badgeColor === 'red' ? 'critical' : zone.badgeColor === 'amber' ? 'warning' : 'active'}`} style={{ padding: '2px 4px', fontSize: '9px' }}>
                        {zone.id}
                      </span>
                      <span style={{ fontWeight: '500', color: '#334155' }}>{zone.name} ({zone.count})</span>
                    </div>
                    <button
                      className="btn btn--sm btn--ghost"
                      onClick={() => handleAddBarricade(idx)}
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                    >
                      + Add 2
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Diversion Strategy */}
        <div className="resource-card resource-card--red" style={{ borderTopColor: '#3b82f6' }}>
          <div className="resource-card__header">
            <span className="resource-card__title">🧭 Diversion Strategy</span>
            <span className="resource-card__count">{activeResources.routes.length} Active Channels</span>
          </div>
          <div className="resource-card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeResources.routes.map((route) => {
                const dynamicLoad = getDynamicLoad(route.baseLoad);
                return (
                  <div key={route.letter} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                        <span style={{ display: 'inline-block', width: '18px', height: '18px', borderRadius: '50%', background: '#3b82f6', color: '#ffffff', textAlign: 'center', lineHeight: '18px', fontSize: '11px', marginRight: '6px' }}>
                          {route.letter}
                        </span>
                        {route.name.split(' — ')[1]}
                      </strong>
                      <span className={`badge badge--${dynamicLoad > 80 ? 'critical' : dynamicLoad > 50 ? 'warning' : 'active'}`} style={{ fontSize: '9px' }}>
                        {dynamicLoad > 80 ? 'Heavy Gridlock' : route.badge}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>
                      <div>
                        <span>Volume limit:</span>
                        <div style={{ fontWeight: '700', color: '#334155' }}>{route.capacity} veh/h</div>
                      </div>
                      <div>
                        <span>Est Delay:</span>
                        <div style={{ fontWeight: '700', color: '#334155' }}>+{route.delay} mins</div>
                      </div>
                      <div>
                        <span>Distance:</span>
                        <div style={{ fontWeight: '700', color: '#334155' }}>{route.distance} km</div>
                      </div>
                    </div>

                    <div style={{ background: '#f1f5f9', height: '5px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        background: dynamicLoad > 80 ? '#ef4444' : dynamicLoad > 50 ? '#f59e0b' : '#10b981',
                        height: '100%',
                        width: `${dynamicLoad}%`,
                        borderRadius: '3px',
                        transition: 'width 0.3s'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8', marginTop: '3px' }}>
                      <span>Current Road Load</span>
                      <span>{dynamicLoad}% capacity used</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Interactive Timeline Replay Scrubber */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔄 Diversion Timeline Simulation Scrubber
          </h3>
          <span className="badge badge--info">System Flow Replay</span>
        </div>

        <div style={{ padding: '20px 24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              className="btn btn--sm"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                minWidth: '80px', padding: '6px 12px', fontSize: '11px', fontWeight: '700',
                background: isPlaying ? '#f59e0b' : '#10b981', color: '#0f172a'
              }}
            >
              {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
            </button>

            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 4].map((s) => (
                <button
                  key={`spd-${s}`}
                  className={`btn btn--sm ${speed === s ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setSpeed(s)}
                  style={{ padding: '4px 10px', fontSize: '10px' }}
                >
                  {s}×
                </button>
              ))}
            </div>

            <div style={{ flex: 1, minWidth: '260px' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={timelineVal}
                onChange={(e) => {
                  setTimelineVal(parseInt(e.target.value, 10));
                  setIsPlaying(false);
                }}
                style={{ width: '100%', accentColor: '#3b82f6', height: '6px', borderRadius: '3px', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                <span>6:00 AM (Start)</span>
                <span>10:00 AM</span>
                <span>2:00 PM</span>
                <span>6:00 PM (Peak)</span>
                <span>10:00 PM (End)</span>
              </div>
            </div>

            <div style={{
              background: '#0f172a', color: '#38bdf8', padding: '6px 14px', borderRadius: '6px',
              fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', minWidth: '100px', textAlign: 'center'
            }}>
              {getTimelineTimeLabel(timelineVal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
