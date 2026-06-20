'use client';

import React, { useState } from 'react';

type ZoneStatus = {
  zone: string;
  speed: number;
  limit: number;
  volume: number;
  congestion: number;
  incidents: number;
  status: string;
  statusColor: 'red' | 'amber' | 'emerald';
};

// Data sets for different timeframes
const DATA_VOLUME_LINE: Record<string, { current: number[]; baseline: number[]; labels: string[] }> = {
  "1h": {
    current: [2400, 2650, 2900, 3100, 3400, 3150, 2800],
    baseline: [2200, 2300, 2500, 2700, 2900, 2800, 2600],
    labels: ["10m ago", "5m ago", "Now", "Now", "Now", "Now", "Now"]
  },
  "6h": {
    current: [1200, 1800, 3100, 4200, 3800, 2900],
    baseline: [1100, 1500, 2800, 3500, 3200, 2600],
    labels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
  },
  "24h": {
    current: [600, 450, 400, 850, 2100, 3800, 4100, 3600, 3200, 3950, 4600, 2200],
    baseline: [500, 400, 350, 750, 1800, 3200, 3600, 3200, 3000, 3600, 4100, 1900],
    labels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]
  },
  "7d": {
    current: [28000, 31000, 29500, 32400, 34000, 21000, 19500],
    baseline: [27000, 29000, 28500, 30000, 31000, 22000, 18000],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  "30d": {
    current: [29000, 30500, 32000, 31200],
    baseline: [28000, 29500, 30000, 29800],
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"]
  }
};

const ZONE_SPEEDS = [
  { zone: "Central Core", speed: 18, normal: 30, color: "#ef4444" },
  { zone: "North Res", speed: 38, normal: 45, color: "#f59e0b" },
  { zone: "South Ind", speed: 28, normal: 40, color: "#f59e0b" },
  { zone: "East Tech", speed: 42, normal: 50, color: "#10b981" },
  { zone: "West Market", speed: 35, normal: 42, color: "#f59e0b" },
  { zone: "Airport Cor", speed: 55, normal: 60, color: "#10b981" },
];

const HEATMAP_ZONES = [
  { name: "CBD Core Area", values: [45, 52, 68, 85, 92, 88, 70, 50] },
  { name: "Gandhi Intersection", values: [30, 42, 60, 78, 82, 75, 60, 40] },
  { name: "Stadium Approach", values: [20, 28, 35, 50, 62, 90, 85, 45] },
  { name: "IT Corridor East", values: [40, 65, 80, 85, 78, 60, 45, 30] },
  { name: "Industrial Bypass", values: [25, 30, 48, 55, 62, 58, 40, 25] },
];

const HEATMAP_HOURS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

