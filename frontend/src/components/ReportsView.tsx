'use client';

import React, { useState } from 'react';

// Predefined report data for events
const EVENT_REPORTS: Record<string, {
  overallEffectiveness: number;
  delayReduction: number;
  resourceUtilization: number;
  incidentsCount: number;
  predictedVolume: number[];
  actualVolume: number[];
  volumeLabels: string[];
  donutData: { label: string; percentage: number; color: string }[];
  effectivenessMetrics: { label: string; value: string; pct: number; target: string; color: string }[];
  incidents: { time: string; title: string; desc: string; priority: 'high' | 'medium'; badgeColor: string }[];
}> = {
  "evt-001": {
    overallEffectiveness: 92,
    delayReduction: 38,
    resourceUtilization: 87,
    incidentsCount: 3,
    predictedVolume: [1200, 1800, 2400, 2900, 3100, 2400, 1600],
    actualVolume: [1100, 1950, 2300, 3150, 3400, 2200, 1400],
    volumeLabels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
    donutData: [
      { label: "Manpower (Field)", percentage: 88, color: "#10b981" },
      { label: "Signage & Barriers", percentage: 76, color: "#3b82f6" },
      { label: "Logistics Fleet", percentage: 65, color: "#f59e0b" },
      { label: "Control Center Admin", percentage: 48, color: "#ef4444" },
    ],
    effectivenessMetrics: [
      { label: "Avg Response Time", value: "4.2 min", pct: 88, target: "Target: < 5 min", color: "emerald" },
      { label: "Diversion Compliance", value: "76%", pct: 76, target: "Target: > 80%", color: "amber" },
      { label: "Signal Coordination", value: "94%", pct: 94, target: "Target: > 90%", color: "emerald" },
      { label: "Communication Score", value: "89%", pct: 89, target: "Target: > 85%", color: "emerald" }
    ],
    incidents: [
      { time: "14:32", title: "Minor collision at Junction B4", desc: "Two vehicles involved, no injuries. Cleared in 18 minutes.", priority: "high", badgeColor: "red" },
      { time: "16:45", title: "Barricade breach at North Entry", desc: "Unauthorized vehicle entry. Security team responded in 3 minutes.", priority: "medium", badgeColor: "amber" },
      { time: "18:10", title: "Signal malfunction — Ring Road", desc: "Manual traffic control deployed. Signal restored at 18:45.", priority: "medium", badgeColor: "amber" }
    ]
  },
  "evt-002": {
    overallEffectiveness: 84,
    delayReduction: 25,
    resourceUtilization: 94,
    incidentsCount: 5,
    predictedVolume: [2000, 2500, 3200, 4100, 4800, 4600, 3000],
    actualVolume: [2200, 2800, 3800, 4600, 5200, 4100, 2800],
    volumeLabels: ["14:00", "16:00", "18:00", "19:00", "20:00", "22:00", "23:00"],
    donutData: [
      { label: "Manpower (Field)", percentage: 95, color: "#10b981" },
      { label: "Signage & Barriers", percentage: 90, color: "#3b82f6" },
      { label: "Logistics Fleet", percentage: 80, color: "#f59e0b" },
      { label: "Control Center Admin", percentage: 70, color: "#ef4444" },
    ],
    effectivenessMetrics: [
      { label: "Avg Response Time", value: "5.8 min", pct: 72, target: "Target: < 5 min", color: "amber" },
      { label: "Diversion Compliance", value: "81%", pct: 81, target: "Target: > 80%", color: "emerald" },
      { label: "Signal Coordination", value: "88%", pct: 88, target: "Target: > 90%", color: "amber" },
      { label: "Communication Score", value: "91%", pct: 91, target: "Target: > 85%", color: "emerald" }
    ],
    incidents: [
      { time: "17:15", title: "Crowd Overflow at West Gate", desc: "Spectator surge overspilled onto Main Corridor. Solved in 10 minutes.", priority: "high", badgeColor: "red" },
      { time: "19:00", title: "VIP Convoy Delay", desc: "Heavy congestion near Gate 3. Route cleared via manual diversion.", priority: "high", badgeColor: "red" },
      { time: "20:30", title: "Bus Breakdown on Route Alpha", desc: "Tow truck deployed, cleared corridor in 15 minutes.", priority: "medium", badgeColor: "amber" }
    ]
  },
  "evt-007": {
    overallEffectiveness: 97,
    delayReduction: 45,
    resourceUtilization: 98,
    incidentsCount: 1,
    predictedVolume: [1000, 1500, 2000, 2200, 2500, 1800, 1200],
    actualVolume: [950, 1400, 1900, 2100, 2300, 1750, 1100],
    volumeLabels: ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"],
    donutData: [
      { label: "Manpower (Field)", percentage: 98, color: "#10b981" },
      { label: "Signage & Barriers", percentage: 95, color: "#3b82f6" },
      { label: "Logistics Fleet", percentage: 85, color: "#f59e0b" },
      { label: "Control Center Admin", percentage: 90, color: "#ef4444" },
    ],
    effectivenessMetrics: [
      { label: "Avg Response Time", value: "2.5 min", pct: 98, target: "Target: < 5 min", color: "emerald" },
      { label: "Diversion Compliance", value: "92%", pct: 92, target: "Target: > 80%", color: "emerald" },
      { label: "Signal Coordination", value: "97%", pct: 97, target: "Target: > 90%", color: "emerald" },
      { label: "Communication Score", value: "96%", pct: 96, target: "Target: > 85%", color: "emerald" }
    ],
    incidents: [
      { time: "10:15", title: "Protest Group Near Security Line", desc: "Quickly routed via secondary barricades. No delay caused.", priority: "high", badgeColor: "red" }
    ]
  }
};

