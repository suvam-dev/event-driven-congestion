/* ================================================================
   UrbanFlow Traffic Management Dashboard — app.js
   Pure vanilla ES6+ • No external dependencies
   ================================================================ */

"use strict";

/* ----------------------------------------------------------------
   0. GLOBAL STATE
   ---------------------------------------------------------------- */
const STATE = {
  currentView: "view-dashboard",
  darkMode: localStorage.getItem("urbanflow-dark") === "true",
  notifications: [],
  unreadCount: 0,
  mapZoom: 1,
  mapPan: { x: 0, y: 0 },
  mapDragging: false,
  mapDragStart: { x: 0, y: 0 },
  mapLayers: { events: true, congestion: true, flow: true, diversions: true, barricades: true },
  timelineSpeed: 1,
  timelinePlaying: false,
  timelineHour: 6,
  timelineInterval: null,
  filterOpen: false,
  eventsPage: 1,
  eventsPerPage: 5,
  eventsSort: { col: "date", dir: "desc" },
  eventsSearch: "",
};

/* ----------------------------------------------------------------
   1. NAVIGATION & VIEW SWITCHING
   ---------------------------------------------------------------- */
function initNavigation() {
  const navLinks = document.querySelectorAll("[data-view]");
  const views = document.querySelectorAll(".view-section, [id^='view-']");

  function switchView(targetId, pushState = true) {
    views.forEach((v) => {
      v.style.opacity = "0";
      setTimeout(() => {
        v.style.display = "none";
      }, 250);
    });

    setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = "";
        requestAnimationFrame(() => {
          target.style.opacity = "1";
        });
      }
      STATE.currentView = targetId;

      navLinks.forEach((l) => l.classList.remove("active"));
      navLinks.forEach((l) => {
        if (l.getAttribute("data-view") === targetId) l.classList.add("active");
      });

      if (pushState) history.pushState({ view: targetId }, "", `#${targetId}`);

      // Lazy-init charts when analytics is shown
      if (targetId === "view-analysis") initCharts();
    }, 260);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-view");
      if (target) switchView(target);
    });
  });

  // Add CSS transition to views
  views.forEach((v) => {
    v.style.transition = "opacity 0.25s ease";
    if (v.id !== STATE.currentView) {
      v.style.display = "none";
      v.style.opacity = "0";
    } else {
      v.style.opacity = "1";
    }
  });

  // Handle hash on load
  if (location.hash) {
    const id = location.hash.slice(1);
    if (document.getElementById(id)) switchView(id, false);
  }

  // Handle browser back/forward
  window.addEventListener("popstate", (e) => {
    const id = (e.state && e.state.view) || location.hash.slice(1) || "view-dashboard";
    if (document.getElementById(id)) switchView(id, false);
  });
}

/* ----------------------------------------------------------------
   2. ANIMATED KPI COUNTERS
   ---------------------------------------------------------------- */
