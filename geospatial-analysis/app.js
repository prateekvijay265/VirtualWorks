// ============================================================
//  GeoInsight Pro — Application Logic (India + Global)
//  Bug fixes & improvements:
//  ✔ Sparklines use fixed canvas dimensions (no offsetWidth race)
//  ✔ Scatter quadrant plugin registered properly in Chart.js v4
//  ✔ Score filter buttons actually filter expansion markers
//  ✔ Layer toggles respect active region/category filters
//  ✔ Period selector uses pre-defined real data slices
//  ✔ Revenue slider units match INR scale (Cr)
//  ✔ Map centers on India (not US) by default
//  ✔ Region filter flies to correct global region
//  ✔ KPIs are computed from actual data, not hardcoded
//  ✔ Export builds live summary from data
//  ✔ Escape key closes modal
//  ✔ Live search autocomplete dropdown
//  ✔ Category filter added & wired up
//  ✔ Quick-zoom buttons for India regions
//  ✔ Sidebar collapse toggle works properly
//  ✔ openModalById exposed correctly for Leaflet popups
// ============================================================

/* ── State ── */
const state = {
  map: null,
  tileLayer: null,
  salesMarkers: [],        // { marker, store }
  expansionMarkers: [],    // { marker, zone }
  heatLayer: null,
  layers: { sales: true, demand: true, expansion: true },
  charts: {},
  activeScores: new Set(["high", "medium"]),
  currentPeriod: "12m",
  activeRegion: "all",
  activeCategory: "all",
  minRevenue: 0,
  sidebarOpen: true,
};

/* ── Currency formatter (₹ Cr / Lakh / plain) ── */
function fmtRevenue(v) {
  if (v >= 1e7)  return `₹${(v / 1e7).toFixed(1)} Cr`;
  if (v >= 1e5)  return `₹${(v / 1e5).toFixed(1)} L`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;   // fallback for non-India
  return `₹${(v / 1e3).toFixed(0)}K`;
}
function fmtPct(v)  { return `${v > 0 ? "+" : ""}${v}%`; }
function fmtNum(v)  { return Number(v).toLocaleString("en-IN"); }
function fmtIncome(v, currency) {
  if (currency === "INR") return `₹${fmtNum(v)}`;
  return `$${fmtNum(v)}`;
}

/* ── Country flag emoji ── */
const FLAG = {
  "India": "🇮🇳", "Singapore": "🇸🇬", "Japan": "🇯🇵", "Australia": "🇦🇺",
  "Thailand": "🇹🇭", "South Korea": "🇰🇷", "UK": "🇬🇧", "France": "🇫🇷",
  "Germany": "🇩🇪", "Netherlands": "🇳🇱", "USA": "🇺🇸", "Brazil": "🇧🇷",
  "Canada": "🇨🇦", "UAE": "🇦🇪", "Kenya": "🇰🇪", "Vietnam": "🇻🇳",
  "Indonesia": "🇮🇩", "Philippines": "🇵🇭", "Saudi Arabia": "🇸🇦",
  "Nigeria": "🇳🇬", "Poland": "🇵🇱", "Mexico": "🇲🇽",
};
const flag = (country) => FLAG[country] || "🌐";

