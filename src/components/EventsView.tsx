'use client';

import React, { useState, useEffect, useRef } from 'react';

type TrafficEvent = {
  id: string;
  name: string;
  type: string;
  date: string;
  location: string;
  status: string;
  impact: string;
  x: number;
  y: number;
  color: string;
};

// District and Road data from legacy
const DISTRICTS = [
  { name: "Central Business District", x: 450, y: 300, abbr: "CBD" },
  { name: "North Residential", x: 450, y: 100, abbr: "NR" },
  { name: "South Industrial", x: 450, y: 500, abbr: "SI" },
  { name: "East Tech Park", x: 750, y: 300, abbr: "ETP" },
  { name: "West Market", x: 150, y: 300, abbr: "WM" },
  { name: "NE University", x: 700, y: 130, abbr: "UNI" },
  { name: "SW Stadium", x: 200, y: 470, abbr: "STD" },
];

const MAJOR_ROADS_H = [
  { y: 80,  name: "NH-48 Northern Expressway" },
  { y: 180, name: "MG Road" },
  { y: 300, name: "Rajpath Boulevard" },
  { y: 420, name: "Ring Road South" },
  { y: 520, name: "Industrial Corridor" },
];

const MAJOR_ROADS_V = [
  { x: 100, name: "Western Avenue" },
  { x: 250, name: "Gandhi Marg" },
  { x: 450, name: "Central Avenue" },
  { x: 600, name: "Station Road" },
  { x: 750, name: "IT Expressway" },
];

const BARRICADES = [
  { x: 450, y: 180, road: "Central Avenue / MG Road" },
  { x: 450, y: 420, road: "Central Avenue / Ring Road South" },
  { x: 600, y: 420, road: "Station Road / Ring Road South" },
  { x: 250, y: 300, road: "Rajpath West Block" },
];

const DIVERSION_ROUTES = [
  { points: [[100, 420], [250, 420], [250, 520], [450, 520], [600, 520], [750, 520]], name: "Route Alpha — Ring Road" },
  { points: [[450, 180], [600, 180], [750, 180]], name: "Route Beta — Highway 7" },
  { points: [[100, 520], [450, 520], [750, 520]], name: "Route Gamma — Service Road" },
];