function animateCounter(element, target, duration = 2000, prefix = "", suffix = "") {
  if (!element) return;
  const start = performance.now();
  const isFloat = target % 1 !== 0;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out quad
    const ease = 1 - (1 - progress) * (1 - progress);
    const current = ease * target;
    const formatted = isFloat
      ? current.toFixed(1)
      : Math.floor(current).toLocaleString("en-IN");
    element.textContent = `${prefix}${formatted}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animateMetrics() {
  const metrics = [
    { selector: "#kpi-active-events", value: 12 },
    { selector: "#kpi-congestion-zones", value: 47 },
    { selector: "#kpi-personnel", value: 284 },
    { selector: "#kpi-diversions", value: 18 },
    { selector: "#kpi-delay-reduction", value: 34, suffix: "%" },
  ];

  // Fallback: also try data-kpi attribute
  const kpiCards = document.querySelectorAll("[data-kpi]");
  kpiCards.forEach((card) => {
    const key = card.getAttribute("data-kpi");
    const m = metrics.find((x) => x.selector.includes(key));
    if (m) {
      const el = card.querySelector(".kpi-value, .metric-value, h2, h3, .count") || card;
      observeAndAnimate(el, m.value, 2000, m.prefix || "", m.suffix || "");
    }
  });

  metrics.forEach((m) => {
    const el = document.querySelector(m.selector);
    if (el) observeAndAnimate(el, m.value, 2000, m.prefix || "", m.suffix || "");
  });
}

function observeAndAnimate(el, value, duration, prefix, suffix) {
  if (!("IntersectionObserver" in window)) {
    animateCounter(el, value, duration, prefix, suffix);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(el, value, duration, prefix, suffix);
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );
  io.observe(el);
}

/* ----------------------------------------------------------------
   3. INTERACTIVE SVG CITY MAP
   ---------------------------------------------------------------- */
const MAP_W = 900;
const MAP_H = 600;

const DISTRICTS = [
  { name: "Central Business District", x: 400, y: 260, abbr: "CBD" },
  { name: "North Residential", x: 400, y: 80, abbr: "NR" },
  { name: "South Industrial", x: 400, y: 480, abbr: "SI" },
  { name: "East Tech Park", x: 720, y: 260, abbr: "ETP" },
  { name: "West Market", x: 120, y: 260, abbr: "WM" },
  { name: "NE University", x: 660, y: 110, abbr: "UNI" },
  { name: "SW Stadium", x: 160, y: 430, abbr: "STD" },
];

const MAJOR_ROADS_H = [
  { y: 80,  name: "NH-48 Northern Expressway" },
  { y: 180, name: "MG Road" },
  { y: 280, name: "Rajpath Boulevard" },
  { y: 380, name: "Ring Road South" },
  { y: 480, name: "Industrial Corridor" },
  { y: 550, name: "Airport Road" },
];

const MAJOR_ROADS_V = [
  { x: 100, name: "Western Avenue" },
  { x: 230, name: "Gandhi Marg" },
  { x: 370, name: "Central Avenue" },
  { x: 510, name: "Station Road" },
  { x: 650, name: "IT Expressway" },
  { x: 800, name: "Eastern Bypass" },
];

const EVENT_MARKERS = [
  { x: 370, y: 280, label: "Ganesh Chaturthi Procession", type: "Religious", color: "#f59e0b", impact: "Critical" },
  { x: 510, y: 380, label: "IPL Match — City Stadium", type: "Sports", color: "#3b82f6", impact: "High" },
  { x: 230, y: 180, label: "Political Rally", type: "Political Rally", color: "#ef4444", impact: "High" },
  { x: 650, y: 280, label: "Tech Conference", type: "Concert", color: "#8b5cf6", impact: "Low" },
  { x: 160, y: 480, label: "Road Widening Phase 2", type: "Construction", color: "#64748b", impact: "Medium" },
];

const CONGESTION_ZONES = [
  { x: 310, y: 230, w: 130, h: 100, level: "heavy",    name: "CBD Core" },
  { x: 180, y: 150, w: 100, h: 70,  level: "moderate", name: "MG-Gandhi Junction" },
  { x: 460, y: 340, w: 110, h: 80,  level: "heavy",    name: "Stadium Approach" },
  { x: 600, y: 240, w: 100, h: 80,  level: "clear",    name: "IT Corridor East" },
  { x: 100, y: 440, w: 120, h: 80,  level: "moderate", name: "Industrial West" },
];

const DIVERSION_ROUTES = [
  { points: [[100, 380], [230, 380], [230, 480], [370, 480], [510, 480], [650, 480], [800, 480]], name: "Route Alpha — Ring Road" },
  { points: [[370, 180], [510, 180], [650, 180], [800, 180]], name: "Route Beta — Highway 7" },
  { points: [[100, 550], [370, 550], [650, 550]], name: "Route Gamma — Service Road" },
];

const BARRICADES = [
  { x: 370, y: 230, road: "Central Avenue / MG Road" },
  { x: 370, y: 330, road: "Central Avenue / Ring Road South" },
  { x: 460, y: 380, road: "Station Road / Ring Road South" },
  { x: 300, y: 280, road: "Rajpath West Block" },
];

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function createCityMap() {
  const container = document.getElementById("city-map");
  if (!container) return;
  container.innerHTML = "";

  const svg = svgEl("svg", {
    viewBox: `0 0 ${MAP_W} ${MAP_H}`,
    width: "100%",
    height: "100%",
    id: "map-svg",
    style: "background:#0f172a;border-radius:12px;cursor:grab;user-select:none",
  });

  // Defs: glow filter, pulse animation
  const defs = svgEl("defs");

  // Glow filter
  const filter = svgEl("filter", { id: "glow", x: "-50%", y: "-50%", width: "200%", height: "200%" });
  const blur = svgEl("feGaussianBlur", { stdDeviation: "3", result: "blur" });
  const merge = svgEl("feMerge");
  const mn1 = svgEl("feMergeNode", { in: "blur" });
  const mn2 = svgEl("feMergeNode", { in: "SourceGraphic" });
  merge.append(mn1, mn2);
  filter.append(blur, merge);
  defs.append(filter);

  // Arrow marker for flow
  const marker = svgEl("marker", {
    id: "flow-arrow",
    viewBox: "0 0 10 10",
    refX: "10",
    refY: "5",
    markerWidth: "6",
    markerHeight: "6",
    orient: "auto",
  });
  const arrowPath = svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#38bdf8", opacity: "0.7" });
  marker.append(arrowPath);
  defs.append(marker);
  svg.append(defs);

  // Master group for pan/zoom
  const world = svgEl("g", { id: "map-world" });

  // --- Layers ---
  const layerGrid = svgEl("g", { id: "layer-grid" });
  const layerCongestion = svgEl("g", { id: "layer-congestion", class: "map-layer" });
  const layerFlow = svgEl("g", { id: "layer-flow", class: "map-layer" });
  const layerDiversions = svgEl("g", { id: "layer-diversions", class: "map-layer" });
  const layerBarricades = svgEl("g", { id: "layer-barricades", class: "map-layer" });
  const layerEvents = svgEl("g", { id: "layer-events", class: "map-layer" });

  // --- Minor grid roads ---
  for (let x = 50; x <= MAP_W; x += 70) {
    layerGrid.append(svgEl("line", { x1: x, y1: 0, x2: x, y2: MAP_H, stroke: "#334155", "stroke-width": "0.5", opacity: "0.3" }));
  }
  for (let y = 50; y <= MAP_H; y += 70) {
    layerGrid.append(svgEl("line", { x1: 0, y1: y, x2: MAP_W, y2: y, stroke: "#334155", "stroke-width": "0.5", opacity: "0.3" }));
  }

  // --- Major horizontal roads ---
  MAJOR_ROADS_H.forEach((r) => {
    const line = svgEl("line", {
      x1: 0, y1: r.y, x2: MAP_W, y2: r.y,
      stroke: "#475569", "stroke-width": "3", class: "road-major",
    });
    line.addEventListener("mouseenter", (e) => showMapTooltip(e, r.name, trafficLevel()));
    line.addEventListener("mouseleave", hideMapTooltip);
    line.addEventListener("mouseenter", () => { line.setAttribute("stroke", "#94a3b8"); line.setAttribute("stroke-width", "5"); });
    line.addEventListener("mouseleave", () => { line.setAttribute("stroke", "#475569"); line.setAttribute("stroke-width", "3"); });
    layerGrid.append(line);
  });

  // --- Major vertical roads ---
  MAJOR_ROADS_V.forEach((r) => {
    const line = svgEl("line", {
      x1: r.x, y1: 0, x2: r.x, y2: MAP_H,
      stroke: "#475569", "stroke-width": "3", class: "road-major",
    });
    line.addEventListener("mouseenter", (e) => showMapTooltip(e, r.name, trafficLevel()));
    line.addEventListener("mouseleave", hideMapTooltip);
    line.addEventListener("mouseenter", () => { line.setAttribute("stroke", "#94a3b8"); line.setAttribute("stroke-width", "5"); });
    line.addEventListener("mouseleave", () => { line.setAttribute("stroke", "#475569"); line.setAttribute("stroke-width", "3"); });
    layerGrid.append(line);
  });

  // --- Ring Road (ellipse) ---
  const ring = svgEl("ellipse", {
    cx: MAP_W / 2, cy: MAP_H / 2, rx: 320, ry: 220,
    fill: "none", stroke: "#475569", "stroke-width": "3", "stroke-dasharray": "12 4", class: "road-major",
  });
  ring.addEventListener("mouseenter", (e) => showMapTooltip(e, "Outer Ring Road", trafficLevel()));
  ring.addEventListener("mouseleave", hideMapTooltip);
  layerGrid.append(ring);

  // --- Intersections ---
  MAJOR_ROADS_V.forEach((v) => {
    MAJOR_ROADS_H.forEach((h) => {
      layerGrid.append(svgEl("circle", { cx: v.x, cy: h.y, r: 4, fill: "#334155", stroke: "#475569", "stroke-width": "1" }));
    });
  });

  // --- District Labels ---
  DISTRICTS.forEach((d) => {
    const txt = svgEl("text", {
      x: d.x, y: d.y, fill: "#64748b", "font-size": "11", "text-anchor": "middle", "font-family": "Inter,system-ui,sans-serif", opacity: "0.7",
    });
    txt.textContent = d.name;
    layerGrid.append(txt);
  });

  // --- Congestion Zones ---
  CONGESTION_ZONES.forEach((z) => {
    const color = z.level === "heavy" ? "#ef4444" : z.level === "moderate" ? "#f59e0b" : "#10b981";
    const rect = svgEl("rect", {
      x: z.x, y: z.y, width: z.w, height: z.h, rx: 6,
      fill: color, opacity: "0.18", stroke: color, "stroke-width": "1", "stroke-opacity": "0.4", class: "congestion-zone",
    });
    rect.addEventListener("mouseenter", (e) => showMapTooltip(e, `${z.name}`, `Level: ${z.level.toUpperCase()}`));
    rect.addEventListener("mouseleave", hideMapTooltip);
    layerCongestion.append(rect);
  });

  // --- Traffic Flow Arrows ---
  MAJOR_ROADS_H.forEach((r, i) => {
    if (i % 2 === 0) {
      const path = svgEl("line", {
        x1: 40, y1: r.y - 5, x2: MAP_W - 40, y2: r.y - 5,
        stroke: "#38bdf8", "stroke-width": "1.5", "stroke-dasharray": "8 12", opacity: "0.45", "marker-end": "url(#flow-arrow)",
      });
      // Animate dash offset
      const anim = svgEl("animate", { attributeName: "stroke-dashoffset", from: "0", to: "-40", dur: "2s", repeatCount: "indefinite" });
      path.append(anim);
      layerFlow.append(path);
    }
  });
  MAJOR_ROADS_V.forEach((r, i) => {
    if (i % 2 === 1) {
      const path = svgEl("line", {
        x1: r.x + 5, y1: 40, x2: r.x + 5, y2: MAP_H - 40,
        stroke: "#38bdf8", "stroke-width": "1.5", "stroke-dasharray": "8 12", opacity: "0.45", "marker-end": "url(#flow-arrow)",
      });
      const anim = svgEl("animate", { attributeName: "stroke-dashoffset", from: "0", to: "-40", dur: "2s", repeatCount: "indefinite" });
      path.append(anim);
      layerFlow.append(path);
    }
  });

  // --- Diversion Routes ---
  DIVERSION_ROUTES.forEach((route) => {
    const d = route.points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
    const path = svgEl("path", {
      d, fill: "none", stroke: "#10b981", "stroke-width": "3", "stroke-dasharray": "10 6", opacity: "0.7", filter: "url(#glow)",
    });
    const anim = svgEl("animate", { attributeName: "stroke-dashoffset", from: "0", to: "-32", dur: "1.5s", repeatCount: "indefinite" });
    path.append(anim);
    path.addEventListener("mouseenter", (e) => showMapTooltip(e, route.name, "Diversion Active"));
    path.addEventListener("mouseleave", hideMapTooltip);
    layerDiversions.append(path);
  });

  // --- Barricade Markers (X icons) ---
  BARRICADES.forEach((b) => {
    const g = svgEl("g", { class: "barricade-marker", style: "cursor:pointer" });
    g.append(svgEl("line", { x1: b.x - 6, y1: b.y - 6, x2: b.x + 6, y2: b.y + 6, stroke: "#ef4444", "stroke-width": "2.5", "stroke-linecap": "round" }));
    g.append(svgEl("line", { x1: b.x + 6, y1: b.y - 6, x2: b.x - 6, y2: b.y + 6, stroke: "#ef4444", "stroke-width": "2.5", "stroke-linecap": "round" }));
    g.addEventListener("mouseenter", (e) => showMapTooltip(e, "Road Closed", b.road));
    g.addEventListener("mouseleave", hideMapTooltip);
    layerBarricades.append(g);
  });

  // --- Event Markers (pulsing circles) ---
  EVENT_MARKERS.forEach((m) => {
    const g = svgEl("g", { class: "event-marker", style: "cursor:pointer" });
    // Pulse ring
    const pulse = svgEl("circle", { cx: m.x, cy: m.y, r: 10, fill: "none", stroke: m.color, "stroke-width": "2", opacity: "0.6" });
    const animR = svgEl("animate", { attributeName: "r", from: "10", to: "24", dur: "1.8s", repeatCount: "indefinite" });
    const animO = svgEl("animate", { attributeName: "opacity", from: "0.6", to: "0", dur: "1.8s", repeatCount: "indefinite" });
    pulse.append(animR, animO);
    g.append(pulse);
    // Core dot
    g.append(svgEl("circle", { cx: m.x, cy: m.y, r: 7, fill: m.color, stroke: "#fff", "stroke-width": "1.5", filter: "url(#glow)" }));
    // Click -> popup
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      showEventPopup(m, e);
    });
    g.addEventListener("mouseenter", (e) => showMapTooltip(e, m.label, `Type: ${m.type} | Impact: ${m.impact}`));
    g.addEventListener("mouseleave", hideMapTooltip);
    layerEvents.append(g);
  });

  world.append(layerGrid, layerCongestion, layerFlow, layerDiversions, layerBarricades, layerEvents);
  svg.append(world);
  container.append(svg);

  // --- Pan & Zoom ---
  initMapPanZoom(svg, world);
  initMapControls(svg, world);
  initLayerToggles();
}

/* -- Map Tooltip -- */
let _mapTooltip = null;
function getMapTooltip() {
  if (!_mapTooltip) {
    _mapTooltip = document.createElement("div");
    Object.assign(_mapTooltip.style, {
      position: "fixed", padding: "8px 14px", background: "#1e293b", color: "#e2e8f0",
      borderRadius: "8px", fontSize: "12px", pointerEvents: "none", zIndex: "9999",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)", border: "1px solid #334155", maxWidth: "240px",
      transition: "opacity 0.15s", opacity: "0", fontFamily: "Inter,system-ui,sans-serif",
    });
    document.body.append(_mapTooltip);
  }
  return _mapTooltip;
}

function showMapTooltip(e, title, detail) {
  const tt = getMapTooltip();
  tt.innerHTML = `<strong style="color:#38bdf8">${title}</strong><br><span style="color:#94a3b8">${detail}</span>`;
  tt.style.left = `${e.clientX + 14}px`;
  tt.style.top = `${e.clientY + 14}px`;
  tt.style.opacity = "1";
}
function hideMapTooltip() {
  getMapTooltip().style.opacity = "0";
}

function trafficLevel() {
  const levels = ["Light Traffic", "Moderate Traffic", "Heavy Traffic", "Near Capacity"];
  return levels[Math.floor(Math.random() * levels.length)];
}

/* -- Event Popup -- */
function showEventPopup(marker, event) {
  // Remove existing
  document.querySelectorAll(".map-event-popup").forEach((p) => p.remove());
  const popup = document.createElement("div");
  popup.className = "map-event-popup";
  Object.assign(popup.style, {
    position: "fixed", left: `${event.clientX + 10}px`, top: `${event.clientY - 10}px`,
    background: "#1e293b", color: "#e2e8f0", borderRadius: "12px", padding: "16px 20px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)", zIndex: "10000", minWidth: "220px",
    border: `2px solid ${marker.color}`, fontFamily: "Inter,system-ui,sans-serif",
  });
  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
      <h4 style="margin:0;font-size:14px;color:${marker.color}">${marker.label}</h4>
      <button class="popup-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px">&times;</button>
    </div>
    <p style="margin:4px 0;font-size:12px;color:#94a3b8">Type: <strong style="color:#e2e8f0">${marker.type}</strong></p>
    <p style="margin:4px 0;font-size:12px;color:#94a3b8">Impact: <strong style="color:${marker.impact === "Critical" ? "#ef4444" : marker.impact === "High" ? "#f59e0b" : "#10b981"}">${marker.impact}</strong></p>
    <p style="margin:4px 0;font-size:12px;color:#94a3b8">Location: <strong style="color:#e2e8f0">(${marker.x}, ${marker.y})</strong></p>
    <button class="popup-details-btn" style="margin-top:10px;padding:6px 14px;background:${marker.color};color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;width:100%">View Full Details</button>
  `;
  document.body.append(popup);
  popup.querySelector(".popup-close").addEventListener("click", () => popup.remove());
  popup.querySelector(".popup-details-btn").addEventListener("click", () => {
    popup.remove();
    showNotification("info", "Event Details", `Opening details for "${marker.label}"…`);
  });
  // Click outside to close
  setTimeout(() => {
    const handler = (ev) => {
      if (!popup.contains(ev.target)) { popup.remove(); document.removeEventListener("click", handler); }
    };
    document.addEventListener("click", handler);
  }, 100);
}

