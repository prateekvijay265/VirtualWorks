/* ============================================================
   TRAFFICIQ — APP LOGIC
   ============================================================ */

'use strict';

// ── Utility helpers ──
const fmt = (n) => n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n.toString();
const fmtFull = (n) => n.toLocaleString();

// ── Chart.js global defaults ──
Chart.defaults.color = '#8892a4';
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.font.size = 11.5;

// ── Dataset: 30-day daily traffic ──
const DAYS = Array.from({length: 30}, (_, i) => {
  const d = new Date(2026, 3, 26); d.setDate(d.getDate() + i);
  return d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
});

const genSeries = (base, variance, trend = 0) =>
  DAYS.map((_, i) => Math.round(base + trend * i + (Math.random() - 0.4) * variance));

const DATA = {
  pageviews:    genSeries(90000, 25000, 600),
  sessions:     genSeries(16000, 5000, 200),
  newUsers:     genSeries(10000, 3500, 150),
  bounceRates:  genSeries(40, 8, -0.1),
  duration:     genSeries(260, 40, 0.5),
};

// ── Sparkline helper ──
function drawSparkline(canvasId, data, color) {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  const grad = ctx.createLinearGradient(0, 0, 0, 44);
  grad.addColorStop(0, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
  grad.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data,
      datasets: [{
        data,
        borderColor: color,
        borderWidth: 1.5,
        fill: true,
        backgroundColor: grad,
        tension: 0.4,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: { duration: 1000 }
    }
  });
}

// ── Animate counting up ──
function animateCount(el, target) {
  const start = performance.now();
  const duration = 1800;
  const isTime = el.classList.contains('kpi-time');
  const isPct = el.classList.contains('kpi-percent');
  if (isTime || isPct) return; // static values

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = Math.round(target * ease);
    el.textContent = fmt(val);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = fmt(target);
  }
  requestAnimationFrame(update);
}

// ── Traffic Trends Chart ──
function buildTrafficChart() {
  const ctx = document.getElementById('trafficChart')?.getContext('2d');
  if (!ctx) return;

  const blueGrad = ctx.createLinearGradient(0, 0, 0, 280);
  blueGrad.addColorStop(0, 'rgba(59,130,246,0.2)');
  blueGrad.addColorStop(1, 'rgba(59,130,246,0)');

  const purpleGrad = ctx.createLinearGradient(0, 0, 0, 280);
  purpleGrad.addColorStop(0, 'rgba(168,85,247,0.15)');
  purpleGrad.addColorStop(1, 'rgba(168,85,247,0)');

  const tealGrad = ctx.createLinearGradient(0, 0, 0, 280);
  tealGrad.addColorStop(0, 'rgba(20,184,166,0.15)');
  tealGrad.addColorStop(1, 'rgba(20,184,166,0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: DAYS,
      datasets: [
        {
          label: 'Page Views',
          data: DATA.pageviews,
          borderColor: '#3b82f6',
          backgroundColor: blueGrad,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#3b82f6',
        },
        {
          label: 'Sessions',
          data: DATA.sessions,
          borderColor: '#a855f7',
          backgroundColor: purpleGrad,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#a855f7',
        },
        {
          label: 'New Users',
          data: DATA.newUsers,
          borderColor: '#14b8a6',
          backgroundColor: tealGrad,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#14b8a6',
        },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,18,32,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${fmtFull(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { maxTicksLimit: 10 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: (v) => fmt(v) }
        }
      },
      animation: { duration: 1200, easing: 'easeOutQuart' }
    }
  });
}

// ── Device Donut Chart ──
function buildDeviceChart() {
  const ctx = document.getElementById('deviceChart')?.getContext('2d');
  if (!ctx) return;

  const deviceData = [
    { label: 'Desktop', value: 43, color: '#3b82f6' },
    { label: 'Mobile', value: 48, color: '#a855f7' },
    { label: 'Tablet', value: 9, color: '#14b8a6' },
  ];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: deviceData.map(d => d.label),
      datasets: [{
        data: deviceData.map(d => d.value),
        backgroundColor: deviceData.map(d => d.color),
        borderWidth: 2,
        borderColor: '#111827',
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,18,32,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: { label: (c) => ` ${c.label}: ${c.raw}%` }
        }
      },
      animation: { animateRotate: true, duration: 1200 }
    }
  });

  // Build custom legend
  const legend = document.getElementById('device-legend');
  if (legend) {
    legend.innerHTML = deviceData.map(d => `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:10px;height:10px;border-radius:50%;background:${d.color};flex-shrink:0"></div>
          <span style="font-size:12px;color:#8892a4">${d.label}</span>
        </div>
        <span style="font-size:13px;font-weight:700;color:#f0f4ff">${d.value}%</span>
      </div>
    `).join('');
  }
}