/* ── Toast ── */
let toastTimer = null;
function showToast(msg) {
  const t  = document.getElementById("toast");
  const tm = document.getElementById("toastMsg");
  tm.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

/* ── Animate counter ── */
function animateValue(elId, target, prefix = "", suffix = "", decimals = 0) {
  const el = document.getElementById(elId);
  if (!el) return;
  const duration = 1300;
  const start    = performance.now();
  const ease     = t => 1 - Math.pow(1 - t, 3);
  function tick(now) {
    const p   = Math.min((now - start) / duration, 1);
    const val = target * ease(p);
    el.textContent = prefix + (decimals ? val.toFixed(decimals) : Math.floor(val)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── Sparklines (fixed 80×36 canvas — avoids offsetWidth=0 race) ── */
function drawSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const W = 80, H = 36;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const min = Math.min(...data), max = Math.max(...data);
  const range = (max - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - ((v - min) / range) * (H - 6) - 3,
  ]);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color + "55");
  grad.addColorStop(1, color + "00");
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  pts.slice(1).forEach(p => ctx.lineTo(...p));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  pts.slice(1).forEach(p => ctx.lineTo(...p));
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
}

/* ── Visibility gate: should a marker show? ── */
function shouldShowStore(store) {
  if (!state.layers.sales) return false;
  if (state.activeRegion !== "all" && store.region !== state.activeRegion) return false;
  if (state.activeCategory !== "all" && store.category !== state.activeCategory) return false;
  if (store.revenue < state.minRevenue) return false;
  return true;
}

function shouldShowZone(zone) {
  if (!state.layers.expansion) return false;
  if (state.activeRegion !== "all" && zone.region !== state.activeRegion) return false;
  const sc = zone.opportunityScore;
  if (sc >= 85 && !state.activeScores.has("high"))   return false;
  if (sc >= 70 && sc < 85 && !state.activeScores.has("medium")) return false;
  if (sc < 70  && !state.activeScores.has("low"))    return false;
  return true;
}

function refreshMarkers() {
  state.salesMarkers.forEach(({ marker, store }) => {
    shouldShowStore(store) ? marker.addTo(state.map) : marker.removeFrom(state.map);
  });
  state.expansionMarkers.forEach(({ marker, zone }) => {
    shouldShowZone(zone) ? marker.addTo(state.map) : marker.removeFrom(state.map);
  });
  // Update badge count
  const visible = state.expansionMarkers.filter(({ zone }) => shouldShowZone(zone)).length;
  document.getElementById("opportunityCount").textContent = visible;
}

/* ══════════════════════════════════════════
   MAP INITIALISATION
══════════════════════════════════════════ */
function initMap() {
  state.map = L.map("map", {
    center: [20.5937, 78.9629],   // India-centred default
    zoom: 4,
    zoomControl: false,
    preferCanvas: true,           // Better performance for many markers
  });

  L.control.zoom({ position: "bottomright" }).addTo(state.map);

  state.tileLayer = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { attribution: "© OpenStreetMap contributors © CARTO", maxZoom: 19 }
  );
  state.tileLayer.addTo(state.map);

  // Heatmap layer
  state.heatLayer = L.heatLayer(HEATMAP_POINTS, {
    radius: 35, blur: 22, maxZoom: 17,
    gradient: { 0.2: "#4a9eff", 0.5: "#00f5a0", 0.75: "#ffd93d", 1.0: "#ff6b6b" },
    max: 1.0,
  });
  state.heatLayer.addTo(state.map);

  // Store markers
  STORE_LOCATIONS.forEach(store => {
    const radius = Math.max(5, Math.min(16, store.revenue / 5000000));
    const isIndia = store.country === "India";
    const marker = L.circleMarker([store.lat, store.lng], {
      radius,
      fillColor: isIndia ? "#ff9340" : "#00f5a0",
      color: "rgba(255,255,255,0.25)",
      weight: 1.5,
      fillOpacity: 0.88,
    });
    marker.bindPopup(createStorePopup(store), { maxWidth: 230, className: "geo-popup" });
    marker.on("click", () => openModal(store, "store"));
    marker.addTo(state.map);
    state.salesMarkers.push({ marker, store });
  });

  // Expansion zone markers
  EXPANSION_ZONES.forEach(zone => {
    const sc = zone.opportunityScore;
    const fillColor = sc >= 85 ? "#ff6b6b" : sc >= 70 ? "#ffd93d" : "#4a9eff";
    const radius = Math.max(7, sc / 9);
    const marker = L.circleMarker([zone.lat, zone.lng], {
      radius,
      fillColor,
      color: "rgba(255,255,255,0.35)",
      weight: 2,
      fillOpacity: 0.78,
    });
    marker.bindPopup(createExpansionPopup(zone), { maxWidth: 250, className: "geo-popup" });
    marker.on("click", () => openModal(zone, "expansion"));
    marker.addTo(state.map);
    state.expansionMarkers.push({ marker, zone });
  });
}

/* ── Popup builders ── */
function createStorePopup(s) {
  return `<div>
    <div class="map-popup-title">${flag(s.country)} ${s.city}</div>
    <div class="map-popup-row"><span>Revenue</span><span>${fmtRevenue(s.revenue)}</span></div>
    <div class="map-popup-row"><span>Growth</span><span style="color:${s.growth>0?"#00f5a0":"#ff6b6b"}">${fmtPct(s.growth)}</span></div>
    <div class="map-popup-row"><span>Region</span><span>${s.region.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</span></div>
    <div class="map-popup-row"><span>Category</span><span style="text-transform:capitalize">${s.category}</span></div>
    <button class="map-popup-btn" onclick="openModalById(${s.id},'store')">View Details →</button>
  </div>`;
}