/* -- Pan & Zoom -- */
function initMapPanZoom(svg, world) {
  svg.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    STATE.mapDragging = true;
    STATE.mapDragStart = { x: e.clientX - STATE.mapPan.x, y: e.clientY - STATE.mapPan.y };
    svg.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", (e) => {
    if (!STATE.mapDragging) return;
    STATE.mapPan.x = e.clientX - STATE.mapDragStart.x;
    STATE.mapPan.y = e.clientY - STATE.mapDragStart.y;
    applyMapTransform(world);
  });
  window.addEventListener("mouseup", () => {
    STATE.mapDragging = false;
    if (svg) svg.style.cursor = "grab";
  });
  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    STATE.mapZoom = Math.max(0.4, Math.min(4, STATE.mapZoom + delta));
    applyMapTransform(world);
  }, { passive: false });
}

function applyMapTransform(world) {
  world.setAttribute("transform", `translate(${STATE.mapPan.x},${STATE.mapPan.y}) scale(${STATE.mapZoom})`);
}

function initMapControls(svg, world) {
  const controlsContainer = document.getElementById("map-controls") || svg.parentElement;
  if (!controlsContainer || controlsContainer === svg.parentElement) {
    // Create control buttons beside the map
    const bar = document.createElement("div");
    bar.id = "map-controls";
    Object.assign(bar.style, {
      position: "absolute", top: "12px", right: "12px", display: "flex", flexDirection: "column", gap: "6px", zIndex: "20",
    });
    const btnStyle = "width:34px;height:34px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;";
    bar.innerHTML = `
      <button id="map-zoom-in" style="${btnStyle}" title="Zoom In">+</button>
      <button id="map-zoom-out" style="${btnStyle}" title="Zoom Out">−</button>
      <button id="map-reset" style="${btnStyle};font-size:12px" title="Reset View">⟲</button>
    `;
    const parent = svg.parentElement;
    if (parent) { parent.style.position = "relative"; parent.append(bar); }
  }
  document.getElementById("map-zoom-in")?.addEventListener("click", () => { STATE.mapZoom = Math.min(4, STATE.mapZoom + 0.2); applyMapTransform(world); });
  document.getElementById("map-zoom-out")?.addEventListener("click", () => { STATE.mapZoom = Math.max(0.4, STATE.mapZoom - 0.2); applyMapTransform(world); });
  document.getElementById("map-reset")?.addEventListener("click", () => { STATE.mapZoom = 1; STATE.mapPan = { x: 0, y: 0 }; applyMapTransform(world); });
}