// ── Traffic Sources Bar Chart ──
function buildSourceChart() {
  const ctx = document.getElementById('sourceChart')?.getContext('2d');
  if (!ctx) return;

  const sources = ['Organic', 'Direct', 'Social', 'Referral', 'Email', 'Paid'];
  const vals = [38, 24, 17, 11, 6, 4];
  const colors = ['#3b82f6','#a855f7','#14b8a6','#f97316','#22c55e','#f59e0b'];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sources,
      datasets: [{
        data: vals,
        backgroundColor: colors.map(c => c + '33'),
        borderColor: colors,
        borderWidth: 1.5,
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,18,32,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: { label: (c) => ` ${c.raw}% of traffic` }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } },
        y: { grid: { display: false } }
      },
      animation: { duration: 1000 }
    }
  });
}

// ── Session Depth Chart ──
function buildDepthChart() {
  const ctx = document.getElementById('depthChart')?.getContext('2d');
  if (!ctx) return;

  const labels = ['1 page', '2 pages', '3 pages', '4 pages', '5+ pages'];
  const vals = [38, 26, 17, 11, 8];

  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(20,184,166,0.6)');
  grad.addColorStop(1, 'rgba(20,184,166,0.1)');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: vals,
        backgroundColor: grad,
        borderColor: '#14b8a6',
        borderWidth: 1.5,
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,18,32,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: { label: (c) => ` ${c.raw}% of sessions` }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } }
      },
      animation: { duration: 1000 }
    }
  });
}