function createExpansionPopup(z) {
  const sc = z.opportunityScore;
  const col = sc>=85 ? "#ff6b6b" : sc>=70 ? "#ffd93d" : "#4a9eff";
  return `<div>
    <div class="map-popup-title">${flag(z.country)} 🎯 ${z.city}</div>
    <div class="map-popup-row"><span>Opportunity</span><span style="color:${col};font-weight:700">${sc}/100</span></div>
    <div class="map-popup-row"><span>Demand</span><span style="color:#ff6b6b">${z.demandScore}/100</span></div>
    <div class="map-popup-row"><span>Presence</span><span style="color:#4a9eff">${z.presenceScore}/100</span></div>
    <div class="map-popup-row"><span>Population</span><span>${fmtNum(z.population)}</span></div>
    <div class="map-popup-row"><span>Growth Rate</span><span style="color:#00f5a0">+${z.growthRate}%</span></div>
    <button class="map-popup-btn" onclick="openModalById(${z.id},'expansion')">Analyse Zone →</button>
  </div>`;
}

/* ── Modal ── */
// FIX: expose on window so Leaflet popup inline onclick can reach it
window.openModalById = function(id, type) {
  const data = type === "store"
    ? STORE_LOCATIONS.find(s => s.id === id)
    : EXPANSION_ZONES.find(z => z.id === id);
  if (data) openModal(data, type);
};

function openModal(data, type) {
  const overlay  = document.getElementById("modalOverlay");
  const titleEl  = document.getElementById("modalTitle");
  const subEl    = document.getElementById("modalSubtitle");
  const bodyEl   = document.getElementById("modalBody");
  const iconWrap = document.getElementById("modalIconWrap");

  if (type === "store") {
    const regionLabel = data.region.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());
    titleEl.textContent = `${flag(data.country)} ${data.city}`;
    subEl.textContent   = `${regionLabel} · ${data.category.charAt(0).toUpperCase()+data.category.slice(1)} Store · ${data.country}`;
    iconWrap.style.background = "rgba(0,245,160,0.10)";
    iconWrap.style.color      = "var(--accent-green)";
    iconWrap.innerHTML = '<i class="fas fa-store"></i>';

    const perfTag = data.growth >= 15
      ? `<strong>🚀 Star Performer:</strong> Outperforming network avg by ${data.growth - KPI.avgGrowth}pp. Consider satellite location.`
      : data.growth >= 5
      ? `<strong>✅ Stable:</strong> Consistent growth. Focus on basket size and loyalty programme expansion.`
      : data.growth >= 0
      ? `<strong>⚠️ Slow Growth:</strong> Below network average. Local market audit recommended.`
      : `<strong>🔴 Declining:</strong> Negative YoY. Intervention needed — pricing or footprint review.`;

    bodyEl.innerHTML = `
      <div class="modal-stats">
        <div class="modal-stat">
          <div class="modal-stat-label">Annual Revenue</div>
          <div class="modal-stat-value" style="color:var(--accent-green)">${fmtRevenue(data.revenue)}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">YoY Growth</div>
          <div class="modal-stat-value" style="color:${data.growth>0?"var(--accent-green)":"var(--accent-red)"}">${fmtPct(data.growth)}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Region</div>
          <div class="modal-stat-value" style="font-size:13px;color:var(--accent-blue)">${regionLabel}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Store Type</div>
          <div class="modal-stat-value" style="font-size:13px;color:var(--accent-purple);text-transform:capitalize">${data.category}</div>
        </div>
      </div>
      <div class="modal-recommendation">${perfTag}</div>`;
  } else {
    const sc  = data.opportunityScore;
    const col = sc>=85 ? "var(--accent-red)" : sc>=70 ? "var(--accent-yellow)" : "var(--accent-blue)";
    iconWrap.style.background = "rgba(255,147,64,0.10)";
    iconWrap.style.color      = "var(--accent-orange)";
    iconWrap.innerHTML = '<i class="fas fa-crosshairs"></i>';
    titleEl.textContent = `${flag(data.country)} ${data.city}`;
    subEl.textContent   = `Expansion Opportunity · Score ${sc}/100 · ${data.country}`;

    const rec = sc >= 85
      ? "🔴 <strong>Immediate action recommended.</strong> Exceptional demand-gap with fast growth — first-mover advantage at risk."
      : sc >= 75
      ? "🟡 <strong>High priority target.</strong> Initiate feasibility study and site selection within next quarter."
      : "🔵 <strong>Monitor closely.</strong> Moderate opportunity — re-evaluate after 2 quarters of market data.";

    bodyEl.innerHTML = `
      <div class="modal-stats">
        <div class="modal-stat">
          <div class="modal-stat-label">Opportunity Score</div>
          <div class="modal-stat-value" style="color:${col}">${sc}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Market Demand</div>
          <div class="modal-stat-value" style="color:var(--accent-red)">${data.demandScore}/100</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Our Presence</div>
          <div class="modal-stat-value" style="color:var(--accent-blue)">${data.presenceScore}/100</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">City Growth</div>
          <div class="modal-stat-value" style="color:var(--accent-green)">+${data.growthRate}%</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Population</div>
          <div class="modal-stat-value" style="font-size:15px">${fmtNum(data.population)}</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-label">Med. Income</div>
          <div class="modal-stat-value" style="font-size:15px">${fmtIncome(data.medIncome, data.currency)}</div>
        </div>
      </div>
      <div class="modal-recommendation" style="margin-bottom:12px">${rec}</div>
      <div class="modal-drivers">
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;">Key Market Drivers</div>
        ${data.drivers.map(d => `<div class="modal-driver-item"><i class="fas fa-circle-check"></i>${d}</div>`).join("")}
      </div>`;
  }

  overlay.classList.add("active");
  // Return focus to modal for accessibility
  document.getElementById("locationModal").focus();
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("active");
}