function initLayerToggles() {
  const container = document.getElementById("map-layer-toggles");
  if (!container) return;
  const layers = [
    { id: "events", label: "Events", color: "#f59e0b" },
    { id: "congestion", label: "Congestion", color: "#ef4444" },
    { id: "flow", label: "Traffic Flow", color: "#38bdf8" },
    { id: "diversions", label: "Diversions", color: "#10b981" },
    { id: "barricades", label: "Barricades", color: "#ef4444" },
  ];
  container.innerHTML = "";
  layers.forEach((l) => {
    const label = document.createElement("label");
    label.style.cssText = "display:flex;align-items:center;gap:6px;font-size:12px;color:#94a3b8;cursor:pointer;margin-bottom:4px";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = STATE.mapLayers[l.id];
    cb.addEventListener("change", () => {
      STATE.mapLayers[l.id] = cb.checked;
      const layerEl = document.getElementById(`layer-${l.id}`);
      if (layerEl) layerEl.style.display = cb.checked ? "" : "none";
    });
    const dot = document.createElement("span");
    dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${l.color};display:inline-block`;
    label.append(cb, dot, document.createTextNode(` ${l.label}`));
    container.append(label);
  });
}

/* ----------------------------------------------------------------
   4. EVENT DETAILS FORM
   ---------------------------------------------------------------- */
const EVENT_TYPES = ["Concert", "Sports", "Political Rally", "Religious", "Parade", "Marathon", "Festival", "VIP Movement", "Construction", "Emergency"];

function initEventForm() {
  const form = document.getElementById("event-form");
  if (!form) return;

  // Populate event type dropdown if it exists
  const typeSelect = form.querySelector("#event-type, [name='event-type'], select");
  if (typeSelect && typeSelect.tagName === "SELECT" && typeSelect.options.length <= 1) {
    EVENT_TYPES.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.toLowerCase().replace(/\s+/g, "-");
      opt.textContent = t;
      typeSelect.append(opt);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateEventForm(form)) return;

    const data = Object.fromEntries(new FormData(form));
    showNotification("success", "Event Submitted", `"${data["event-name"] || data.name || "New Event"}" has been registered.`);

    // Add marker on the map
    addEventMarkerToMap({
      x: 200 + Math.random() * 500,
      y: 100 + Math.random() * 400,
      label: data["event-name"] || data.name || "New Event",
      type: data["event-type"] || "Concert",
      color: "#8b5cf6",
      impact: "Medium",
    });

    // Populate impact forecast
    updateImpactForecast(data);
    form.reset();
  });

  // Inline validation on blur
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => clearFieldError(field));
  });
}

function validateEventForm(form) {
  let valid = true;
  form.querySelectorAll("[required]").forEach((field) => {
    if (!validateField(field)) valid = false;
  });
  return valid;
}

function validateField(field) {
  clearFieldError(field);
  if (field.hasAttribute("required") && !field.value.trim()) {
    showFieldError(field, "This field is required");
    return false;
  }
  if (field.type === "email" && field.value && !/\S+@\S+\.\S+/.test(field.value)) {
    showFieldError(field, "Enter a valid email");
    return false;
  }
  if (field.type === "number" && field.value && isNaN(field.value)) {
    showFieldError(field, "Enter a valid number");
    return false;
  }
  return true;
}

function showFieldError(field, message) {
  field.style.borderColor = "#ef4444";
  let err = field.parentElement?.querySelector(".field-error");
  if (!err) {
    err = document.createElement("span");
    err.className = "field-error";
    err.style.cssText = "color:#ef4444;font-size:11px;display:block;margin-top:2px";
    field.parentElement?.append(err);
  }
  err.textContent = message;
}

function clearFieldError(field) {
  field.style.borderColor = "";
  field.parentElement?.querySelector(".field-error")?.remove();
}

function addEventMarkerToMap(m) {
  const layer = document.getElementById("layer-events");
  if (!layer) return;
  const g = svgEl("g", { class: "event-marker", style: "cursor:pointer" });
  const pulse = svgEl("circle", { cx: m.x, cy: m.y, r: 10, fill: "none", stroke: m.color, "stroke-width": "2", opacity: "0.6" });
  const animR = svgEl("animate", { attributeName: "r", from: "10", to: "24", dur: "1.8s", repeatCount: "indefinite" });
  const animO = svgEl("animate", { attributeName: "opacity", from: "0.6", to: "0", dur: "1.8s", repeatCount: "indefinite" });
  pulse.append(animR, animO);
  g.append(pulse);
  g.append(svgEl("circle", { cx: m.x, cy: m.y, r: 7, fill: m.color, stroke: "#fff", "stroke-width": "1.5", filter: "url(#glow)" }));
  g.addEventListener("click", (e) => { e.stopPropagation(); showEventPopup(m, e); });
  layer.append(g);
  // Bounce animation
  g.style.transformOrigin = `${m.x}px ${m.y}px`;
  g.animate([{ transform: "scale(0)" }, { transform: "scale(1.3)" }, { transform: "scale(1)" }], { duration: 500, easing: "ease-out" });
}

/* ----------------------------------------------------------------
   5. IMPACT FORECAST PANEL
   ---------------------------------------------------------------- */
function updateImpactForecast(eventData) {
  const panel = document.getElementById("impact-forecast") || document.querySelector(".impact-forecast");
  if (!panel) return;

  const attendance = parseInt(eventData.attendance || eventData["expected-crowd"] || "20000", 10) || 20000;
  const predictedVolume = Math.round(attendance * 0.4 + Math.random() * 2000);
  const expectedDelay = Math.round(15 + Math.random() * 30);
  const peakStart = 6 + Math.floor(Math.random() * 8);
  const peakEnd = peakStart + 2 + Math.floor(Math.random() * 3);
  const junctions = [
    "MG Road / Central Ave", "Gandhi Marg / Ring Road", "Station Road / Rajpath",
    "IT Expressway / NH-48", "Western Ave / Industrial Corridor",
  ].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 2));
  const diversions = [
    "Route Alpha — via Ring Road (+8 min)",
    "Route Beta — via Highway 7 (+12 min)",
    "Route Gamma — via Service Road (+15 min)",
  ].sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));

  panel.innerHTML = `
    <div class="forecast-item" style="margin-bottom:12px">
      <span style="color:#94a3b8;font-size:12px">Predicted Traffic Volume</span>
      <strong class="forecast-value" data-target="${predictedVolume}" style="display:block;font-size:20px;color:#38bdf8">${predictedVolume.toLocaleString()} veh/hr</strong>
    </div>
    <div class="forecast-item" style="margin-bottom:12px">
      <span style="color:#94a3b8;font-size:12px">Expected Delay</span>
      <strong style="display:block;font-size:20px;color:#f59e0b">${expectedDelay} min</strong>
    </div>
    <div class="forecast-item" style="margin-bottom:12px">
      <span style="color:#94a3b8;font-size:12px">Peak Congestion Window</span>
      <strong style="display:block;font-size:16px;color:#e2e8f0">${String(peakStart).padStart(2, "0")}:00 — ${String(peakEnd).padStart(2, "0")}:00</strong>
    </div>
    <div class="forecast-item" style="margin-bottom:12px">
      <span style="color:#94a3b8;font-size:12px">High-Risk Junctions</span>
      <ul style="list-style:none;padding:0;margin:4px 0">${junctions.map((j) => `<li style="color:#e2e8f0;font-size:13px;padding:2px 0">⚠ ${j}</li>`).join("")}</ul>
    </div>
    <div class="forecast-item">
      <span style="color:#94a3b8;font-size:12px">Recommended Diversions</span>
      <ul style="list-style:none;padding:0;margin:4px 0">${diversions.map((d) => `<li style="color:#10b981;font-size:13px;padding:2px 0">↳ ${d}</li>`).join("")}</ul>
    </div>
  `;

  // Animate entrance
  panel.querySelectorAll(".forecast-item").forEach((item, i) => {
    item.style.opacity = "0";
    item.style.transform = "translateY(10px)";
    item.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    setTimeout(() => { item.style.opacity = "1"; item.style.transform = "translateY(0)"; }, 100 * i);
  });
}

/* ----------------------------------------------------------------
   6. SVG CHARTS (no external libs)
   ---------------------------------------------------------------- */
let chartsInitialized = false;

function initCharts() {
  if (chartsInitialized) return;
  chartsInitialized = true;

  createLineChart(document.getElementById("chart-traffic-volume"));
  createHeatmapChart(document.getElementById("chart-congestion-heatmap"));
  createBarChart(document.getElementById("chart-delay-distribution"));
  createDonutChart(document.getElementById("chart-resource-usage"));
}

/* -- Line Chart: Traffic Volume Timeline -- */
function createLineChart(container) {
  if (!container) return;
  container.innerHTML = "";

  const W = 700, H = 350, pad = { t: 30, r: 30, b: 50, l: 60 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;

  // Generate data: 6AM to 10PM (17 points)
  const hours = Array.from({ length: 17 }, (_, i) => 6 + i);
  const predicted = [800, 1200, 2200, 3200, 3800, 4200, 4500, 4700, 4400, 3900, 3600, 3200, 2800, 2200, 1800, 1200, 900];
  const actual = predicted.map((v) => Math.round(v + (Math.random() - 0.5) * 800));

  const maxY = 5000;

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: "100%", style: "font-family:Inter,system-ui,sans-serif" });

  // Grid lines & Y axis
  for (let i = 0; i <= 5; i++) {
    const y = pad.t + ch - (i / 5) * ch;
    svg.append(svgEl("line", { x1: pad.l, y1: y, x2: W - pad.r, y2: y, stroke: "#334155", "stroke-width": "0.5" }));
    const txt = svgEl("text", { x: pad.l - 10, y: y + 4, fill: "#94a3b8", "font-size": "10", "text-anchor": "end" });
    txt.textContent = ((i / 5) * maxY).toLocaleString();
    svg.append(txt);
  }

  // X axis labels
  hours.forEach((h, i) => {
    const x = pad.l + (i / (hours.length - 1)) * cw;
    const txt = svgEl("text", { x, y: H - pad.b + 20, fill: "#94a3b8", "font-size": "10", "text-anchor": "middle" });
    txt.textContent = `${h}:00`;
    svg.append(txt);
  });

  // Axis labels
  const yLabel = svgEl("text", { x: 14, y: H / 2, fill: "#64748b", "font-size": "11", "text-anchor": "middle", transform: `rotate(-90, 14, ${H / 2})` });
  yLabel.textContent = "Vehicles / hr";
  svg.append(yLabel);
  const xLabel = svgEl("text", { x: W / 2, y: H - 5, fill: "#64748b", "font-size": "11", "text-anchor": "middle" });
  xLabel.textContent = "Time of Day";
  svg.append(xLabel);

  function toCoord(arr) {
    return arr.map((v, i) => {
      const x = pad.l + (i / (arr.length - 1)) * cw;
      const y = pad.t + ch - (v / maxY) * ch;
      return { x, y, v };
    });
  }

  const predCoords = toCoord(predicted);
  const actCoords = toCoord(actual);

  // Line paths
  function linePath(coords) {
    return coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  }

  // Predicted (dashed emerald)
  const predLine = svgEl("path", {
    d: linePath(predCoords), fill: "none", stroke: "#10b981", "stroke-width": "2.5", "stroke-dasharray": "8 4",
  });
  // Animated draw-in
  const predLen = predLine.getTotalLength ? 2000 : 2000;
  predLine.setAttribute("stroke-dasharray", `${predLen}`);
  predLine.setAttribute("stroke-dashoffset", `${predLen}`);
  const animPred = svgEl("animate", { attributeName: "stroke-dashoffset", from: `${predLen}`, to: "0", dur: "1.5s", fill: "freeze" });
  predLine.append(animPred);
  svg.append(predLine);

  // Actual (solid amber)
  const actLine = svgEl("path", {
    d: linePath(actCoords), fill: "none", stroke: "#f59e0b", "stroke-width": "2.5",
  });
  actLine.setAttribute("stroke-dasharray", `${predLen}`);
  actLine.setAttribute("stroke-dashoffset", `${predLen}`);
  const animAct = svgEl("animate", { attributeName: "stroke-dashoffset", from: `${predLen}`, to: "0", dur: "1.5s", fill: "freeze", begin: "0.3s" });
  actLine.append(animAct);
  svg.append(actLine);

  // Data points & tooltips
  [{ coords: predCoords, color: "#10b981", label: "Predicted" }, { coords: actCoords, color: "#f59e0b", label: "Actual" }].forEach((series) => {
    series.coords.forEach((c, i) => {
      const dot = svgEl("circle", { cx: c.x, cy: c.y, r: 4, fill: series.color, stroke: "#0f172a", "stroke-width": "2", style: "cursor:pointer", opacity: "0" });
      const animDot = svgEl("animate", { attributeName: "opacity", from: "0", to: "1", dur: "0.3s", begin: `${1 + i * 0.05}s`, fill: "freeze" });
      dot.append(animDot);
      dot.addEventListener("mouseenter", (e) => showMapTooltip(e, `${series.label} @ ${hours[i]}:00`, `${c.v.toLocaleString()} veh/hr`));
      dot.addEventListener("mouseleave", hideMapTooltip);
      svg.append(dot);
    });
  });

  // Legend
  const leg = svgEl("g", { transform: `translate(${pad.l + 10}, ${pad.t - 10})` });
  // Predicted
  leg.append(svgEl("line", { x1: 0, y1: 0, x2: 24, y2: 0, stroke: "#10b981", "stroke-width": "2.5", "stroke-dasharray": "6 3" }));
  const lt1 = svgEl("text", { x: 30, y: 4, fill: "#94a3b8", "font-size": "11" }); lt1.textContent = "Predicted"; leg.append(lt1);
  // Actual
  leg.append(svgEl("line", { x1: 110, y1: 0, x2: 134, y2: 0, stroke: "#f59e0b", "stroke-width": "2.5" }));
  const lt2 = svgEl("text", { x: 140, y: 4, fill: "#94a3b8", "font-size": "11" }); lt2.textContent = "Actual"; leg.append(lt2);
  svg.append(leg);

  container.append(svg);
}

/* -- Heatmap Chart: Congestion by Hour & Zone -- */
function createHeatmapChart(container) {
  if (!container) return;
  container.innerHTML = "";

  const zones = ["MG Road", "Central Ave", "Ring Road", "Station Rd", "IT Expway", "Airport Rd", "Gandhi Marg", "Western Ave"];
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6AM-9PM
  const cellW = 38, cellH = 28, padL = 90, padT = 30;
  const W = padL + hours.length * cellW + 20;
  const H = padT + zones.length * cellH + 40;

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: "100%", style: "font-family:Inter,system-ui,sans-serif" });

  // Y labels (zones)
  zones.forEach((z, i) => {
    const txt = svgEl("text", { x: padL - 6, y: padT + i * cellH + cellH / 2 + 4, fill: "#94a3b8", "font-size": "10", "text-anchor": "end" });
    txt.textContent = z;
    svg.append(txt);
  });

  // X labels (hours)
  hours.forEach((h, i) => {
    const txt = svgEl("text", { x: padL + i * cellW + cellW / 2, y: padT - 8, fill: "#94a3b8", "font-size": "9", "text-anchor": "middle" });
    txt.textContent = `${h}`;
    svg.append(txt);
  });

  // Cells
  zones.forEach((z, zi) => {
    hours.forEach((h, hi) => {
      // Simulate congestion: higher mid-day, higher for certain roads
      const base = Math.sin(((h - 6) / 16) * Math.PI) * 0.7;
      const roadFactor = [1, 0.9, 0.8, 0.7, 0.5, 0.4, 0.75, 0.6][zi];
      const val = Math.min(1, Math.max(0, base * roadFactor + (Math.random() * 0.3 - 0.15)));
      const pct = Math.round(val * 100);

      // Color interpolation: green -> yellow -> red
      let r, g, b;
      if (val < 0.5) {
        r = Math.round(16 + val * 2 * (245 - 16));
        g = Math.round(185 + val * 2 * (158 - 185));
        b = Math.round(129 + val * 2 * (11 - 129));
      } else {
        const t = (val - 0.5) * 2;
        r = Math.round(245 - t * (245 - 239));
        g = Math.round(158 - t * (158 - 68));
        b = Math.round(11 + t * (68 - 11));
      }
      const color = `rgb(${r},${g},${b})`;

      const rect = svgEl("rect", {
        x: padL + hi * cellW, y: padT + zi * cellH,
        width: cellW - 2, height: cellH - 2, rx: 3, fill: color, opacity: "0.85", style: "cursor:pointer",
      });
      // Animate entrance
      rect.style.opacity = "0";
      setTimeout(() => { rect.style.transition = "opacity 0.3s"; rect.style.opacity = "0.85"; }, 30 * (zi + hi));
      rect.addEventListener("mouseenter", (e) => {
        rect.setAttribute("stroke", "#fff");
        rect.setAttribute("stroke-width", "2");
        showMapTooltip(e, `${z} @ ${h}:00`, `Congestion: ${pct}%`);
      });
      rect.addEventListener("mouseleave", () => {
        rect.removeAttribute("stroke");
        rect.removeAttribute("stroke-width");
        hideMapTooltip();
      });
      svg.append(rect);
    });
  });

  container.append(svg);
}

/* -- Bar Chart: Delay Distribution -- */
function createBarChart(container) {
  if (!container) return;
  container.innerHTML = "";

  const categories = ["<5 min", "5-15 min", "15-30 min", "30-60 min", ">60 min"];
  const values = [1842, 3256, 2180, 987, 312];
  const colors = ["#10b981", "#34d399", "#f59e0b", "#f97316", "#ef4444"];
  const maxVal = Math.max(...values);

  const W = 500, H = 320, padL = 55, padB = 50, padT = 20, padR = 20;
  const cw = W - padL - padR, ch = H - padT - padB;
  const barW = cw / categories.length * 0.6;
  const gap = cw / categories.length;

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: "100%", style: "font-family:Inter,system-ui,sans-serif" });

  // Y axis grid
  for (let i = 0; i <= 4; i++) {
    const y = padT + ch - (i / 4) * ch;
    svg.append(svgEl("line", { x1: padL, y1: y, x2: W - padR, y2: y, stroke: "#334155", "stroke-width": "0.5" }));
    const txt = svgEl("text", { x: padL - 8, y: y + 4, fill: "#94a3b8", "font-size": "10", "text-anchor": "end" });
    txt.textContent = Math.round((i / 4) * maxVal).toLocaleString();
    svg.append(txt);
  }

  // Bars
  categories.forEach((cat, i) => {
    const barH = (values[i] / maxVal) * ch;
    const x = padL + i * gap + (gap - barW) / 2;
    const y = padT + ch - barH;

    const rect = svgEl("rect", {
      x, y: padT + ch, width: barW, height: 0, rx: 4, fill: colors[i], style: "cursor:pointer",
    });
    // Animate growth
    setTimeout(() => {
      rect.setAttribute("y", y);
      rect.setAttribute("height", barH);
      rect.style.transition = "y 0.6s ease-out, height 0.6s ease-out";
    }, 100 * i);

    // Value label on top
    const valText = svgEl("text", {
      x: x + barW / 2, y: y - 6, fill: "#e2e8f0", "font-size": "10", "text-anchor": "middle", opacity: "0",
    });
    valText.textContent = values[i].toLocaleString();
    setTimeout(() => { valText.style.transition = "opacity 0.3s"; valText.style.opacity = "1"; }, 600 + 100 * i);

    rect.addEventListener("mouseenter", (e) => {
      rect.setAttribute("opacity", "0.8");
      showMapTooltip(e, cat, `${values[i].toLocaleString()} incidents`);
    });
    rect.addEventListener("mouseleave", () => {
      rect.setAttribute("opacity", "1");
      hideMapTooltip();
    });

    // Category label
    const label = svgEl("text", { x: x + barW / 2, y: H - padB + 18, fill: "#94a3b8", "font-size": "10", "text-anchor": "middle" });
    label.textContent = cat;

    svg.append(rect, valText, label);
  });

  container.append(svg);
}

/* -- Donut Chart: Resource Usage -- */
function createDonutChart(container) {
  if (!container) return;
  container.innerHTML = "";

  const data = [
    { label: "Traffic Officers", value: 284, color: "#10b981" },
    { label: "Emergency Teams", value: 42, color: "#ef4444" },
    { label: "Barricades", value: 163, color: "#f59e0b" },
    { label: "Vehicles", value: 67, color: "#64748b" },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  const size = 300;
  const cx = size / 2, cy = size / 2, R = 110, r = 70;

  const svg = svgEl("svg", { viewBox: `0 0 ${size} ${size}`, width: "100%", height: "100%", style: "font-family:Inter,system-ui,sans-serif" });

  let cumAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startOuter = { x: cx + R * Math.cos(cumAngle), y: cy + R * Math.sin(cumAngle) };
    const endOuter = { x: cx + R * Math.cos(cumAngle + angle), y: cy + R * Math.sin(cumAngle + angle) };
    const startInner = { x: cx + r * Math.cos(cumAngle + angle), y: cy + r * Math.sin(cumAngle + angle) };
    const endInner = { x: cx + r * Math.cos(cumAngle), y: cy + r * Math.sin(cumAngle) };
    const large = angle > Math.PI ? 1 : 0;

    const pathD = [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${R} ${R} 0 ${large} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${r} ${r} 0 ${large} 0 ${endInner.x} ${endInner.y}`,
      "Z",
    ].join(" ");

    const path = svgEl("path", { d: pathD, fill: d.color, style: "cursor:pointer;transition:transform 0.2s", "transform-origin": `${cx}px ${cy}px` });

    // Animated draw-in: start with scale 0
    path.style.opacity = "0";
    path.style.transform = "scale(0)";
    setTimeout(() => {
      path.style.transition = "opacity 0.5s, transform 0.5s ease-out";
      path.style.opacity = "1";
      path.style.transform = "scale(1)";
    }, 150 * i);

    path.addEventListener("mouseenter", (e) => {
      path.style.transform = "scale(1.06)";
      showMapTooltip(e, d.label, `${d.value} (${Math.round((d.value / total) * 100)}%)`);
    });
    path.addEventListener("mouseleave", () => {
      path.style.transform = "scale(1)";
      hideMapTooltip();
    });

    svg.append(path);
    cumAngle += angle;
  });

  // Center text
  const totalText = svgEl("text", { x: cx, y: cy - 6, fill: "#e2e8f0", "font-size": "26", "text-anchor": "middle", "font-weight": "700" });
  totalText.textContent = total.toLocaleString();
  const subText = svgEl("text", { x: cx, y: cy + 16, fill: "#94a3b8", "font-size": "11", "text-anchor": "middle" });
  subText.textContent = "Total Resources";
  svg.append(totalText, subText);

  // Legend beneath
  const legendG = svgEl("g", { transform: `translate(${cx - 100}, ${size - 20})` });
  data.forEach((d, i) => {
    const lx = (i % 2) * 110;
    const ly = Math.floor(i / 2) * 16;
    legendG.append(svgEl("rect", { x: lx, y: ly, width: 8, height: 8, rx: 2, fill: d.color }));
    const lt = svgEl("text", { x: lx + 12, y: ly + 8, fill: "#94a3b8", "font-size": "9" });
    lt.textContent = d.label;
    legendG.append(lt);
  });
  svg.append(legendG);

  container.append(svg);
}