export default function ReportsView() {
  const [selectedEventId, setSelectedEventId] = useState('evt-001');
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [hoveredDonutRing, setHoveredDonutRing] = useState<number | null>(null);
  const [hoveredVolumeIdx, setHoveredVolumeIdx] = useState<number | null>(null);
  const [exportToast, setExportToast] = useState(false);

  const report = EVENT_REPORTS[selectedEventId] || EVENT_REPORTS["evt-001"];

  const handleExportPDF = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  // Filtered incidents
  const filteredIncidents = report.incidents.filter((inc) => {
    if (incidentFilter === 'all') return true;
    return inc.priority === incidentFilter;
  });

  // SVG dimensions for Line Chart
  const lineSvgWidth = 500;
  const lineSvgHeight = 220;
  const padding = 35;

  const getLineCoordinates = (data: number[]) => {
    const maxVal = 6000;
    return data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (lineSvgWidth - padding * 2);
      const y = lineSvgHeight - padding - (val / maxVal) * (lineSvgHeight - padding * 2);
      return { x, y, value: val };
    });
  };

  const predictedCoords = getLineCoordinates(report.predictedVolume);
  const actualCoords = getLineCoordinates(report.actualVolume);

  const predictedPath = predictedCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const actualPath = actualCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <div className="view-container animate-fade-in" style={{ padding: '24px' }}>
      {exportToast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 10005,
          background: '#1e293b', border: '1px solid #334155', borderLeft: '4px solid #10b981',
          borderRadius: '8px', padding: '14px 20px', color: '#f8fafc', fontSize: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)', display: 'flex', gap: '10px', alignItems: 'center'
        }}>
          <span>📥</span><span>Audit report PDF export initiated.</span>
        </div>
      )}
      {/* Header Actions */}
      <div className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 className="page-title" style={{ fontWeight: '700', fontSize: '24px', color: '#0f172a' }}>Post-Event Performance Review</h2>
          <p className="page-subtitle" style={{ margin: 0 }}>Review traffic management outcomes, congestion reduction indices, and deployment logs.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="form-select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setHoveredVolumeIdx(null);
            }}
            style={{ minWidth: '240px', background: '#ffffff', borderColor: '#cbd5e1' }}
          >
            <option value="evt-001">Republic Day Parade — Jan 26, 2024</option>
            <option value="evt-002">IPL Cricket Match — Mar 15, 2024</option>
            <option value="evt-007">PM Visit — Jun 10, 2024</option>
          </select>
          <button className="btn btn--secondary" onClick={handleExportPDF}>
            📥 Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="report-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#ecfdf5', color: '#10b981', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✓</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{report.overallEffectiveness}%</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Overall Effectiveness</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#eff6ff', color: '#3b82f6', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⏱</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>−{report.delayReduction}%</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Delay Reduction Index</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fffbeb', color: '#f59e0b', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚙</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{report.resourceUtilization}%</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Resource Utilization</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fef2f2', color: '#ef4444', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚠</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{report.incidentsCount}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Incidents Logged</div>
          </div>
        </div>
      </div>

      {/* Grid of Interactive SVG Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        {/* Chart 1: Predicted vs Actual Volume */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <span className="chart-card__title">Predicted vs Actual Traffic Volume</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '600' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '3px', borderTop: '2px dashed #10b981' }}></span> Predicted
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '600' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '3px', background: '#f59e0b' }}></span> Actual
              </span>
            </div>
          </div>

          <div style={{ padding: '16px', background: '#ffffff', position: 'relative' }}>
            <svg width="100%" height={lineSvgHeight} viewBox={`0 0 ${lineSvgWidth} ${lineSvgHeight}`}>
              {/* Grid Lines */}
              {Array.from({ length: 5 }).map((_, i) => {
                const y = padding + (i / 4) * (lineSvgHeight - padding * 2);
                const labelVal = Math.round(6000 - (i / 4) * 6000);
                return (
                  <g key={`grid-y-${i}`}>
                    <line x1={padding} y1={y} x2={lineSvgWidth - padding} y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                    <text x={padding - 6} y={y + 4} fill="#94a3b8" fontSize="9" textAnchor="end">{labelVal}</text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {report.volumeLabels.map((lbl, idx) => {
                const x = padding + (idx / (report.volumeLabels.length - 1)) * (lineSvgWidth - padding * 2);
                return (
                  <text key={`lbl-x-${idx}`} x={x} y={lineSvgHeight - 12} fill="#94a3b8" fontSize="9" textAnchor="middle">
                    {lbl}
                  </text>
                );
              })}

              {/* Predicted Path (Dashed) */}
              <path d={predictedPath} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Actual Path (Solid) */}
              <path d={actualPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

              {/* Interactive Hover Markers */}
              {actualCoords.map((c, idx) => (
                <g key={`interactive-p-${idx}`}>
                  <circle
                    cx={c.x} cy={c.y} r={12}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredVolumeIdx(idx)}
                    onMouseLeave={() => setHoveredVolumeIdx(null)}
                  />
                  <circle
                    cx={c.x} cy={c.y} r={hoveredVolumeIdx === idx ? 6 : 4}
                    fill={hoveredVolumeIdx === idx ? '#f59e0b' : '#ffffff'}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    style={{ transition: 'r 0.15s, fill 0.15s' }}
                  />
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredVolumeIdx !== null && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: `${Math.min(320, actualCoords[hoveredVolumeIdx].x + 10)}px`,
                background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
                padding: '8px 12px', color: '#f8fafc', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10
              }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Time: {report.volumeLabels[hoveredVolumeIdx]}</span>
                <span style={{ color: '#f59e0b', fontWeight: '700' }}>Actual: {report.actualVolume[hoveredVolumeIdx].toLocaleString()} veh/h</span>
                <span style={{ color: '#10b981', display: 'block' }}>Predicted: {report.predictedVolume[hoveredVolumeIdx].toLocaleString()} veh/h</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Resource Usage Concentric Rings */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <span className="chart-card__title">Resource Efficiency Allocations</span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Hover rings for breakdown</span>
          </div>

          <div style={{ padding: '16px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-around', minHeight: '220px' }}>
            <svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
              {report.donutData.map((d, idx) => {
                const radius = 40 + idx * 13;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (d.percentage / 100) * circumference;
                const isHovered = hoveredDonutRing === idx;

                return (
                  <g key={d.label}>
                    {/* Background Ring */}
                    <circle
                      cx={90} cy={90} r={radius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth={isHovered ? 10 : 7}
                      style={{ transition: 'stroke-width 0.2s' }}
                    />
                    {/* Active Progress Ring */}
                    <circle
                      cx={90} cy={90} r={radius}
                      fill="transparent"
                      stroke={d.color}
                      strokeWidth={isHovered ? 10 : 7}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ cursor: 'pointer', transition: 'stroke-dashoffset 0.5s, stroke-width 0.2s' }}
                      onMouseEnter={() => setHoveredDonutRing(idx)}
                      onMouseLeave={() => setHoveredDonutRing(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Donut Legend / Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              {report.donutData.map((d, idx) => (
                <div
                  key={d.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '4px',
                    background: hoveredDonutRing === idx ? '#f8fafc' : 'transparent',
                    border: hoveredDonutRing === idx ? '1px solid #cbd5e1' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredDonutRing(idx)}
                  onMouseLeave={() => setHoveredDonutRing(null)}
                >
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: d.color }}></span>
                  <span style={{ fontWeight: hoveredDonutRing === idx ? '700' : '500', color: '#334155' }}>
                    {d.label}: <strong>{d.percentage}%</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Columns: Response Effectiveness & Filterable Incident Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Response Effectiveness */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 className="card-title" style={{ marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Response Effectiveness Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {report.effectivenessMetrics.map((m) => (
              <div key={m.label} style={{ fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#475569', fontWeight: '600' }}>{m.label}</span>
                  <strong style={{ color: '#0f172a' }}>{m.value}</strong>
                </div>
                <div style={{ background: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${m.pct}%`,
                    background: m.color === 'emerald' ? '#10b981' : '#f59e0b',
                    height: '100%',
                    borderRadius: '3px'
                  }}></div>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', display: 'block' }}>{m.target}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents Summary Logs */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title" style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a', margin: 0 }}>Incident Logs Summary</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'high', 'medium'] as const).map((filter) => (
                <button
                  key={filter}
                  className={`btn btn--sm ${incidentFilter === filter ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setIncidentFilter(filter)}
                  style={{ padding: '2px 8px', fontSize: '10px' }}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((inc, idx) => (
                <div key={idx} style={{ borderLeft: `3px solid ${inc.priority === 'high' ? '#ef4444' : '#f59e0b'}`, background: '#f8fafc', padding: '8px 12px', borderRadius: '0 6px 6px 0', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ color: '#1e293b' }}>{inc.title}</strong>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>{inc.time}</span>
                  </div>
                  <p style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '11px' }}>{inc.desc}</p>
                  <span className={`badge badge--${inc.priority === 'high' ? 'critical' : 'warning'}`} style={{ padding: '2px 4px', fontSize: '9px' }}>
                    {inc.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
                No incidents matched current priority filter.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations & Action Plan Section */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px', fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Lessons Learned & Recommendations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px' }}>
            <strong style={{ color: '#166534', display: 'block', marginBottom: '8px', fontSize: '13px' }}>✓ Operational Successes</strong>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#166534', fontSize: '11px', lineHeight: '1.6' }}>
              <li>Early responder stationing (2 hours pre-event window).</li>
              <li>Dynamic green-wave signals cut gridlock wait by 38%.</li>
              <li>Emergency medical units pre-allocated to side alleys.</li>
              <li>SMS alerts successfully directed 72% of transit vehicles.</li>
            </ul>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px' }}>
            <strong style={{ color: '#92400e', display: 'block', marginBottom: '8px', fontSize: '13px' }}>⚡ Structural Pain Points</strong>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#92400e', fontSize: '11px', lineHeight: '1.6' }}>
              <li>Diversion compliance fell below targeted 80% mark.</li>
              <li>Route Beta signage lacked visibility in overcast weather.</li>
              <li>Auxiliary steel barriers were missing at parking exit.</li>
              <li>Telemetry delay between field marshals and main desk.</li>
            </ul>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px' }}>
            <strong style={{ color: '#1e40af', display: 'block', marginBottom: '8px', fontSize: '13px' }}>→ Strategic Action Items</strong>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#1e40af', fontSize: '11px', lineHeight: '1.6' }}>
              <li>Erect solar-powered digital signage along Central Ave.</li>
              <li>Acquire 10 extra Type B modular barriers.</li>
              <li>Initiate dedicated secure walkie channel for operators.</li>
              <li>Retrain predictive system on raw 2024 actual load vectors.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