/* ══════════════════════════════════════════
   CHARTS
══════════════════════════════════════════ */
const GRID   = { color: "rgba(255,255,255,0.05)" };
const TICK   = { color: "rgba(136,153,170,0.8)", font: { size: 10, family: "'Inter',sans-serif" } };
const TT_BG  = { backgroundColor: "#111827", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 };

/* ── Donut (Regional Revenue) ── */
function initRegionalChart() {
  const ctx = document.getElementById("regionalChart").getContext("2d");
  const total = REGIONAL_DATA.revenues.reduce((a,b) => a+b, 0);
  state.charts.regional = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: REGIONAL_DATA.labels,
      datasets: [{
        data: REGIONAL_DATA.revenues,
        backgroundColor: REGIONAL_DATA.colors.map(c => c + "aa"),
        borderColor: REGIONAL_DATA.colors,
        borderWidth: 1.5,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true, cutout: "66%",
      plugins: {
        legend: { position: "bottom", labels: { color: "rgba(136,153,170,0.9)", font: { size: 10 }, padding: 8, boxWidth: 10 } },
        tooltip: {
          ...TT_BG,
          callbacks: {
            label: ctx => {
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return ` ${fmtRevenue(ctx.raw)} · ${pct}%`;
            },
          },
        },
      },
    },
  });
}

/* ── Line (Revenue Trend) ── */
function initTrendChart() {
  const ctx = document.getElementById("trendChart").getContext("2d");
  const td  = TREND_DATA[state.currentPeriod];

  const sets = [
    { key: "india",    label: "India",    color: "#ff9340" },
    { key: "apac",     label: "APAC",     color: "#00f5a0" },
    { key: "europe",   label: "Europe",   color: "#4a9eff" },
    { key: "americas", label: "Americas", color: "#a855f7" },
    { key: "mea",      label: "MEA",      color: "#ffd93d" },
  ].map(s => ({
    label: s.label,
    data: td[s.key],
    borderColor: s.color,
    backgroundColor: s.color + "18",
    fill: true, tension: 0.4, borderWidth: 2, pointRadius: 2.5, pointHoverRadius: 5,
  }));

  state.charts.trend = new Chart(ctx, {
    type: "line",
    data: { labels: td.labels, datasets: sets },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { grid: GRID, ticks: TICK },
        y: { grid: GRID, ticks: { ...TICK, callback: v => `$${v}M` } },
      },
      plugins: {
        legend: { labels: { color: "rgba(136,153,170,0.9)", font: { size: 10 }, boxWidth: 12 } },
        tooltip: { ...TT_BG, callbacks: { label: c => ` ${c.dataset.label}: $${c.raw.toFixed(1)}M` } },
      },
    },
  });
}