/* ----------------------------------------------------------------
   7. RESOURCE ALLOCATION
   ---------------------------------------------------------------- */
function populateResourceAllocation() {
  const panel = document.getElementById("resource-allocation");
  if (!panel) return;

  const manpower = [
    { label: "Traffic Officers Needed", value: 45, icon: "👮" },
    { label: "Shift 1 (6 AM – 2 PM)", value: 20, icon: "🌅" },
    { label: "Shift 2 (2 PM – 10 PM)", value: 25, icon: "🌆" },
    { label: "Emergency Teams", value: 3, icon: "🚑" },
    { label: "Supervisors", value: 5, icon: "📋" },
  ];

  const barricading = [
    { label: "Type A Barricades", value: 28, icon: "🚧" },
    { label: "Type B Barriers", value: 15, icon: "🛑" },
    { label: "Traffic Cones", value: 120, icon: "🔶" },
    { label: "Control Points", value: 8, icon: "📍" },
    { label: "Entry Gates", value: 4, icon: "🚪" },
  ];

  const diversions = [
    { name: "Route Alpha", via: "Ring Road", capacity: 3200, used: 2400, extra: "+8 min" },
    { name: "Route Beta", via: "Highway 7", capacity: 2800, used: 1900, extra: "+12 min" },
    { name: "Route Gamma", via: "Service Road", capacity: 1500, used: 1200, extra: "+15 min" },
  ];

  function renderList(items) {
    return items.map((it) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1e293b">
        <span style="color:#94a3b8;font-size:13px">${it.icon} ${it.label}</span>
        <strong style="color:#e2e8f0;font-size:14px">${it.value}</strong>
      </div>
    `).join("");
  }

  function renderDiversions(routes) {
    return routes.map((r) => {
      const pct = Math.round((r.used / r.capacity) * 100);
      const barColor = pct > 80 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#10b981";
      return `
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <strong style="color:#e2e8f0;font-size:13px">${r.name}</strong>
            <span style="color:#64748b;font-size:11px">${r.extra}</span>
          </div>
          <div style="color:#94a3b8;font-size:11px;margin-bottom:4px">via ${r.via} — ${r.used.toLocaleString()} / ${r.capacity.toLocaleString()} veh/hr</div>
          <div style="background:#1e293b;border-radius:4px;height:8px;overflow:hidden">
            <div class="progress-fill" style="width:0%;height:100%;background:${barColor};border-radius:4px;transition:width 1s ease-out" data-target="${pct}"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  panel.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px">
      <div>
        <h4 style="color:#38bdf8;font-size:14px;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">👥 Manpower</h4>
        ${renderList(manpower)}
      </div>
      <div>
        <h4 style="color:#f59e0b;font-size:14px;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">🚧 Barricading</h4>
        ${renderList(barricading)}
      </div>
      <div>
        <h4 style="color:#10b981;font-size:14px;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px">↳ Diversions</h4>
        ${renderDiversions(diversions)}
      </div>
    </div>
  `;

  // Animate progress bars
  setTimeout(() => {
    panel.querySelectorAll(".progress-fill").forEach((bar) => {
      bar.style.width = bar.getAttribute("data-target") + "%";
    });
  }, 300);
}

/* ----------------------------------------------------------------
   8. NOTIFICATION SYSTEM
   ---------------------------------------------------------------- */
const SAMPLE_NOTIFICATIONS = [
  { type: "info", title: "New Event Submitted", message: "Ganesh Festival Procession registered for Sep 7", time: "2 min ago" },
  { type: "warning", title: "Congestion Alert", message: "MG Road exceeding capacity — 94% utilization", time: "8 min ago" },
  { type: "success", title: "Deployment Confirmed", message: "Resource deployment confirmed for Zone B", time: "15 min ago" },
  { type: "info", title: "Report Ready", message: "Post-event report ready for Stadium Rally", time: "1 hr ago" },
  { type: "error", title: "Emergency", message: "Accident reported at Central Ave / Ring Road junction", time: "22 min ago" },
];

function initNotifications() {
  STATE.notifications = [...SAMPLE_NOTIFICATIONS];
  STATE.unreadCount = SAMPLE_NOTIFICATIONS.length;
  updateNotificationBadge();

  const bell = document.getElementById("notification-bell") || document.querySelector(".notification-bell");
  if (bell) {
    bell.style.cursor = "pointer";
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleNotificationDropdown();
    });
  }

  // Close dropdown when clicking elsewhere
  document.addEventListener("click", () => {
    const dd = document.getElementById("notif-dropdown");
    if (dd) dd.remove();
  });
}

function updateNotificationBadge() {
  const badge = document.getElementById("notif-badge") || document.querySelector(".notif-badge, .notification-count");
  if (badge) {
    badge.textContent = STATE.unreadCount;
    badge.style.display = STATE.unreadCount > 0 ? "" : "none";
  }
}

function toggleNotificationDropdown() {
  let dd = document.getElementById("notif-dropdown");
  if (dd) { dd.remove(); return; }

  dd = document.createElement("div");
  dd.id = "notif-dropdown";
  Object.assign(dd.style, {
    position: "fixed", top: "60px", right: "24px", width: "340px", maxHeight: "420px",
    background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    zIndex: "10001", overflowY: "auto", fontFamily: "Inter,system-ui,sans-serif",
  });

  const header = document.createElement("div");
  header.style.cssText = "padding:14px 16px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center";
  header.innerHTML = `<strong style="color:#e2e8f0;font-size:14px">Notifications</strong><button id="notif-clear" style="background:none;border:none;color:#38bdf8;cursor:pointer;font-size:12px">Mark all read</button>`;
  dd.append(header);

  STATE.notifications.forEach((n) => {
    const item = document.createElement("div");
    item.style.cssText = "padding:12px 16px;border-bottom:1px solid #0f172a;cursor:pointer;transition:background 0.15s";
    const iconMap = { info: "ℹ️", warning: "⚠️", success: "✅", error: "🚨" };
    item.innerHTML = `
      <div style="display:flex;gap:10px;align-items:start">
        <span style="font-size:16px">${iconMap[n.type] || "ℹ️"}</span>
        <div>
          <strong style="color:#e2e8f0;font-size:13px">${n.title}</strong>
          <p style="color:#94a3b8;font-size:12px;margin:2px 0 0">${n.message}</p>
          <span style="color:#64748b;font-size:10px">${n.time}</span>
        </div>
      </div>
    `;
    item.addEventListener("mouseenter", () => { item.style.background = "#334155"; });
    item.addEventListener("mouseleave", () => { item.style.background = ""; });
    dd.append(item);
  });

  document.body.append(dd);

  dd.querySelector("#notif-clear")?.addEventListener("click", () => {
    STATE.unreadCount = 0;
    updateNotificationBadge();
    showNotification("info", "Notifications", "All notifications marked as read.");
  });

  dd.addEventListener("click", (e) => e.stopPropagation());
}

function showNotification(type, title, message) {
  const toast = document.createElement("div");
  const colors = { success: "#10b981", warning: "#f59e0b", error: "#ef4444", info: "#38bdf8" };
  const icons = { success: "✅", warning: "⚠️", error: "🚨", info: "ℹ️" };
  Object.assign(toast.style, {
    position: "fixed", bottom: "24px", right: "24px", minWidth: "300px", maxWidth: "400px",
    padding: "14px 20px", background: "#1e293b", border: `1px solid ${colors[type] || colors.info}`,
    borderLeft: `4px solid ${colors[type] || colors.info}`, borderRadius: "10px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)", zIndex: "10002", fontFamily: "Inter,system-ui,sans-serif",
    transform: "translateX(120%)", transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s",
    opacity: "0",
  });
  toast.innerHTML = `
    <div style="display:flex;gap:10px;align-items:start">
      <span style="font-size:18px">${icons[type] || icons.info}</span>
      <div style="flex:1">
        <strong style="color:#e2e8f0;font-size:13px">${title}</strong>
        <p style="color:#94a3b8;font-size:12px;margin:2px 0 0">${message}</p>
      </div>
      <button class="toast-close" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:16px">&times;</button>
    </div>
  `;

  // Stack multiple toasts
  const existing = document.querySelectorAll(".toast-notification");
  const offset = existing.length * 80;
  toast.style.bottom = `${24 + offset}px`;
  toast.className = "toast-notification";
  document.body.append(toast);

  requestAnimationFrame(() => { toast.style.transform = "translateX(0)"; toast.style.opacity = "1"; });

  const dismiss = () => {
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 350);
  };
  toast.querySelector(".toast-close").addEventListener("click", dismiss);
  setTimeout(dismiss, 5000);

  // Add to state
  STATE.notifications.unshift({ type, title, message, time: "Just now" });
  STATE.unreadCount++;
  updateNotificationBadge();
}

/* ----------------------------------------------------------------
   9. SMART FILTERS
   ---------------------------------------------------------------- */
function initFilters() {
  const toggle = document.getElementById("filter-toggle") || document.querySelector(".filter-toggle, [data-filter-toggle]");
  if (toggle) {
    toggle.addEventListener("click", () => openFilterPanel());
  }
}

function openFilterPanel() {
  if (document.getElementById("filter-panel")) {
    closeFilterPanel();
    return;
  }

  const panel = document.createElement("div");
  panel.id = "filter-panel";
  Object.assign(panel.style, {
    position: "fixed", top: 0, right: 0, width: "340px", height: "100vh",
    background: "#1e293b", borderLeft: "1px solid #334155", boxShadow: "-4px 0 20px rgba(0,0,0,0.4)",
    zIndex: "10003", overflowY: "auto", transform: "translateX(100%)", transition: "transform 0.3s ease",
    fontFamily: "Inter,system-ui,sans-serif", padding: "24px",
  });

  const eventTypes = EVENT_TYPES;
  const statuses = ["Active", "Planned", "Completed", "Cancelled"];
  const levels = ["Low", "Medium", "High", "Critical"];
  const zones = ["North", "South", "East", "West", "Central"];

  function checkboxGroup(title, items, name) {
    return `
      <div style="margin-bottom:20px">
        <label style="color:#e2e8f0;font-size:13px;font-weight:600;display:block;margin-bottom:8px">${title}</label>
        ${items.map((it) => `
          <label style="display:flex;align-items:center;gap:8px;color:#94a3b8;font-size:12px;margin-bottom:4px;cursor:pointer">
            <input type="checkbox" name="${name}" value="${it.toLowerCase().replace(/\s+/g, "-")}" style="accent-color:#38bdf8">
            ${it}
          </label>
        `).join("")}
      </div>
    `;
  }

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h3 style="margin:0;color:#e2e8f0;font-size:16px">🔍 Smart Filters</h3>
      <button id="filter-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:20px">&times;</button>
    </div>
    ${checkboxGroup("Event Type", eventTypes, "filter-type")}
    <div style="margin-bottom:20px">
      <label style="color:#e2e8f0;font-size:13px;font-weight:600;display:block;margin-bottom:8px">Date Range</label>
      <div style="display:flex;gap:8px">
        <input type="date" id="filter-date-from" style="flex:1;padding:6px 10px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px">
        <input type="date" id="filter-date-to" style="flex:1;padding:6px 10px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px">
      </div>
    </div>
    ${checkboxGroup("Status", statuses, "filter-status")}
    ${checkboxGroup("Congestion Level", levels, "filter-level")}
    ${checkboxGroup("Zone", zones, "filter-zone")}
    <div style="display:flex;gap:10px;margin-top:24px">
      <button id="filter-apply" style="flex:1;padding:10px;background:#38bdf8;color:#0f172a;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">Apply Filters</button>
      <button id="filter-clear" style="flex:1;padding:10px;background:#334155;color:#e2e8f0;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">Clear All</button>
    </div>
  `;

  document.body.append(panel);
  requestAnimationFrame(() => { panel.style.transform = "translateX(0)"; });

  panel.querySelector("#filter-close").addEventListener("click", closeFilterPanel);
  panel.querySelector("#filter-apply").addEventListener("click", () => {
    showNotification("success", "Filters Applied", "Data filtered according to your criteria.");
    closeFilterPanel();
  });
  panel.querySelector("#filter-clear").addEventListener("click", () => {
    panel.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
    panel.querySelectorAll('input[type="date"]').forEach((d) => { d.value = ""; });
    showNotification("info", "Filters Cleared", "All filters have been reset.");
  });
}

function closeFilterPanel() {
  const panel = document.getElementById("filter-panel");
  if (panel) {
    panel.style.transform = "translateX(100%)";
    setTimeout(() => panel.remove(), 300);
  }
}

/* ----------------------------------------------------------------
   10. TIMELINE REPLAY
   ---------------------------------------------------------------- */
function initTimelineReplay() {
  const controls = document.getElementById("timeline-controls");
  if (!controls) return;

  controls.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button id="tl-play" class="btn" style="padding:6px 16px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">▶ Play</button>
      <button id="tl-pause" class="btn" style="padding:6px 16px;background:#f59e0b;color:#0f172a;border:none;border-radius:6px;cursor:pointer;font-size:13px;display:none">⏸ Pause</button>
      <select id="tl-speed" style="padding:6px 10px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px">
        <option value="1">1× Speed</option>
        <option value="2">2× Speed</option>
        <option value="4">4× Speed</option>
      </select>
      <input id="tl-scrubber" type="range" min="6" max="22" value="6" step="0.5" style="flex:1;min-width:140px;accent-color:#38bdf8">
      <span id="tl-time" style="color:#38bdf8;font-size:14px;font-weight:600;min-width:60px">06:00</span>
    </div>
  `;

  const playBtn = document.getElementById("tl-play");
  const pauseBtn = document.getElementById("tl-pause");
  const speedSel = document.getElementById("tl-speed");
  const scrubber = document.getElementById("tl-scrubber");
  const timeLabel = document.getElementById("tl-time");

  function updateTimeDisplay(hour) {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    timeLabel.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    scrubber.value = hour;
    updateMapCongestionForTime(hour);
  }

  playBtn.addEventListener("click", () => {
    STATE.timelinePlaying = true;
    playBtn.style.display = "none";
    pauseBtn.style.display = "";
    STATE.timelineInterval = setInterval(() => {
      STATE.timelineHour += 0.5 * STATE.timelineSpeed;
      if (STATE.timelineHour > 22) STATE.timelineHour = 6;
      updateTimeDisplay(STATE.timelineHour);
    }, 1000);
  });

  pauseBtn.addEventListener("click", () => {
    STATE.timelinePlaying = false;
    pauseBtn.style.display = "none";
    playBtn.style.display = "";
    clearInterval(STATE.timelineInterval);
  });

  speedSel.addEventListener("change", () => {
    STATE.timelineSpeed = parseInt(speedSel.value, 10);
  });

  scrubber.addEventListener("input", () => {
    STATE.timelineHour = parseFloat(scrubber.value);
    updateTimeDisplay(STATE.timelineHour);
  });
}

function updateMapCongestionForTime(hour) {
  const zones = document.querySelectorAll(".congestion-zone");
  const peakFactor = Math.sin(((hour - 6) / 16) * Math.PI);
  zones.forEach((z) => {
    const intensity = Math.min(1, Math.max(0, peakFactor + (Math.random() * 0.2 - 0.1)));
    let color;
    if (intensity < 0.35) color = "#10b981";
    else if (intensity < 0.65) color = "#f59e0b";
    else color = "#ef4444";
    z.setAttribute("fill", color);
    z.setAttribute("stroke", color);
  });
}

/* ----------------------------------------------------------------
   11. MICROINTERACTIONS
   ---------------------------------------------------------------- */
function addRippleEffect(buttons) {
  buttons.forEach((btn) => {
    btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.addEventListener("click", function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      Object.assign(ripple.style, {
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.3)",
        transform: "scale(0)",
        left: `${e.clientX - rect.left - size / 2}px`,
        top: `${e.clientY - rect.top - size / 2}px`,
        pointerEvents: "none",
      });
      this.append(ripple);
      ripple.animate([{ transform: "scale(0)", opacity: 1 }, { transform: "scale(2.5)", opacity: 0 }], { duration: 600, easing: "ease-out" });
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function initHoverEffects() {
  // Card lift on hover
  document.querySelectorAll(".card, .kpi-card, .metric-card, .stat-card").forEach((card) => {
    card.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-4px)";
      card.style.boxShadow = "0 12px 28px rgba(0,0,0,0.25)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.boxShadow = "";
    });
  });

  // Table row highlight
  document.querySelectorAll("table tbody tr").forEach((row) => {
    row.style.transition = "background 0.15s";
    row.addEventListener("mouseenter", () => { row.style.background = "rgba(56,189,248,0.06)"; });
    row.addEventListener("mouseleave", () => { row.style.background = ""; });
  });
}

function initSkeletonLoading(container) {
  if (!container) return;
  const skeleton = document.createElement("div");
  skeleton.className = "skeleton-loader";
  skeleton.innerHTML = Array.from({ length: 4 }, () => `
    <div style="margin-bottom:16px">
      <div style="height:14px;width:${40 + Math.random() * 40}%;background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;border-radius:4px;animation:skeleton-wave 1.5s infinite"></div>
      <div style="height:10px;width:${60 + Math.random() * 30}%;background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;border-radius:4px;margin-top:8px;animation:skeleton-wave 1.5s infinite 0.2s"></div>
    </div>
  `).join("");
  container.prepend(skeleton);

  // Add keyframes if not yet added
  if (!document.getElementById("skeleton-keyframes")) {
    const style = document.createElement("style");
    style.id = "skeleton-keyframes";
    style.textContent = `@keyframes skeleton-wave{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
    document.head.append(style);
  }

  return skeleton;
}

/* ----------------------------------------------------------------
   12. DATA TABLES — Events
   ---------------------------------------------------------------- */
const eventsData = [
  { id: "EVT-2024-001", name: "Republic Day Parade", type: "Parade", date: "2024-01-26", location: "Rajpath Boulevard", status: "Completed", impact: "High" },
  { id: "EVT-2024-002", name: "IPL Cricket Match", type: "Sports", date: "2024-03-15", location: "City Stadium", status: "Completed", impact: "Medium" },
  { id: "EVT-2024-003", name: "Ganesh Chaturthi", type: "Religious", date: "2024-09-07", location: "Central Avenue", status: "Active", impact: "Critical" },
  { id: "EVT-2024-004", name: "Marathon 2024", type: "Marathon", date: "2024-11-17", location: "Ring Road", status: "Planned", impact: "High" },
  { id: "EVT-2024-005", name: "Tech Conference", type: "Concert", date: "2024-04-22", location: "Convention Center", status: "Completed", impact: "Low" },
  { id: "EVT-2024-006", name: "Diwali Celebrations", type: "Festival", date: "2024-11-01", location: "Market Square", status: "Planned", impact: "Critical" },
  { id: "EVT-2024-007", name: "PM Visit", type: "VIP Movement", date: "2024-06-10", location: "Airport Road", status: "Completed", impact: "High" },
  { id: "EVT-2024-008", name: "Road Widening Phase 2", type: "Construction", date: "2024-08-01", location: "Highway 4", status: "Active", impact: "Medium" },
];

function initTables() {
  renderEventsTable();
}

function renderEventsTable() {
  const container = document.getElementById("events-table") || document.querySelector(".events-table");
  if (!container) return;

  // Filter & sort
  let data = [...eventsData];
  if (STATE.eventsSearch) {
    const q = STATE.eventsSearch.toLowerCase();
    data = data.filter((e) =>
      e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) ||
      e.status.toLowerCase().includes(q)
    );
  }

  const { col, dir } = STATE.eventsSort;
  data.sort((a, b) => {
    const va = a[col] || "", vb = b[col] || "";
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(data.length / STATE.eventsPerPage);
  const page = Math.min(STATE.eventsPage, totalPages) || 1;
  const pageData = data.slice((page - 1) * STATE.eventsPerPage, page * STATE.eventsPerPage);

  const statusColors = { Active: "#10b981", Planned: "#38bdf8", Completed: "#64748b", Cancelled: "#ef4444" };
  const impactColors = { Low: "#10b981", Medium: "#f59e0b", High: "#f97316", Critical: "#ef4444" };

  function sortIcon(c) {
    if (col !== c) return `<span style="color:#475569;font-size:10px"> ⇅</span>`;
    return dir === "asc" ? `<span style="color:#38bdf8;font-size:10px"> ↑</span>` : `<span style="color:#38bdf8;font-size:10px"> ↓</span>`;
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <input id="events-search" type="text" placeholder="Search events…" value="${STATE.eventsSearch}"
        style="padding:8px 14px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:13px;min-width:220px;outline:none">
      <span style="color:#64748b;font-size:12px">${data.length} event${data.length !== 1 ? "s" : ""} found</span>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="border-bottom:2px solid #334155">
            ${["id", "name", "type", "date", "location", "status", "impact"]
              .map((c) => `<th data-sort="${c}" style="padding:10px 12px;color:#94a3b8;text-align:left;cursor:pointer;white-space:nowrap;user-select:none">${c.charAt(0).toUpperCase() + c.slice(1)}${sortIcon(c)}</th>`)
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${pageData.map((e) => `
            <tr style="border-bottom:1px solid #1e293b;transition:background 0.15s">
              <td style="padding:10px 12px;color:#64748b;font-family:monospace;font-size:11px">${e.id}</td>
              <td style="padding:10px 12px;color:#e2e8f0;font-weight:500">${e.name}</td>
              <td style="padding:10px 12px;color:#94a3b8">${e.type}</td>
              <td style="padding:10px 12px;color:#94a3b8">${e.date}</td>
              <td style="padding:10px 12px;color:#94a3b8">${e.location}</td>
              <td style="padding:10px 12px"><span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${statusColors[e.status] || "#64748b"}22;color:${statusColors[e.status] || "#64748b"}">${e.status}</span></td>
              <td style="padding:10px 12px"><span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${impactColors[e.impact] || "#64748b"}22;color:${impactColors[e.impact] || "#64748b"}">${e.impact}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
      <span style="color:#64748b;font-size:12px">Page ${page} of ${totalPages || 1}</span>
      <div style="display:flex;gap:6px">
        <button class="page-btn" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} style="padding:6px 12px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;cursor:pointer;font-size:12px">← Prev</button>
        ${Array.from({ length: totalPages }, (_, i) => `
          <button class="page-btn" data-page="${i + 1}" style="padding:6px 10px;background:${i + 1 === page ? "#38bdf8" : "#0f172a"};border:1px solid ${i + 1 === page ? "#38bdf8" : "#334155"};border-radius:6px;color:${i + 1 === page ? "#0f172a" : "#e2e8f0"};cursor:pointer;font-size:12px;font-weight:${i + 1 === page ? "700" : "400"}">${i + 1}</button>
        `).join("")}
        <button class="page-btn" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""} style="padding:6px 12px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;cursor:pointer;font-size:12px">Next →</button>
      </div>
    </div>
  `;

  // Event listeners
  container.querySelectorAll("[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const c = th.getAttribute("data-sort");
      if (STATE.eventsSort.col === c) {
        STATE.eventsSort.dir = STATE.eventsSort.dir === "asc" ? "desc" : "asc";
      } else {
        STATE.eventsSort = { col: c, dir: "asc" };
      }
      renderEventsTable();
    });
  });

  container.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = parseInt(btn.getAttribute("data-page"), 10);
      if (p >= 1 && p <= totalPages) { STATE.eventsPage = p; renderEventsTable(); }
    });
  });

  const searchInput = container.querySelector("#events-search");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      STATE.eventsSearch = searchInput.value;
      STATE.eventsPage = 1;
      renderEventsTable();
    }, 250));
  }

  // Hover effects
  container.querySelectorAll("tbody tr").forEach((row) => {
    row.addEventListener("mouseenter", () => { row.style.background = "rgba(56,189,248,0.06)"; });
    row.addEventListener("mouseleave", () => { row.style.background = ""; });
  });
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/* ----------------------------------------------------------------
   13. USER PROFILE DROPDOWN
   ---------------------------------------------------------------- */