// ── Funnel ──
function buildFunnel() {
  const container = document.getElementById('funnelContainer');
  if (!container) return;

  const steps = [
    { label: 'Landing Page',   count: 483201, pct: 100,  drop: null,  color: '#3b82f6' },
    { label: 'Product View',   count: 318512, pct: 65.9, drop: -34.1, color: '#6366f1' },
    { label: 'Add to Cart',    count: 178965, pct: 37.0, drop: -28.9, color: '#a855f7' },
    { label: 'Checkout Start', count: 96843,  pct: 20.0, drop: -17.0, color: '#ec4899' },
    { label: 'Payment',        count: 61204,  pct: 12.7, drop: -7.3,  color: '#f97316' },
    { label: 'Conversion',     count: 48821,  pct: 10.1, drop: -2.6,  color: '#22c55e' },
  ];

  container.innerHTML = steps.map((s, i) => `
    <div class="funnel-step">
      <div class="funnel-label">${s.label}</div>
      <div class="funnel-bar-track">
        <div class="funnel-bar-fill" data-pct="${s.pct}" style="background: linear-gradient(90deg, ${s.color}99, ${s.color});">
          ${s.pct.toFixed(1)}%
        </div>
      </div>
      <div class="funnel-count">${fmt(s.count)}</div>
      <div class="funnel-drop ${s.drop === null || s.drop > -5 ? 'good' : ''}">
        ${s.drop === null ? '—' : `▼ ${Math.abs(s.drop).toFixed(1)}%`}
      </div>
    </div>
  `).join('');

  // Animate fills after DOM is ready
  setTimeout(() => {
    container.querySelectorAll('.funnel-bar-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
  }, 200);
}

// ── Journey Paths ──
function buildJourneyPaths() {
  const container = document.getElementById('journeyPaths');
  if (!container) return;

  const paths = [
    {
      steps: ['Home', 'Products', 'Product Detail', 'Cart', 'Checkout'],
      sessions: '42,311', convRate: '8.2%', avgTime: '6m 14s',
    },
    {
      steps: ['Blog Post', 'Home', 'Pricing', 'Signup'],
      sessions: '28,907', convRate: '12.4%', avgTime: '4m 48s',
    },
    {
      steps: ['Search', 'Product Detail', 'Cart'],
      sessions: '19,422', convRate: '5.1%', avgTime: '2m 33s',
    },
    {
      steps: ['Ads Landing', 'Pricing', 'Demo Request'],
      sessions: '14,089', convRate: '18.7%', avgTime: '3m 21s',
    },
    {
      steps: ['Home', 'About', 'Contact'],
      sessions: '8,943', convRate: '1.2%', avgTime: '1m 58s',
    },
  ];

  container.innerHTML = paths.map(p => `
    <div class="journey-path">
      <div class="journey-path-steps">
        ${p.steps.map((s, i) => `
          ${i > 0 ? '<span class="path-arrow">›</span>' : ''}
          <span class="path-step">${s}</span>
        `).join('')}
      </div>
      <div class="journey-path-meta">
        <span>👥 ${p.sessions} sessions</span>
        <span>🎯 ${p.convRate} conv.</span>
        <span>⏱ ${p.avgTime}</span>
      </div>
    </div>
  `).join('');
}

// ── Heatmap ──
function buildHeatmap() {
  const wrapper = document.getElementById('heatmapWrapper');
  if (!wrapper) return;

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({length: 24}, (_, i) => i);

  // Generate synthetic traffic data
  const heatData = days.map((_, di) =>
    hours.map((h) => {
      const weekday = di < 5;
      let base = weekday ? 60 : 30;
      if (h >= 9 && h <= 17) base += weekday ? 35 : 15;
      if (h >= 12 && h <= 13) base += 10;
      if (h < 5 || h > 22) base -= 30;
      return Math.max(5, Math.round(base + (Math.random() - 0.5) * 25));
    })
  );

  const max = Math.max(...heatData.flat());

  const grid = document.createElement('div');
  grid.className = 'heatmap-grid';

  // Header row (hours)
  grid.appendChild(Object.assign(document.createElement('div'), { style: 'grid-column:1' }));
  hours.forEach(h => {
    const lbl = Object.assign(document.createElement('div'), {
      className: 'heatmap-hour-label',
      textContent: h % 4 === 0 ? h + 'h' : ''
    });
    grid.appendChild(lbl);
  });

  // Data rows
  days.forEach((day, di) => {
    const lbl = Object.assign(document.createElement('div'), {
      className: 'heatmap-label',
      textContent: day
    });
    grid.appendChild(lbl);

    hours.forEach((h) => {
      const val = heatData[di][h];
      const intensity = val / max;
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';

      const alpha = 0.08 + intensity * 0.85;
      const hue = intensity > 0.6 ? `rgba(99,102,241,${alpha})` : `rgba(59,130,246,${alpha})`;
      cell.style.background = hue;
      cell.title = `${day} ${h}:00 — ${Math.round(val * 200)} visits`;
      grid.appendChild(cell);
    });
  });

  wrapper.appendChild(grid);
}

// ── Geo Distribution ──
function buildGeo() {
  const list = document.getElementById('geoList');
  if (!list) return;

  const countries = [
    { flag: '🇺🇸', name: 'United States', pct: 32.4 },
    { flag: '🇬🇧', name: 'United Kingdom', pct: 14.8 },
    { flag: '🇩🇪', name: 'Germany', pct: 11.2 },
    { flag: '🇨🇦', name: 'Canada', pct: 9.7 },
    { flag: '🇦🇺', name: 'Australia', pct: 7.3 },
    { flag: '🇫🇷', name: 'France', pct: 6.1 },
    { flag: '🇮🇳', name: 'India', pct: 5.8 },
    { flag: '🇯🇵', name: 'Japan', pct: 4.2 },
    { flag: '🇧🇷', name: 'Brazil', pct: 3.9 },
    { flag: '🇸🇬', name: 'Singapore', pct: 4.6 },
  ];

  list.innerHTML = countries.map(c => `
    <div class="geo-item">
      <div class="geo-flag">${c.flag}</div>
      <div class="geo-info">
        <div class="geo-country">${c.name}</div>
        <div class="geo-bar-track">
          <div class="geo-bar-fill" data-pct="${c.pct}" style="width:0%"></div>
        </div>
      </div>
      <div class="geo-pct">${c.pct}%</div>
    </div>
  `).join('');

  setTimeout(() => {
    list.querySelectorAll('.geo-bar-fill').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
  }, 300);
}

// ── Top Pages Table ──
const PAGES_DATA = [
  { page: '/', views: 847203, duration: '2m 14s', bounce: '28.4%', exit: '12.1%', score: 92 },
  { page: '/products', views: 542119, duration: '4m 38s', bounce: '31.2%', exit: '18.4%', score: 85 },
  { page: '/blog/web-analytics', views: 321047, duration: '6m 12s', bounce: '22.8%', exit: '35.7%', score: 78 },
  { page: '/pricing', views: 298431, duration: '3m 55s', bounce: '42.1%', exit: '24.9%', score: 71 },
  { page: '/about', views: 187652, duration: '1m 48s', bounce: '55.3%', exit: '46.2%', score: 55 },
  { page: '/contact', views: 154338, duration: '1m 22s', bounce: '61.4%', exit: '58.1%', score: 48 },
  { page: '/features', views: 132809, duration: '5m 01s', bounce: '25.9%', exit: '21.3%', score: 88 },
  { page: '/blog', views: 118472, duration: '3m 28s', bounce: '36.7%', exit: '29.4%', score: 74 },
  { page: '/docs', views: 104291, duration: '7m 44s', bounce: '18.3%', exit: '14.8%', score: 95 },
  { page: '/signup', views: 87634, duration: '2m 56s', bounce: '44.8%', exit: '38.6%', score: 63 },
  { page: '/case-studies', views: 61204, duration: '8m 22s', bounce: '16.1%', exit: '22.5%', score: 91 },
  { page: '/integrations', views: 48821, duration: '4m 17s', bounce: '33.5%', exit: '27.9%', score: 80 },
];

let sortCol = 'views', sortAsc = false, filterQuery = '';

function getScoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function renderTable() {
  const tbody = document.getElementById('pagesTableBody');
  if (!tbody) return;

  const filtered = PAGES_DATA.filter(p =>
    p.page.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (typeof av === 'string') {
      av = parseFloat(av); bv = parseFloat(bv);
      if (isNaN(av)) { av = a[sortCol]; bv = b[sortCol]; }
    }
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  tbody.innerHTML = sorted.map(p => {
    const scoreColor = getScoreColor(p.score);
    return `
      <tr>
        <td><span class="page-url">${p.page}</span></td>
        <td><span class="views-val">${fmtFull(p.views)}</span></td>
        <td>${p.duration}</td>
        <td>${p.bounce}</td>
        <td>${p.exit}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="perf-bar">
              <div class="perf-fill" style="width:${p.score}%;background:${scoreColor}"></div>
            </div>
            <span style="font-size:12px;font-weight:600;color:${scoreColor}">${p.score}</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Nav highlight on scroll ──
function setupNavScroll() {
  const sections = ['overview','traffic','behavior','journey','pages'];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        sections.forEach(id => {
          const nav = document.getElementById('nav-' + id);
          if (nav) nav.classList.remove('active');
        });
        const nav = document.getElementById('nav-' + e.target.id);
        if (nav) nav.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

// ── Toast ──
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Period buttons ──
function setupPeriodButtons() {
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showToast(`📊 Switched to ${btn.dataset.period.toUpperCase()} view`);
    });
  });
}

// ── Table sort + filter ──
function setupTable() {
  document.querySelectorAll('.pages-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (sortCol === col) sortAsc = !sortAsc;
      else { sortCol = col; sortAsc = false; }
      document.querySelectorAll('.sort-icon').forEach(i => i.textContent = '↕');
      th.querySelector('.sort-icon').textContent = sortAsc ? '↑' : '↓';
      renderTable();
    });
  });

  const searchInput = document.getElementById('pageSearch');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      filterQuery = e.target.value;
      renderTable();
    });
  }
}

// ── Smooth nav scrolling ──
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const target = item.getAttribute('href');
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── Export button ──
function setupExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    showToast('📥 Report exported as CSV');
  });
}

// ── Init ──
function init() {
  // Sparklines
  const spark30 = DATA.pageviews.slice(-14);
  drawSparkline('sparkline-pageviews', spark30, 'rgb(59,130,246)');
  drawSparkline('sparkline-sessions', DATA.sessions.slice(-14), 'rgb(168,85,247)');
  drawSparkline('sparkline-duration', DATA.duration.slice(-14), 'rgb(20,184,166)');
  drawSparkline('sparkline-bounce', DATA.bounceRates.slice(-14), 'rgb(249,115,22)');

  // Animate KPI counts
  document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
    animateCount(el, parseInt(el.dataset.target));
  });

  // Charts
  buildTrafficChart();
  buildDeviceChart();
  buildSourceChart();
  buildDepthChart();

  // Funnel & Journey
  buildFunnel();
  buildJourneyPaths();

  // Heatmap & Geo
  buildHeatmap();
  buildGeo();

  // Table
  renderTable();
  setupTable();

  // UI
  setupNavScroll();
  setupPeriodButtons();
  setupNav();
  setupExport();

  // Entrance animations
  const cards = document.querySelectorAll('.kpi-card, .chart-card, .funnel-chart-card, .journey-map-card, .table-card');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(c => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(20px)';
      c.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      io.observe(c);
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