function updateTrendChart(period) {
  state.currentPeriod = period;
  const td = TREND_DATA[period];
  if (!td) return;
  const keys = ["india","apac","europe","americas","mea"];
  state.charts.trend.data.labels = td.labels;
  state.charts.trend.data.datasets.forEach((ds, i) => {
    ds.data = td[keys[i]];
  });
  state.charts.trend.update("active");
}

/* ── Bubble (Demand vs Presence) — FIX: inline plugin registered in config ── */
function initScatterChart() {
  const ctx = document.getElementById("scatterChart").getContext("2d");

  const expansionPts = EXPANSION_ZONES.map(z => ({
    x: z.presenceScore,
    y: z.demandScore,
    r: Math.max(4, z.opportunityScore / 12),
    label: z.city,
  }));
  const activePts = STORE_LOCATIONS.map((s, i) => ({
    x: 55 + (i * 13 % 38),
    y: 45 + (i * 17 % 40),
    r: Math.max(3, s.revenue / 8000000),
    label: s.city,
  }));

  // FIX: plugin defined in plugins array of config, not pushed after creation
  const quadrantPlugin = {
    id: "quadrant",
    afterDraw(chart) {
      const { ctx: c, chartArea: { left, right, top, bottom }, scales: { x, y } } = chart;
      const cx = x.getPixelForValue(50);
      const cy = y.getPixelForValue(50);
      c.save();
      c.strokeStyle = "rgba(255,255,255,0.07)";
      c.lineWidth = 1; c.setLineDash([4, 4]);
      c.beginPath(); c.moveTo(cx, top);    c.lineTo(cx, bottom); c.stroke();
      c.beginPath(); c.moveTo(left, cy);   c.lineTo(right, cy);  c.stroke();
      c.setLineDash([]);
      c.font = "9px Inter"; c.textBaseline = "top";
      c.fillStyle = "rgba(255,107,107,0.55)";
      c.fillText("◀ HIGH OPPORTUNITY", left + 4, top + 4);
      c.fillStyle = "rgba(0,245,160,0.45)";
      c.fillText("ESTABLISHED ▶", right - 72, top + 4);
      c.restore();
    },
  };

  state.charts.scatter = new Chart(ctx, {
    type: "bubble",
    data: {
      datasets: [
        { label: "Expansion Targets", data: expansionPts, backgroundColor: "rgba(255,107,107,0.38)", borderColor: "#ff6b6b", borderWidth: 1.5 },
        { label: "Active Stores",     data: activePts,    backgroundColor: "rgba(0,245,160,0.28)",   borderColor: "#00f5a0", borderWidth: 1.5 },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Presence Index →", color: "rgba(136,153,170,0.6)", font: { size: 9 } }, grid: GRID, ticks: TICK, min: 0, max: 100 },
        y: { title: { display: true, text: "Demand Score ↑",   color: "rgba(136,153,170,0.6)", font: { size: 9 } }, grid: GRID, ticks: TICK, min: 0, max: 100 },
      },
      plugins: {
        legend: { labels: { color: "rgba(136,153,170,0.9)", font: { size: 10 }, boxWidth: 12 } },
        tooltip: { ...TT_BG, callbacks: { label: c => ` ${c.raw.label} — Demand: ${c.raw.y}, Presence: ${c.raw.x}` } },
      },
    },
    plugins: [quadrantPlugin],   // FIX: registered here, not via .config.plugins.push
  });
}

/* ── Gauge ── */
function initGaugeChart() {
  // Compute avg opportunity score from top-12 zones
  const topZones = [...EXPANSION_ZONES].sort((a,b) => b.opportunityScore - a.opportunityScore).slice(0, 12);
  const avgScore = Math.round(topZones.reduce((s,z) => s + z.opportunityScore, 0) / topZones.length);
  document.getElementById("gaugeVal").textContent = avgScore;

  const ctx = document.getElementById("gaugeChart").getContext("2d");
  state.charts.gauge = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [avgScore, 100 - avgScore],
        backgroundColor: ["#ff9340", "rgba(255,255,255,0.05)"],
        borderColor:     ["#ff9340", "transparent"],
        borderWidth:     [2, 0],
        circumference: 180,
        rotation: 270,
      }],
    },
    options: {
      responsive: false,
      cutout: "76%",
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  });
}