function initProfileDropdown() {
  const avatar = document.getElementById("user-avatar") || document.querySelector(".user-avatar, .avatar");
  if (!avatar) return;

  avatar.style.cursor = "pointer";
  avatar.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleProfileDropdown();
  });

  document.addEventListener("click", () => {
    const dd = document.getElementById("profile-dropdown");
    if (dd) dd.remove();
  });
}

function toggleProfileDropdown() {
  let dd = document.getElementById("profile-dropdown");
  if (dd) { dd.remove(); return; }

  dd = document.createElement("div");
  dd.id = "profile-dropdown";
  Object.assign(dd.style, {
    position: "fixed", top: "60px", right: "16px", width: "220px",
    background: "#1e293b", border: "1px solid #334155", borderRadius: "12px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)", zIndex: "10001", fontFamily: "Inter,system-ui,sans-serif",
    overflow: "hidden",
  });

  const items = [
    { icon: "👤", label: "My Profile", action: () => showNotification("info", "Profile", "Opening your profile…") },
    { icon: "⚙️", label: "Preferences", action: () => switchToView("view-settings") },
    { icon: "❓", label: "Help & Support", action: () => showNotification("info", "Help", "Opening help center…") },
    { divider: true },
    { icon: "🚪", label: "Sign Out", action: () => showNotification("warning", "Sign Out", "You have been signed out."), danger: true },
  ];

  dd.innerHTML = `
    <div style="padding:16px;border-bottom:1px solid #334155">
      <strong style="color:#e2e8f0;font-size:14px;display:block">Rajesh Kumar</strong>
      <span style="color:#64748b;font-size:12px">Traffic Control — Admin</span>
    </div>
  `;

  items.forEach((item) => {
    if (item.divider) {
      const hr = document.createElement("div");
      hr.style.cssText = "border-top:1px solid #334155;margin:4px 0";
      dd.append(hr);
      return;
    }
    const btn = document.createElement("button");
    btn.style.cssText = `display:flex;align-items:center;gap:10px;width:100%;padding:10px 16px;background:none;border:none;color:${item.danger ? "#ef4444" : "#e2e8f0"};cursor:pointer;font-size:13px;text-align:left;transition:background 0.15s;font-family:inherit`;
    btn.innerHTML = `<span>${item.icon}</span> ${item.label}`;
    btn.addEventListener("mouseenter", () => { btn.style.background = "#334155"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = ""; });
    btn.addEventListener("click", () => { dd.remove(); item.action?.(); });
    dd.append(btn);
  });

  document.body.append(dd);
  dd.addEventListener("click", (e) => e.stopPropagation());
}