export default function AnalysisView() {
  const [timeRange, setTimeRange] = useState('6h');
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [activeHeatSquare, setActiveHeatSquare] = useState<{ zoneIdx: number; hourIdx: number } | null>(null);
  const [hoveredLinePoint, setHoveredLinePoint] = useState<number | null>(null);
  
  // Table sorting
  const [sortCol, setSortCol] = useState('congestion');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Dynamic Volume Trend Data
  const volumeData = DATA_VOLUME_LINE[timeRange] || DATA_VOLUME_LINE["6h"];

  // Table Data
  const [tableData, setTableData] = useState<ZoneStatus[]>([
    { zone: "Central Zone", speed: 18, limit: 30, volume: 4100, congestion: 92, incidents: 1, status: "Critical", statusColor: "red" },
    { zone: "South Zone", speed: 28, limit: 40, volume: 3120, congestion: 78, incidents: 3, status: "Heavy", statusColor: "red" },
    { zone: "West Zone", speed: 35, limit: 42, volume: 2670, congestion: 58, incidents: 2, status: "Moderate", statusColor: "amber" },
    { zone: "North Zone", speed: 38, limit: 45, volume: 2340, congestion: 45, incidents: 1, status: "Moderate", statusColor: "amber" },
    { zone: "East Zone", speed: 42, limit: 50, volume: 1850, congestion: 32, incidents: 0, status: "Clear", statusColor: "emerald" },
    { zone: "Airport Corridor", speed: 55, limit: 60, volume: 1200, congestion: 22, incidents: 0, status: "Clear", statusColor: "emerald" },
  ]);

  const handleSort = (col: keyof ZoneStatus) => {
    let dir: 'asc' | 'desc' = 'desc';
    if (sortCol === col && sortDir === 'desc') {
      dir = 'asc';
    }
    setSortCol(col);
    setSortDir(dir);

    const sorted = [...tableData].sort((a, b) => {
      const valA = a[col];
      const valB = b[col];
      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    setTableData(sorted);
  };

  // SVG dimensions for Line Chart
  const lineSvgWidth = 500;
  const lineSvgHeight = 220;
  const padding = 35;

  const getLineCoordinates = (data: number[]) => {
    const maxVal = 6000; // max volume baseline
    return data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (lineSvgWidth - padding * 2);
      const y = lineSvgHeight - padding - (val / maxVal) * (lineSvgHeight - padding * 2);
      return { x, y, value: val };
    });
  };

  const currentCoords = getLineCoordinates(volumeData.current);
  const baselineCoords = getLineCoordinates(volumeData.baseline);

  const currentPath = currentCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const baselinePath = baselineCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  // Heatmap square color helper
  const getHeatmapColor = (val: number) => {
    if (val < 40) return "rgba(16, 185, 129, 0.25)"; // green
    if (val < 75) return "rgba(245, 158, 11, 0.4)";  // orange
    return "rgba(239, 68, 68, 0.55)";                // red
  };

  return (
    <div className="analytics animate-fade-in">
      {/* Header Panel */}
      <div className="analytics__header">
        <div>
          <h2 className="analytics__title" style={{ fontWeight: '700' }}>Traffic intelligence</h2>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>Real-time spatial pattern analysis, volume forecasts, and corridor performance logs.</p>
        </div>

        <div className="date-range-selector">
          {(['1h', '6h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              className={`date-range-selector__btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => {
                setTimeRange(range);
                setHoveredLinePoint(null);
              }}
            >
              {range === '1h' ? 'Last Hour' : range === '6h' ? '6 Hours' : range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Interactive SVG Charts */}
      <div className="analytics__charts">
        {/* Chart 1: Traffic Volume Trend */}
        <div className="chart-card">
          <div className="chart-card__header">
            <span className="chart-card__title">Traffic Volume Trend</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '600' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '3px', background: '#10b981' }}></span> Live Peak
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: '500' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '3px', borderTop: '2px dashed #64748b' }}></span> Baseline
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
              {volumeData.labels.map((lbl, idx) => {
                const x = padding + (idx / (volumeData.labels.length - 1)) * (lineSvgWidth - padding * 2);
                return (
                  <text key={`lbl-x-${idx}`} x={x} y={lineSvgHeight - 12} fill="#94a3b8" fontSize="9" textAnchor="middle">
                    {lbl}
                  </text>
                );
              })}

              {/* Baseline Path */}
              <path d={baselinePath} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Current Live Path */}
              <path d={currentPath} fill="none" stroke="#10b981" strokeWidth="2.5" />

              {/* Interactive Hover Markers */}
              {currentCoords.map((c, idx) => (
                <g key={`interactive-p-${idx}`}>
                  {/* Invisible broad hitbox circle */}
                  <circle
                    cx={c.x} cy={c.y} r={12}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredLinePoint(idx)}
                    onMouseLeave={() => setHoveredLinePoint(null)}
                  />
                  {/* Actual dot */}
                  <circle
                    cx={c.x} cy={c.y} r={hoveredLinePoint === idx ? 6 : 4}
                    fill={hoveredLinePoint === idx ? '#10b981' : '#ffffff'}
                    stroke="#10b981"
                    strokeWidth="2.5"
                    style={{ transition: 'r 0.15s, fill 0.15s' }}
                  />
                </g>
              ))}

              {/* Tooltip line indicator */}
              {hoveredLinePoint !== null && (
                <line
                  x1={currentCoords[hoveredLinePoint].x}
                  y1={padding}
                  x2={currentCoords[hoveredLinePoint].x}
                  y2={lineSvgHeight - padding}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  pointerEvents="none"
                />
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredLinePoint !== null && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: `${Math.min(320, currentCoords[hoveredLinePoint].x + 10)}px`,
                background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
                padding: '8px 12px', color: '#f8fafc', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10
              }}>
                <span style={{ color: '#94a3b8', display: 'block' }}>Time: {volumeData.labels[hoveredLinePoint]}</span>
                <span style={{ color: '#10b981', fontWeight: '700' }}>Live Peak: {volumeData.current[hoveredLinePoint].toLocaleString()} veh/h</span>
                <span style={{ color: '#cbd5e1', display: 'block' }}>Baseline: {volumeData.baseline[hoveredLinePoint].toLocaleString()} veh/h</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Speed Distribution */}
        <div className="chart-card">
          <div className="chart-card__header">
            <span className="chart-card__title">Speed Distribution by Zone</span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Click bars to lock details</span>
          </div>
          <div style={{ padding: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
            <svg width="100%" height={170} viewBox="0 0 500 170">
              {/* Horizontal grid lines */}
              {Array.from({ length: 4 }).map((_, i) => {
                const y = 15 + i * 40;
                return <line key={`bar-grid-${i}`} x1={30} y1={y} x2={480} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
              })}

              {ZONE_SPEEDS.map((z, idx) => {
                const barWidth = 40;
                const gap = 32;
                const x = 50 + idx * (barWidth + gap);
                const heightVal = (z.speed / 70) * 120;
                const normalHeight = (z.normal / 70) * 120;
                const y = 135 - heightVal;
                const ny = 135 - normalHeight;

                return (
                  <g key={`bar-${idx}`} style={{ cursor: 'pointer' }} onClick={() => setActiveBar(activeBar === idx ? null : idx)}>
                    {/* Normal speed baseline marker */}
                    <line x1={x - 4} y1={ny} x2={x + barWidth + 4} y2={ny} stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />

                    {/* Congestion speed bar */}
                    <rect
                      x={x} y={y} width={barWidth} height={heightVal}
                      fill={z.color} rx={4}
                      style={{ transition: 'opacity 0.2s', opacity: activeBar === null || activeBar === idx ? 1 : 0.4 }}
                    />

                    {/* Value text labels */}
                    <text x={x + barWidth / 2} y={y - 6} fill="#334155" fontSize="10" fontWeight="700" textAnchor="middle">
                      {z.speed}
                    </text>

                    {/* Zone name */}
                    <text x={x + barWidth / 2} y={152} fill="#64748b" fontSize="9" fontWeight="600" textAnchor="middle">
                      {z.zone.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
              <line x1={30} y1={135} x2={480} y2={135} stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>

            {/* Selected Bar Details */}
            <div style={{ height: '38px', marginTop: '4px', background: '#f8fafc', borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', border: '1px solid #e2e8f0' }}>
              {activeBar !== null ? (
                <>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>📍 {ZONE_SPEEDS[activeBar].zone} details:</span>
                  <span style={{ color: '#ef4444' }}>Current Speed: {ZONE_SPEEDS[activeBar].speed} km/h</span>
                  <span style={{ color: '#64748b' }}>Normal: {ZONE_SPEEDS[activeBar].normal} km/h (Delay: {ZONE_SPEEDS[activeBar].normal - ZONE_SPEEDS[activeBar].speed} km/h)</span>
                </>
              ) : (
                <span style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', width: '100%' }}>
                  💡 Hover or click any zone bar above to view exact metrics.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Congestion Heatmap */}
      <div className="card chart-card" style={{ marginTop: '24px' }}>
        <div className="chart-card__header">
          <span className="chart-card__title">Congestion Heatmap — Hourly Grid by Area</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Density intensity indicators updated live from sensor counts.</span>
        </div>
        <div style={{ padding: '24px 20px', background: '#ffffff', overflowX: 'auto' }}>
          <div style={{ minWidth: '600px' }}>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <div style={{ width: '150px', flexShrink: 0 }}></div>
              <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between' }}>
                {HEATMAP_HOURS.map((hr) => (
                  <div key={hr} style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                    {hr}
                  </div>
                ))}
              </div>
            </div>

            {HEATMAP_ZONES.map((zone, zIdx) => (
              <div key={zone.name} style={{ display: 'flex', alignItems: 'center', margin: '6px 0' }}>
                <span style={{ width: '150px', fontSize: '12px', fontWeight: '600', color: '#334155', flexShrink: 0 }}>
                  {zone.name}
                </span>
                <div style={{ display: 'flex', flex: 1, gap: '4px' }}>
                  {zone.values.map((val, hIdx) => {
                    const isActive = activeHeatSquare?.zoneIdx === zIdx && activeHeatSquare?.hourIdx === hIdx;
                    return (
                      <div
                        key={`${zIdx}-${hIdx}`}
                        style={{
                          flex: 1,
                          height: '32px',
                          borderRadius: '4px',
                          background: getHeatmapColor(val),
                          cursor: 'pointer',
                          border: isActive ? '2.5px solid #0f172a' : '1px solid rgba(255,255,255,0.1)',
                          transition: 'transform 0.15s, border 0.15s',
                          transform: isActive ? 'scale(1.05)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: val > 75 ? '#b91c1c' : val > 40 ? '#b45309' : '#047857'
                        }}
                        onMouseEnter={() => setActiveHeatSquare({ zoneIdx: zIdx, hourIdx: hIdx })}
                        onMouseLeave={() => setActiveHeatSquare(null)}
                      >
                        {val}%
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Heatmap Tooltip info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '38px' }}>
              {activeHeatSquare !== null ? (
                <>
                  <span style={{ fontSize: '12px', color: '#0f172a' }}>
                    🏢 Area: <strong>{HEATMAP_ZONES[activeHeatSquare.zoneIdx].name}</strong> at <strong>{HEATMAP_HOURS[activeHeatSquare.hourIdx]}</strong>
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: HEATMAP_ZONES[activeHeatSquare.zoneIdx].values[activeHeatSquare.hourIdx] > 75 ? '#ef4444' : '#f59e0b'
                  }}>
                    Congestion Load: {HEATMAP_ZONES[activeHeatSquare.zoneIdx].values[activeHeatSquare.hourIdx]}%
                  </span>
                </>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic', width: '100%', textAlign: 'center' }}>
                  Hover over the squares to view precise hourly grid analytics.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics cards Row */}
      <div className="analytics__summary" style={{ marginTop: '24px' }}>
        <div className="summary-card">
          <div className="summary-card__label">Current Avg Speed</div>
          <div className="summary-card__value">32 <span style={{ fontSize: '12px', color: '#64748b' }}>km/h</span></div>
          <div className="summary-card__change" style={{ color: '#ef4444' }}>−8 km/h from normal</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Total Vehicles (Today)</div>
          <div className="summary-card__value">1.24M</div>
          <div className="summary-card__change" style={{ color: '#10b981' }}>+5.2% vs yesterday</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Active Incidents</div>
          <div className="summary-card__value">7</div>
          <div className="summary-card__change" style={{ color: '#10b981' }}>3 resolved in last hour</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Network Efficiency</div>
          <div className="summary-card__value">78%</div>
          <div className="summary-card__change" style={{ color: '#10b981' }}>+3% from baseline</div>
        </div>
      </div>

      {/* Zone Status Table */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Zone-wise Traffic Corridor Performance</h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Click headers to sort performance.</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr style={{ cursor: 'pointer' }}>
                <th onClick={() => handleSort('zone')}>Zone {sortCol === 'zone' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</th>
                <th onClick={() => handleSort('speed')}>Current Speed {sortCol === 'speed' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</th>
                <th onClick={() => handleSort('volume')}>Volume {sortCol === 'volume' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</th>
                <th onClick={() => handleSort('congestion')}>Congestion Level {sortCol === 'congestion' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</th>
                <th onClick={() => handleSort('incidents')}>Incidents {sortCol === 'incidents' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.zone}>
                  <td><strong>{row.zone}</strong></td>
                  <td>{row.speed} km/h <span style={{ fontSize: '10px', color: '#94a3b8' }}>/ {row.limit} max</span></td>
                  <td>{row.volume.toLocaleString()} veh/hr</td>
                  <td style={{ minWidth: '130px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="mini-progress" style={{ flex: 1, background: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          className="mini-progress-fill"
                          style={{
                            width: `${row.congestion}%`,
                            background: row.statusColor === 'red' ? '#ef4444' : row.statusColor === 'amber' ? '#f59e0b' : '#10b981',
                            height: '100%',
                            borderRadius: '3px'
                          }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{row.congestion}%</span>
                    </div>
                  </td>
                  <td>{row.incidents}</td>
                  <td>
                    <span className={`badge badge--${row.statusColor === 'red' ? 'critical' : row.statusColor === 'amber' ? 'warning' : 'active'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