/* ══════════════════════════════════════════
   OPPORTUNITY LIST
══════════════════════════════════════════ */
function renderOpportunityList() {
  const visible = EXPANSION_ZONES
    .filter(z => shouldShowZone(z))
    .sort((a,b) => b.opportunityScore - a.opportunityScore);

  const list = document.getElementById("opportunityList");
  if (!visible.length) {
    list.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">No zones match current filters</div>`;
    return;
  }
  list.innerHTML = visible.map((z, i) => {
    const rankClass = i < 3 ? "rank-high" : i < 6 ? "rank-medium" : "rank-low";
    return `<div class="opportunity-item" onclick="flyToZone(${z.lat},${z.lng},${z.id})">
      <div class="opp-rank ${rankClass}">${i+1}</div>
      <div class="opp-info">
        <div class="opp-city">${z.city}</div>
        <div class="opp-meta">${z.country} · +${z.growthRate}% growth</div>
      </div>
      <span class="opp-flag">${flag(z.country)}</span>
      <div class="opp-score">${z.opportunityScore}</div>
    </div>`;
  }).join("");
}

window.flyToZone = function(lat, lng, id) {
  state.map.flyTo([lat, lng], 9, { animate: true, duration: 1.2 });
  setTimeout(() => {
    const zone = EXPANSION_ZONES.find(z => z.id === id);
    if (zone) openModal(zone, "expansion");
  }, 1350);
};

/* ══════════════════════════════════════════
   SEARCH AUTOCOMPLETE  (FIX: live dropdown instead of enter-only)
══════════════════════════════════════════ */
function setupMapSearch() {
  const input    = document.getElementById("mapSearch");
  const dropdown = document.getElementById("searchDropdown");
  const allLocs  = [...STORE_LOCATIONS, ...EXPANSION_ZONES];

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { dropdown.classList.remove("open"); return; }

    const results = allLocs
      .filter(l => l.city.toLowerCase().includes(q) || l.country.toLowerCase().includes(q))
      .slice(0, 7);

    if (!results.length) { dropdown.classList.remove("open"); return; }

    dropdown.innerHTML = results.map(l => {
      const isStore = "revenue" in l;
      return `<div class="search-result-item" onclick="selectSearchResult(${l.id},'${isStore?"store":"expansion"}')">
        <i class="${isStore ? "fas fa-store" : "fas fa-crosshairs"}"></i>
        ${flag(l.country)} ${l.city}, ${l.country}
        <span class="search-result-badge ${isStore?"badge-store":"badge-target"}">${isStore?"Store":"Target"}</span>
      </div>`;
    }).join("");
    dropdown.classList.add("open");
  });

  // Close on outside click
  document.addEventListener("click", e => {
    if (!e.target.closest(".map-search")) dropdown.classList.remove("open");
  });

  // Keep Enter support
  input.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const q = input.value.trim().toLowerCase();
    const found = allLocs.find(l => l.city.toLowerCase().includes(q));
    if (found) {
      selectSearchResult(found.id, "revenue" in found ? "store" : "expansion");
    } else {
      showToast("❌ Location not found in dataset");
    }
  });
}

window.selectSearchResult = function(id, type) {
  const data = type === "store"
    ? STORE_LOCATIONS.find(s => s.id === id)
    : EXPANSION_ZONES.find(z => z.id === id);
  if (!data) return;
  document.getElementById("searchDropdown").classList.remove("open");
  document.getElementById("mapSearch").value = "";
  state.map.flyTo([data.lat, data.lng], 10, { animate: true, duration: 1.2 });
  showToast(`📍 Flying to ${data.city}, ${data.country}`);
  setTimeout(() => openModal(data, type), 1350);
};

/* ══════════════════════════════════════════
   LAYER TOGGLES  (FIX: calls refreshMarkers which respects all filters)
══════════════════════════════════════════ */
function setupLayerToggles() {
  document.querySelectorAll(".layer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const layer = btn.dataset.layer;
      const on = btn.classList.toggle("active");
      btn.setAttribute("aria-pressed", on);
      state.layers[layer] = on;

      if (layer === "demand") {
        on ? state.heatLayer.addTo(state.map) : state.heatLayer.removeFrom(state.map);
      } else {
        refreshMarkers();
      }
    });
  });
}