function switchToView(viewId) {
  const link = document.querySelector(`[data-view="${viewId}"]`);
  if (link) link.click();
}

/* ----------------------------------------------------------------
   14. DARK MODE TOGGLE
   ---------------------------------------------------------------- */
function initDarkMode() {
  // Apply stored preference
  if (STATE.darkMode) document.body.classList.add("dark-mode");

  const toggle = document.getElementById("dark-mode-toggle") || document.querySelector(".dark-mode-toggle, [data-dark-toggle]");
  if (toggle) {
    toggle.addEventListener("click", () => toggleDarkMode());
  }

  // Also look for a checkbox/switch
  const cb = document.getElementById("dark-mode-checkbox") || document.querySelector('input[name="dark-mode"]');
  if (cb && cb.type === "checkbox") {
    cb.checked = STATE.darkMode;
    cb.addEventListener("change", () => toggleDarkMode());
  }
}

function toggleDarkMode() {
  STATE.darkMode = !STATE.darkMode;
  document.body.classList.toggle("dark-mode", STATE.darkMode);
  localStorage.setItem("urbanflow-dark", STATE.darkMode);

  // Inject/update transition style
  if (!document.getElementById("dark-transition")) {
    const style = document.createElement("style");
    style.id = "dark-transition";
    style.textContent = `*{transition:background-color 0.3s ease,color 0.3s ease,border-color 0.3s ease!important}`;
    document.head.append(style);
    setTimeout(() => style.remove(), 500);
  }

  showNotification("info", "Theme Changed", STATE.darkMode ? "Dark mode enabled." : "Light mode enabled.");
}

/* ----------------------------------------------------------------
   15. INITIALIZATION
   ---------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  createCityMap();
  animateMetrics();
  initNotifications();
  populateResourceAllocation();
  initEventForm();
  initTimelineReplay();
  initFilters();
  initTables();
  initProfileDropdown();
  initDarkMode();
  initSmoothScroll();
  initHoverEffects();
  addRippleEffect(document.querySelectorAll(".btn, button[class*='btn']"));

  // Pre-populate impact forecast with a default event
  updateImpactForecast({ attendance: "35000", name: "Ganesh Chaturthi Procession" });

  // Welcome notification
  setTimeout(() => {
    showNotification("info", "Welcome to UrbanFlow", "Dashboard loaded. Monitoring 12 active events across 5 zones.");
  }, 1500);
});