export default function EventsView() {
  // Views and Tabs
  const [activeTab, setActiveTab] = useState<'map' | 'library'>('map');

  // Event Data State
  const [events, setEvents] = useState<TrafficEvent[]>([
    { id: "EVT-2024-001", name: "Republic Day Parade", type: "Parade", date: "2024-01-26", location: "Rajpath Boulevard", status: "Completed", impact: "High", x: 450, y: 300, color: "#f97316" },
    { id: "EVT-2024-002", name: "IPL Cricket Match", type: "Sports", date: "2024-03-15", location: "City Stadium", status: "Completed", impact: "Medium", x: 200, y: 470, color: "#3b82f6" },
    { id: "EVT-2024-003", name: "Ganesh Chaturthi", type: "Religious", date: "2024-09-07", location: "Central Avenue", status: "Active", impact: "Critical", x: 450, y: 180, color: "#ef4444" },
    { id: "EVT-2024-004", name: "Marathon 2024", type: "Marathon", date: "2024-11-17", location: "Ring Road", status: "Planned", impact: "High", x: 450, y: 420, color: "#f97316" },
    { id: "EVT-2024-005", name: "Tech Conference", type: "Concert", date: "2024-04-22", location: "Convention Center", status: "Completed", impact: "Low", x: 750, y: 300, color: "#10b981" },
    { id: "EVT-2024-006", name: "Diwali Celebrations", type: "Festival", date: "2024-11-01", location: "Market Square", status: "Planned", impact: "Critical", x: 600, y: 300, color: "#ef4444" },
    { id: "EVT-2024-007", name: "PM Visit", type: "VIP Movement", date: "2024-06-10", location: "Airport Road", status: "Completed", impact: "High", x: 700, y: 130, color: "#f97316" },
    { id: "EVT-2024-008", name: "Road Widening Phase 2", type: "Construction", date: "2024-08-01", location: "Highway 4", status: "Active", impact: "Medium", x: 150, y: 300, color: "#f59e0b" },
  ]);

  // Congestion zones state with dynamic level based on timeline scrubber
  const [congestionZones] = useState([
    { x: 380, y: 240, w: 140, h: 120, baseLevel: 0.9, name: "CBD Core" },
    { x: 200, y: 140, w: 100, h: 80,  baseLevel: 0.6, name: "MG-Gandhi Junction" },
    { x: 500, y: 360, w: 120, h: 90,  baseLevel: 0.85, name: "Stadium Approach" },
    { x: 680, y: 240, w: 110, h: 90,  baseLevel: 0.3, name: "IT Corridor East" },
    { x: 120, y: 440, w: 120, h: 80,  baseLevel: 0.5, name: "Industrial West" },
  ]);

  // Map settings
  const [layers, setLayers] = useState({
    events: true,
    congestion: true,
    flow: true,
    diversions: true,
    barricades: true
  });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Tooltip & details overlays
  const [tooltip, setTooltip] = useState<{ title: string; detail: string; x: number; y: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<TrafficEvent | null>(null);

  // Timeline & Simulation Replay State
  const [timelineHour, setTimelineHour] = useState(6.0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [timelineSpeed, setTimelineSpeed] = useState(1);

  // Form inputs state
  const [formType, setFormType] = useState('concert');
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('18:00');
  const [formDuration, setFormDuration] = useState('4');
  const [formAttendance, setFormAttendance] = useState('25000');
  const [formCategory, setFormCategory] = useState('medium');
  const [formNotes, setFormNotes] = useState('');

  // Forecast state updated on form submission
  const [forecast, setForecast] = useState({
    volume: 3850,
    delay: 24,
    peakWindow: "5:00 PM — 8:30 PM",
    junctions: ["MG Road × Central Rd", "Central Ave × Ring Rd", "Station Road Exit"],
    diversions: ["Route Alpha — via Ring Road South (+8 min)", "Route Beta — via Highway 7 Bypass (+12 min)"]
  });

  // Table sorting & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<keyof TrafficEvent>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  // Notification alert toast
  const [toast, setToast] = useState<{ type: string; title: string; message: string } | null>(null);

  // Timeline playback interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timelinePlaying) {
      interval = setInterval(() => {
        setTimelineHour((prev) => {
          const next = prev + 0.1 * timelineSpeed;
          return next > 22 ? 6.0 : next;
        });
      }, 100);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timelinePlaying, timelineSpeed]);

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newId = `EVT-2024-0${events.length + 1}`;
    const colors: Record<string, string> = { concert: "#8b5cf6", sports: "#3b82f6", political: "#ef4444", religious: "#f59e0b", vip: "#ec4899", construction: "#64748b" };
    const markerColor = colors[formType] || "#10b981";

    const newEvent = {
      id: newId,
      name: formName,
      type: formType.charAt(0).toUpperCase() + formType.slice(1),
      date: formDate || new Date().toISOString().split('T')[0],
      location: formLocation || "Central Sector",
      status: "Planned",
      impact: formCategory.charAt(0).toUpperCase() + formCategory.slice(1),
      x: 200 + Math.random() * 500,
      y: 150 + Math.random() * 300,
      color: markerColor
    };

    setEvents((prev) => [newEvent, ...prev]);

    // Recalculate impact forecast metrics
    const attendanceVal = parseInt(formAttendance, 10) || 10000;
    const predictedVolume = Math.round(attendanceVal * 0.4 + Math.random() * 1500);
    const expectedDelay = formCategory === 'critical' ? 45 : formCategory === 'high' ? 32 : formCategory === 'medium' ? 20 : 8;

    const startHr = parseInt(formTime.split(':')[0], 10) || 17;
    const endHr = Math.min(24, startHr + (parseInt(formDuration, 10) || 3));
    const peakStr = `${startHr > 12 ? startHr - 12 : startHr}:00 ${startHr >= 12 ? 'PM' : 'AM'} — ${endHr > 12 ? endHr - 12 : endHr}:00 ${endHr >= 12 ? 'PM' : 'AM'}`;

    setForecast({
      volume: predictedVolume,
      delay: expectedDelay,
      peakWindow: peakStr,
      junctions: [`${newEvent.location} Main Crossroad`, "Central Ave × Gandhi Junction", "Western Sector Highway Loop"].slice(0, 2 + Math.floor(Math.random() * 2)),
      diversions: [`Route Alpha — via Ring Road South (+${expectedDelay - 5} min)`, `Route Beta — via Bypass Lane (+${expectedDelay + 6} min)`]
    });

    setToast({
      type: 'success',
      title: 'Event Registered Successfully',
      message: `"${formName}" has been logged and impact simulation mapped.`
    });

    // Clear inputs
    setFormName('');
    setFormLocation('');
    setFormDate('');
    setFormNotes('');
  };

  // Map panning dragging logic
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.95 : 1.05;
    setZoom((prev) => Math.max(0.5, Math.min(4, prev * scaleFactor)));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(4, prev + 0.15));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, prev - 0.15));
  const handleResetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calculate dynamic congestion levels based on timeline scrubber peak factor
  const getCongestionColor = (baseLevel: number) => {
    const peakFactor = Math.sin(((timelineHour - 6) / 16) * Math.PI);
    const intensity = Math.min(1, Math.max(0, baseLevel * peakFactor));
    if (intensity < 0.35) return "#10b981"; // green
    if (intensity < 0.70) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  // Table Filter & Sorting
  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const valA = a[sortCol];
    const valB = b[sortCol];
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const pageEvents = sortedEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

  const handleSort = (col: keyof TrafficEvent) => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const formatHourString = (hr: number) => {
    const hours = Math.floor(hr);
    const mins = Math.round((hr - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const getHexPoints = (x: number, y: number, w: number, h: number) => {
    const cx = x + w / 2;
    return [
      [cx, y],
      [x + w, y + h * 0.25],
      [x + w, y + h * 0.75],
      [cx, y + h],
      [x, y + h * 0.75],
      [x, y + h * 0.25],
    ].map(([px, py]) => `${px},${py}`).join(' ');
  };

  return (
    <div className="workspace animate-fade-in">
      {/* Toast notification overlay */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 10005,
          background: '#1e293b', border: '1px solid #334155', borderLeft: `4px solid ${toast.type === 'success' ? '#10b981' : '#f59e0b'}`,
          borderRadius: '8px', padding: '16px 20px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', minWidth: '320px',
          display: 'flex', gap: '12px', alignItems: 'start', color: '#f8fafc',
          animation: 'fadeInUp 0.3s ease'
        }}>
          <span style={{ fontSize: '18px' }}>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '13px', color: '#f1f5f9' }}>{toast.title}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
        </div>
      )}

      {/* 1. Left Panel: Event Form Setup */}
      <div className="workspace__left">
        <div className="workspace__left-header">
          <h2 className="workspace__left-title">Event Registration</h2>
          <p className="workspace__left-subtitle">Register public event files to trigger immediate AI traffic diversion plans.</p>
        </div>

        <form className="event-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label form-label--required">Event Type</label>
            <select className="form-select" value={formType} onChange={(e) => setFormType(e.target.value)} required>
              <option value="concert">Concert</option>
              <option value="sports">Sports Match</option>
              <option value="political">Political Rally</option>
              <option value="religious">Religious Procession</option>
              <option value="parade">Parade / Carnival</option>
              <option value="marathon">Marathon / Race</option>
              <option value="festival">Festival</option>
              <option value="vip">VIP Movement</option>
              <option value="construction">Road Work / Construction</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label form-label--required">Event Name</label>
            <input
              type="text"
              className="form-input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Annual City Marathon"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label--required">Primary Location</label>
            <input
              type="text"
              className="form-input"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. Ring Road East"
              required
            />
          </div>

          <div className="form-date-range form-group">
            <div style={{ flex: 1 }}>
              <label className="form-label form-label--required">Date</label>
              <input type="date" className="form-input" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label form-label--required">Start Time</label>
              <input type="time" className="form-input" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
            </div>
          </div>

          <div className="form-date-range form-group">
            <div style={{ flex: 1 }}>
              <label className="form-label form-label--required">Duration (hrs)</label>
              <input type="number" className="form-input" min="1" max="24" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label form-label--required">Expected Crowds</label>
              <input type="number" className="form-input" min="100" value={formAttendance} onChange={(e) => setFormAttendance(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Impact Priority</label>
            <select className="form-select" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
              <option value="low">Low Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="high">High Impact</option>
              <option value="critical">Critical (Red Alert)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Constraints</label>
            <textarea
              className="form-textarea"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Add details, specific lanes blockages, or VVIP arrival routes..."
              rows={2}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn--primary" style={{ flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Run Impact Simulation
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ flex: 1 }}
              onClick={() => {
                setFormName('');
                setFormLocation('');
                setFormDate('');
                setFormNotes('');
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* 2. Center Panel: Map view or Library tabs */}
      <div className="workspace__center" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#0f172a', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn--sm ${activeTab === 'map' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setActiveTab('map')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🌐 Interactive City Map
            </button>
            <button
              className={`btn btn--sm ${activeTab === 'library' ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setActiveTab('library')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📚 Event Library ({events.length})
            </button>
          </div>

          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>
            Zone Status: <span style={{ color: '#10b981', fontWeight: '700' }}>Active Monitoring</span>
          </div>
        </div>

        {/* Tab 1: City Map */}
        {activeTab === 'map' && (
          <div className="map-container" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {/* Custom SVG Toolbar */}
            <div className="map-controls">
              <button className="map-controls__btn" onClick={handleZoomIn} title="Zoom In">+</button>
              <button className="map-controls__btn" onClick={handleZoomOut} title="Zoom Out">−</button>
              <button className="map-controls__btn" onClick={handleResetMap} title="Reset View" style={{ fontSize: '13px' }}>⟲</button>
            </div>

            {/* Custom Tooltip */}
            {tooltip && (
              <div style={{
                position: 'fixed', left: `${tooltip.x + 15}px`, top: `${tooltip.y + 15}px`,
                background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
                padding: '8px 12px', color: '#f8fafc', fontSize: '11px', zIndex: 10000,
                pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                <strong style={{ color: '#38bdf8', display: 'block' }}>{tooltip.title}</strong>
                <span style={{ color: '#cbd5e1' }}>{tooltip.detail}</span>
              </div>
            )}

            {/* SVG Workspace */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 900 600"
              style={{ background: '#0f172a', cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Glow Filter */}
              <defs>
                <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <marker id="flowArrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" opacity="0.8" />
                </marker>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Grid lines */}
                {Array.from({ length: 13 }, (_, i) => i * 70).map((x) => (
                  <line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={600} stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
                ))}
                {Array.from({ length: 9 }, (_, i) => i * 70).map((y) => (
                  <line key={`gy-${y}`} x1={0} y1={y} x2={900} y2={y} stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />
                ))}

                {/* 2. Major Horizontal Roads */}
                {MAJOR_ROADS_H.map((r, i) => (
                  <line
                    key={`road-h-${i}`}
                    x1={0} y1={r.y} x2={900} y2={r.y}
                    stroke="#334155"
                    strokeWidth="3.5"
                    style={{ transition: 'stroke 0.2s', cursor: 'help' }}
                    onMouseEnter={(e) => setTooltip({ title: r.name, detail: "Major Arterial Road", x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}

                {/* 3. Major Vertical Roads */}
                {MAJOR_ROADS_V.map((r, i) => (
                  <line
                    key={`road-v-${i}`}
                    x1={r.x} y1={0} x2={r.x} y2={600}
                    stroke="#334155"
                    strokeWidth="3.5"
                    style={{ transition: 'stroke 0.2s', cursor: 'help' }}
                    onMouseEnter={(e) => setTooltip({ title: r.name, detail: "Major Crossroad Channel", x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}

                {/* 4. Outer Ring Road Ellipse */}
                <ellipse
                  cx={450} cy={300} rx={320} ry={220}
                  fill="none" stroke="#475569" strokeWidth="3.5" strokeDasharray="8 6"
                  onMouseEnter={(e) => setTooltip({ title: "Outer Ring Expressway", detail: "Multi-lane Bypass Circle", x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: 'help' }}
                />

                {/* 5. Intersections */}
                {MAJOR_ROADS_V.map((v) =>
                  MAJOR_ROADS_H.map((h, i) => (
                    <circle key={`intersect-${v.x}-${h.y}-${i}`} cx={v.x} cy={h.y} r={5} fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  ))
                )}

                {/* 6. District Labels */}
                {DISTRICTS.map((d, i) => (
                  <g key={`dist-${i}`} opacity="0.65">
                    <rect x={d.x - 65} y={d.y - 12} width={130} height={24} rx={12} fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <text
                      x={d.x} y={d.y + 4}
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                      fontFamily="system-ui, sans-serif"
                    >
                      {d.name.toUpperCase()}
                    </text>
                  </g>
                ))}

                {/* 7. Congestion Zones Layer */}
                {layers.congestion && congestionZones.map((z, i) => {
                  const color = getCongestionColor(z.baseLevel);
                  const cx = z.x + z.w / 2;
                  const cy = z.y + z.h / 2;
                  return (
                    <g
                      key={`zone-${i}`}
                      style={{ cursor: 'help', transition: 'fill 0.4s, stroke 0.4s' }}
                      onMouseEnter={(e) => setTooltip({ title: `${z.name} Congestion`, detail: `Peak Load Capacity Status`, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <ellipse
                        cx={cx}
                        cy={cy}
                        rx={z.w * 0.58}
                        ry={z.h * 0.52}
                        fill={color}
                        opacity="0.08"
                      />
                      <polygon
                        points={getHexPoints(z.x, z.y, z.w, z.h)}
                        fill={color}
                        fillOpacity="0.16"
                        stroke={color}
                        strokeWidth="1.75"
                        strokeDasharray="5 3"
                      />
                      <polygon
                        points={getHexPoints(z.x + z.w * 0.16, z.y + z.h * 0.16, z.w * 0.68, z.h * 0.68)}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="1"
                        strokeOpacity="0.45"
                      />
                      <circle cx={cx} cy={cy} r={Math.min(z.w, z.h) * 0.16} fill={color} opacity="0.12" />
                    </g>
                  );
                })}

                {/* 8. Traffic Flow Arrows Layer */}
                {layers.flow && MAJOR_ROADS_H.map((r, i) => {
                  if (i % 2 === 0) {
                    return (
                      <line
                        key={`flow-h-${i}`}
                        x1={60} y1={r.y - 5} x2={840} y2={r.y - 5}
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="8 16"
                        opacity="0.5"
                        markerEnd="url(#flowArrow)"
                      >
                        <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2s" repeatCount="indefinite" />
                      </line>
                    );
                  }
                  return null;
                })}
                {layers.flow && MAJOR_ROADS_V.map((r, i) => {
                  if (i % 2 === 1) {
                    return (
                      <line
                        key={`flow-v-${i}`}
                        x1={r.x + 5} y1={60} x2={r.x + 5} y2={540}
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="8 16"
                        opacity="0.5"
                        markerEnd="url(#flowArrow)"
                      >
                        <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2s" repeatCount="indefinite" />
                      </line>
                    );
                  }
                  return null;
                })}

                {/* 9. Diversions Layer */}
                {layers.diversions && DIVERSION_ROUTES.map((route, idx) => {
                  const pointsStr = route.points.map((p) => `${p[0]} ${p[1]}`).join(" L ");
                  return (
                    <path
                      key={`divert-${idx}`}
                      d={`M ${pointsStr}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray="10 6"
                      filter="url(#mapGlow)"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => setTooltip({ title: route.name, detail: "Diversion Active (Green Corridor)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="1.5s" repeatCount="indefinite" />
                    </path>
                  );
                })}

                {/* 10. Barricades Layer */}
                {layers.barricades && BARRICADES.map((b, idx) => (
                  <g
                    key={`barricade-${idx}`}
                    style={{ cursor: 'help' }}
                    onMouseEnter={(e) => setTooltip({ title: "Road Closure Point", detail: b.road, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <circle cx={b.x} cy={b.y} r={9} fill="#ef4444" fillOpacity="0.2" />
                    <line x1={b.x - 5} y1={b.y - 5} x2={b.x + 5} y2={b.y + 5} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1={b.x + 5} y1={b.y - 5} x2={b.x - 5} y2={b.y + 5} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                ))}

                {/* 11. Event Markers (Pulsing Circles) */}
                {layers.events && events.map((m, idx) => (
                  <g
                    key={`marker-${idx}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedMarker(m)}
                    onMouseEnter={(e) => setTooltip({ title: m.name, detail: `Type: ${m.type} | Impact: ${m.impact}`, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Pulsing ring */}
                    <circle cx={m.x} cy={m.y} r={8} fill="none" stroke={m.color} strokeWidth="1.5" opacity="0.8">
                      <animate attributeName="r" from="8" to="24" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Core dot */}
                    <circle cx={m.x} cy={m.y} r={6} fill={m.color} stroke="#ffffff" strokeWidth="1.5" filter="url(#mapGlow)" />
                  </g>
                ))}
              </g>
            </svg>

            {/* Click Event Popup overlay */}
            {selectedMarker && (
              <div style={{
                position: 'absolute', top: '24px', left: '240px',
                background: '#1e293b', border: `2px solid ${selectedMarker.color}`, borderRadius: '12px',
                padding: '16px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 1000,
                width: '260px', fontFamily: 'system-ui, sans-serif', color: '#f8fafc'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: selectedMarker.color }}>{selectedMarker.name}</h4>
                  <button onClick={() => setSelectedMarker(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px', padding: 0 }}>&times;</button>
                </div>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#94a3b8' }}>ID: <strong style={{ color: '#cbd5e1' }}>{selectedMarker.id}</strong></p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#94a3b8' }}>Type: <strong style={{ color: '#cbd5e1' }}>{selectedMarker.type}</strong></p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#94a3b8' }}>Location: <strong style={{ color: '#cbd5e1' }}>{selectedMarker.location}</strong></p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#94a3b8' }}>Impact: <strong style={{ color: selectedMarker.impact === 'Critical' ? '#ef4444' : selectedMarker.impact === 'High' ? '#f59e0b' : '#38bdf8' }}>{selectedMarker.impact}</strong></p>
                <button
                  className="btn btn--primary"
                  style={{ width: '100%', marginTop: '12px', padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => {
                    setSelectedMarker(null);
                    setToast({ type: 'info', title: 'Route Details', message: `Routing options for "${selectedMarker.name}" opened in workspace.` });
                  }}
                >
                  Confirm Traffic Plan
                </button>
              </div>
            )}

            {/* Layer Checkbox Panel */}
            <div className="map-layers" style={{ top: '80px', left: '16px' }}>
              <h4 className="map-layers__title">Map Filters</h4>
              <div className="map-layers__item">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={layers.events} onChange={(e) => setLayers({ ...layers, events: e.target.checked })} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                  Event Locations
                </label>
              </div>
              <div className="map-layers__item">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={layers.congestion} onChange={(e) => setLayers({ ...layers, congestion: e.target.checked })} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                  Congestion Zones
                </label>
              </div>
              <div className="map-layers__item">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={layers.flow} onChange={(e) => setLayers({ ...layers, flow: e.target.checked })} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
                  Traffic Flow Rate
                </label>
              </div>
              <div className="map-layers__item">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={layers.diversions} onChange={(e) => setLayers({ ...layers, diversions: e.target.checked })} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  Diversion Channels
                </label>
              </div>
              <div className="map-layers__item">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={layers.barricades} onChange={(e) => setLayers({ ...layers, barricades: e.target.checked })} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748b', display: 'inline-block' }}></span>
                  Police Barricades
                </label>
              </div>
            </div>

            {/* Legend Panel */}
            <div className="map-legend">
              <h4 className="map-legend__title">Map Legend</h4>
              <div className="map-legend__item">
                <span className="map-legend__color" style={{ background: '#10b981' }}></span>
                <span className="map-legend__label">Clear Speed (&gt;45km/h)</span>
              </div>
              <div className="map-legend__item">
                <span className="map-legend__color" style={{ background: '#f59e0b' }}></span>
                <span className="map-legend__label">Moderate Delay (20-40km/h)</span>
              </div>
              <div className="map-legend__item">
                <span className="map-legend__color" style={{ background: '#ef4444' }}></span>
                <span className="map-legend__label">Severe Jam (&lt;15km/h)</span>
              </div>
              <div className="map-legend__item">
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #a855f7', background: '#e9d5ff', marginRight: '8px' }}></span>
                <span className="map-legend__label">Major Event Area</span>
              </div>
            </div>

            {/* Simulation Timeline Scrubber Bar */}
            <div style={{
              position: 'absolute', bottom: '16px', right: '16px', left: '220px',
              background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
              padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '14px', zIndex: 100
            }}>
              <button
                className="btn btn--sm"
                onClick={() => setTimelinePlaying(!timelinePlaying)}
                style={{
                  minWidth: '70px', padding: '4px 10px', fontSize: '11px',
                  background: timelinePlaying ? '#f59e0b' : '#10b981', color: '#0f172a', fontWeight: '700'
                }}
              >
                {timelinePlaying ? '⏸ PAUSE' : '▶ PLAY'}
              </button>
              <select
                className="form-select"
                value={timelineSpeed}
                onChange={(e) => setTimelineSpeed(parseInt(e.target.value, 10))}
                style={{ width: '85px', padding: '3px 8px', fontSize: '11px', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }}
              >
                <option value="1">1× Speed</option>
                <option value="2">2× Speed</option>
                <option value="4">4× Speed</option>
              </select>

              <span style={{ color: '#94a3b8', fontSize: '11px', flexShrink: 0 }}>Timeline:</span>
              <input
                type="range"
                min="6.0"
                max="22.0"
                step="0.1"
                value={timelineHour}
                onChange={(e) => setTimelineHour(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#38bdf8', height: '6px', borderRadius: '3px', cursor: 'pointer' }}
              />
              <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: '700', fontFamily: 'monospace', minWidth: '40px' }}>
                {formatHourString(timelineHour)}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Historical Event Library */}
        {activeTab === 'library' && (
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search historical events by title, type, status..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ maxWidth: '360px', background: '#ffffff', borderColor: '#cbd5e1' }}
              />
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                {filteredEvents.length} record{filteredEvents.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="table-container" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                      ID {sortCol === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                      Event Title {sortCol === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('type')} style={{ cursor: 'pointer', padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                      Category {sortCol === 'type' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                      Scheduled Date {sortCol === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('location')} style={{ cursor: 'pointer', padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                      Corridor {sortCol === 'location' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                      Status {sortCol === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                    <th onClick={() => handleSort('impact')} style={{ cursor: 'pointer', padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                      Traffic Impact {sortCol === 'impact' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageEvents.map((e) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>{e.id}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{e.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#475569' }}>{e.type}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#475569' }}>{e.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#475569' }}>{e.location}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge--${e.status === 'Active' ? 'active' : e.status === 'Planned' ? 'info' : 'inactive'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge--${e.impact === 'Critical' ? 'critical' : e.impact === 'High' ? 'warning' : 'info'}`}>
                          {e.impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pageEvents.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No records match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Page {currentPage} of {totalPages}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn--sm btn--ghost"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    &larr; Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(p)}
                      className={`btn btn--sm`}
                      style={{
                        padding: '4px 10px', minWidth: '32px',
                        background: p === currentPage ? '#0f172a' : 'transparent',
                        color: p === currentPage ? '#ffffff' : '#475569',
                        border: p === currentPage ? '1px solid #0f172a' : '1px solid #cbd5e1'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="btn btn--sm btn--ghost"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Right Panel: Impact Forecast */}
      <div className="workspace__right">
        <div className="workspace__right-header">
          <h2 className="workspace__right-title">AI Impact Forecast</h2>
          <span className="badge badge--warning" style={{ fontSize: '10px' }}>Active Simulation</span>
        </div>

        <div className="forecast-card">
          <div className="forecast-card__header">
            <span className="forecast-card__title">Predicted Peak Volume</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </div>
          <div className="forecast-card__value">{forecast.volume.toLocaleString()} <span style={{ fontSize: '11px', color: '#64748b' }}>veh/hr</span></div>
          <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ background: '#f59e0b', height: '100%', width: `${Math.min(100, (forecast.volume / 6000) * 100)}%`, borderRadius: '4px', transition: 'width 0.4s' }}></div>
          </div>
          <p className="forecast-card__description">Estimated at {Math.round((forecast.volume / 5000) * 100)}% of typical sector capacity limits.</p>
        </div>

        <div className="forecast-card">
          <div className="forecast-card__header">
            <span className="forecast-card__title">Average Commute Delay</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="forecast-card__value" style={{ color: forecast.delay > 30 ? '#ef4444' : '#f59e0b' }}>
            {forecast.delay} <span style={{ fontSize: '11px', color: '#64748b' }}>mins avg</span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ background: forecast.delay > 30 ? '#ef4444' : '#f59e0b', height: '100%', width: `${Math.min(100, (forecast.delay / 60) * 100)}%`, borderRadius: '4px', transition: 'width 0.4s' }}></div>
          </div>
          <p className="forecast-card__description">Severe backlog likely around main event access junctions.</p>
        </div>

        <div className="forecast-card">
          <div className="forecast-card__header">
            <span className="forecast-card__title">Peak Congestion window</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{forecast.peakWindow}</div>
          <p className="forecast-card__description">Traffic flows will experience heavy congestion during this window.</p>
        </div>

        <div className="forecast-card">
          <div className="forecast-card__header" style={{ marginBottom: '8px' }}>
            <span className="forecast-card__title">High-Risk Junctions</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {forecast.junctions.map((j, idx) => (
              <li key={`junc-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                {j}
              </li>
            ))}
          </ul>
        </div>

        <div className="forecast-card">
          <div className="forecast-card__header" style={{ marginBottom: '8px' }}>
            <span className="forecast-card__title">Diversion Routes</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {forecast.diversions.map((d, idx) => (
              <li key={`div-${idx}`} style={{ display: 'flex', alignItems: 'start', gap: '8px', fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                <span className="badge badge--active" style={{ fontSize: '8px', padding: '2px 4px', background: '#e6f4ea', color: '#137333', flexShrink: 0, marginTop: '2px' }}>ROUTED</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