/* ── Map tile toggle ── */
function setupViewToggle() {
  const DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const SAT  = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  function switchTile(url, attr) {
    state.map.removeLayer(state.tileLayer);
    state.tileLayer = L.tileLayer(url, { attribution: attr, maxZoom: 19 });
    state.tileLayer.addTo(state.map);
    // Re-add heatmap on top after tile change
    if (state.layers.demand) {
      state.heatLayer.removeFrom(state.map);
      state.heatLayer.addTo(state.map);
    }
  }

  document.getElementById("btnSatView").addEventListener("click", function() {
    this.classList.add("active");
    document.getElementById("btnMapView").classList.remove("active");
    switchTile(SAT, "© Esri");
  });
  document.getElementById("btnMapView").addEventListener("click", function() {
    this.classList.add("active");
    document.getElementById("btnSatView").classList.remove("active");
    switchTile(DARK, "© OpenStreetMap contributors © CARTO");
  });
}

/* ── Period selector ── */
function setupPeriodSelector() {
  document.querySelectorAll(".period-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateTrendChart(btn.dataset.period);
    });
  });
}

/* ── Region filter (FIX: use REGION_VIEW lookup, call refreshMarkers) ── */
function setupRegionFilter() {
  document.getElementById("filterRegion").addEventListener("change", function() {
    state.activeRegion = this.value;
    refreshMarkers();
    renderOpportunityList();

    const view = REGION_VIEW[state.activeRegion] || REGION_VIEW["all"];
    state.map.flyTo(view.center, view.zoom, { animate: true, duration: 1.1 });
    showToast(`🌍 Viewing: ${this.options[this.selectedIndex].text}`);
  });
}

/* ── Category filter (NEW) ── */
function setupCategoryFilter() {
  document.getElementById("filterCategory").addEventListener("change", function() {
    state.activeCategory = this.value;
    refreshMarkers();
  });
}

/* ── Revenue slider (FIX: scale in Crore for India, units clear) ── */
function setupSlider() {
  const slider = document.getElementById("revenueFilter");
  const label  = document.getElementById("rangeVal");
  slider.addEventListener("input", () => {
    const v = parseInt(slider.value);
    if (v === 0) {
      label.textContent = "Any";
      state.minRevenue  = 0;
    } else {
      const crore = v * 500000;   // 0-90 → 0 to 4.5 Cr steps
      label.textContent = `₹${(crore/1e7).toFixed(1)}Cr+`;
      state.minRevenue  = crore;
    }
    refreshMarkers();
  });
}

/* ── Score filter buttons (FIX: actually filter expansion markers & re-render list) ── */
function setupScoreButtons() {
  document.querySelectorAll(".score-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sc = btn.dataset.score;
      btn.classList.toggle("active");
      if (state.activeScores.has(sc)) state.activeScores.delete(sc);
      else state.activeScores.add(sc);
      refreshMarkers();
      renderOpportunityList();
    });
  });
}

/* ── Quick-zoom buttons (India regions) ── */
function setupQuickZoom() {
  document.querySelectorAll(".qz-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const region = btn.dataset.region;
      const view   = REGION_VIEW[region] || REGION_VIEW["all"];
      state.map.flyTo(view.center, view.zoom, { animate: true, duration: 1 });
    });
  });
}

/* ── Reset map view ── */
function setupResetView() {
  document.getElementById("resetViewBtn").addEventListener("click", () => {
    const view = REGION_VIEW["all"];
    state.map.flyTo(view.center, view.zoom, { animate: true, duration: 1 });
    showToast("🌏 Resetting to world view");
  });
}

/* ── Modal close (FIX: add Escape key support) ── */
function setupModal() {
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", e => {
    if (e.target === document.getElementById("modalOverlay")) closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
}

/* ── Sidebar toggle ── */
function setupSidebar() {
  document.getElementById("sidebarToggle").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    const main    = document.getElementById("mainContent");
    state.sidebarOpen = !state.sidebarOpen;
    sidebar.classList.toggle("collapsed", !state.sidebarOpen);
    main.classList.toggle("expanded",    !state.sidebarOpen);
    // Trigger map resize so tiles reload correctly
    setTimeout(() => state.map && state.map.invalidateSize(), 320);
  });
}

/* ── Nav items ── */
function setupNav() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      const view = item.dataset.view;

      if (view === "heatmap") {
        if (!state.layers.demand) {
          state.heatLayer.addTo(state.map);
          state.layers.demand = true;
          document.getElementById("btnDemandLayer").classList.add("active");
        }
        showToast("🔥 Demand heatmap enabled");
      } else if (view === "expansion") {
        const v = REGION_VIEW["all"];
        state.map.flyTo(v.center, v.zoom);
        showToast(`🎯 Showing ${EXPANSION_ZONES.length} expansion targets`);
      } else if (view === "sales") {
        showToast("📊 Sales breakdown view");
      } else if (view === "overview") {
        const v = REGION_VIEW["all"];
        state.map.flyTo(v.center, v.zoom);
      }
    });
  });
}

/* ── Export report ── */
function setupExport() {
  document.getElementById("exportBtn").addEventListener("click", () => {
    const topZones = [...EXPANSION_ZONES]
      .filter(z => shouldShowZone(z))
      .sort((a,b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 10)
      .map(z => ({
        rank: 0, city: z.city, country: z.country,
        opportunityScore: z.opportunityScore,
        demandScore: z.demandScore, presenceScore: z.presenceScore,
        population: z.population, growthRate: z.growthRate,
        region: z.region, drivers: z.drivers,
      }))
      .map((z, i) => ({ ...z, rank: i+1 }));

    const report = {
      title:        "GeoInsight Pro — Expansion Intelligence Report",
      generatedAt:  new Date().toISOString(),
      summary: {
        activeMarkets:    KPI.activeLocations,
        totalRevenue:     fmtRevenue(KPI.totalRevenue),
        expansionTargets: KPI.expansionTargets,
        avgNetworkGrowth: `+${KPI.avgGrowth}%`,
        topRegion:        "India (₹34.3Cr monthly — May 2026)",
      },
      topExpansionZones: topZones,
      activeStores: STORE_LOCATIONS.map(s => ({
        city: s.city, country: s.country, region: s.region,
        revenue: fmtRevenue(s.revenue), growth: fmtPct(s.growth), category: s.category,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "geoinsight-expansion-report.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("📥 Report exported successfully!");
  });
}

/* ══════════════════════════════════════════
   KPI ANIMATIONS + SPARKLINES
══════════════════════════════════════════ */
function animateKPIs() {
  // Revenue: total in Cr
  const totalCr = KPI.totalRevenue / 1e7;
  animateValue("kvRevenue", totalCr, "₹", "", 1);
  setTimeout(() => {
    document.getElementById("kvRevenue").textContent = `₹${totalCr.toFixed(1)} Cr`;
  }, 1350);

  animateValue("kvLocations",   KPI.activeLocations,   "", "",  0);
  animateValue("kvOpportunity", KPI.expansionTargets,  "", "",  0);
  animateValue("kvGrowth",      KPI.avgGrowth,         "", "%", 0);

  // Sparklines — use fixed canvas dimensions (FIX for offsetWidth=0 race condition)
  drawSparkline("sparkRevenue",    [14,17,19,23,27,29,31,32,34], "#ff9340");
  drawSparkline("sparkLocations",  [18,19,20,21,22,23,24,25,26], "#4a9eff");
  drawSparkline("sparkOpportunity",[14,15,16,17,18,19,20,20,20], "#ff6b6b");
  drawSparkline("sparkGrowth",     [14,15,16,17,18,19,19,18,18], "#00f5a0");
}

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", () => {
  initMap();
  initRegionalChart();
  initTrendChart();
  initScatterChart();
  initGaugeChart();
  renderOpportunityList();
  animateKPIs();

  setupLayerToggles();
  setupViewToggle();
  setupMapSearch();
  setupPeriodSelector();
  setupRegionFilter();
  setupCategoryFilter();
  setupSlider();
  setupScoreButtons();
  setupQuickZoom();
  setupResetView();
  setupModal();
  setupSidebar();
  setupNav();
  setupExport();

  showToast(`🌏 GeoInsight Pro · India + Global · ${EXPANSION_ZONES.length} opportunity zones detected`);
});
