/* ============================================================
   InsightPulse Dashboard — app.js
   ============================================================ */

'use strict';

/* ---- Global Chart.js Defaults ---- */
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.display = false;
Chart.defaults.plugins.tooltip.backgroundColor = '#1c2540';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(99,102,241,0.4)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
Chart.defaults.plugins.tooltip.cornerRadius = 8;

/* ---- Palette ---- */
const C = {
  accent:    '#6366f1',
  violet:    '#a78bfa',
  emerald:   '#10b981',
  rose:      '#f43f5e',
  amber:     '#f59e0b',
  sky:       '#38bdf8',
  pink:      '#ec4899',
  teal:      '#14b8a6',
  orange:    '#f97316',
  grad: (a, b) => {
    const ctx = document.createElement('canvas').getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    return g;
  }
};

/* ============================================================
   NAVIGATION
   ============================================================ */
const navItems = document.querySelectorAll('.nav-item');
const pages    = document.querySelectorAll('.page');
const breadcrumb = document.getElementById('breadcrumbText');
const sidebar  = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');

let currentPage = 'overview';

function navigateTo(page) {
  if (currentPage === page) return;
  currentPage = page;

  navItems.forEach(n => n.classList.toggle('active', n.dataset.page === page));
  pages.forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  breadcrumb.textContent = page.charAt(0).toUpperCase() + page.slice(1);

  // Lazy-init page charts
  if (page === 'revenue' && !chartsInit.revenue) { initRevenueCharts(); chartsInit.revenue = true; }
  if (page === 'customers' && !chartsInit.customers) { initCustomerCharts(); chartsInit.customers = true; }
  if (page === 'products' && !chartsInit.products) { initProductCharts(); chartsInit.products = true; }
  if (page === 'analytics' && !chartsInit.analytics) { initAnalyticsCharts(); chartsInit.analytics = true; }

  // Close sidebar on mobile after nav
  if (window.innerWidth <= 820) sidebar.classList.remove('open');
}

const chartsInit = { revenue: false, customers: false, products: false, analytics: false };

navItems.forEach(n => n.addEventListener('click', e => { e.preventDefault(); navigateTo(n.dataset.page); }));

menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

// Close sidebar clicking outside on mobile
document.addEventListener('click', e => {
  if (window.innerWidth <= 820 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg = 'Done!') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.getElementById('exportBtn').addEventListener('click', () => showToast('Dashboard exported successfully!'));
document.getElementById('notifBtn').addEventListener('click', () => showToast('3 new alerts — all systems nominal'));
document.getElementById('viewAllBtn')?.addEventListener('click', () => showToast('Opening full transaction log…'));

document.getElementById('timeRange').addEventListener('change', function () {
  showToast(`Refreshed for: ${this.options[this.selectedIndex].text}`);
});

/* ============================================================
   KPI COUNTER ANIMATIONS
   ============================================================ */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const isFloat = target % 1 !== 0;
  const isCurrency = el.textContent.startsWith('$') || target > 10000;
  const duration = 1600;
  const start = performance.now();

  function fmt(v) {
    if (isFloat) return v.toFixed(2) + suffix;
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(2) + 'M';
    if (v >= 1_000 && isCurrency) return '$' + Math.round(v).toLocaleString();
    return Math.round(v).toLocaleString() + suffix;
  }

  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(ease * target);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.querySelectorAll('.kpi-value[data-target]').forEach(el => {
  const ob = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateCounter(el); ob.disconnect(); }
  }, { threshold: 0.3 });
  ob.observe(el);
});

/* ============================================================
   SPARKLINE HELPER
   ============================================================ */
function sparkline(id, data, color) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{ data, borderColor: color, borderWidth: 2, tension: 0.4,
        fill: true,
        backgroundColor: (() => {
          const g = ctx.getContext('2d').createLinearGradient(0,0,0,40);
          g.addColorStop(0, color + '30');
          g.addColorStop(1, color + '00');
          return g;
        })(),
        pointRadius: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      scales: { x: { display: false }, y: { display: false } },
      plugins: { tooltip: { enabled: false }, legend: { display: false } }
    }
  });
}

sparkline('spark-revenue',    [28,32,29,35,38,33,40,44,41,48,52,58], C.accent);
sparkline('spark-customers',  [18,21,19,22,24,23,26,28,27,30,32,35], C.emerald);
sparkline('spark-conversion', [4.2,3.9,4.1,3.8,4.0,3.7,3.9,3.6,3.8,3.5,3.7,3.84], C.amber);
sparkline('spark-nps',        [62,64,63,65,66,65,67,68,67,69,70,72], C.sky);

/* ============================================================
   OVERVIEW — REVENUE TREND CHART
   ============================================================ */
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const revenueData = [210,245,228,265,290,275,310,340,325,370,395,428];
const ordersData  = [1200,1380,1290,1480,1620,1540,1750,1870,1810,2030,2140,2380];

let revenueChartView = 'revenue';
const revenueChartInstance = (() => {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return null;

  const mkGrad = (color) => {
    const g = ctx.getContext('2d').createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, color + '55');
    g.addColorStop(1, color + '00');
    return g;
  };

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Revenue ($K)',
        data: revenueData,
        borderColor: C.accent,
        backgroundColor: mkGrad(C.accent),
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: C.accent,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBorderColor: '#161d2e',
        pointBorderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 800, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 12 } } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            font: { size: 12 },
            callback: v => revenueChartView === 'revenue' ? '$' + v + 'K' : v.toLocaleString()
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => revenueChartView === 'revenue'
              ? ' Revenue: $' + ctx.raw + 'K'
              : ' Orders: ' + ctx.raw.toLocaleString()
          }
        }
      }
    }
  });
})();

// Toggle revenue / orders
document.querySelectorAll('[data-chart-toggle="revenue"]').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('[data-chart-toggle="revenue"]').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    revenueChartView = this.dataset.view;
    if (!revenueChartInstance) return;
    revenueChartInstance.data.datasets[0].data = revenueChartView === 'revenue' ? revenueData : ordersData;
    revenueChartInstance.data.datasets[0].label = revenueChartView === 'revenue' ? 'Revenue ($K)' : 'Orders';
    revenueChartInstance.data.datasets[0].borderColor = revenueChartView === 'revenue' ? C.accent : C.emerald;
    revenueChartInstance.update('active');
  });
});

/* ---- Traffic Sources Doughnut ---- */
(function () {
  const ctx = document.getElementById('trafficChart');
  if (!ctx) return;
  const sources = ['Organic Search','Direct','Paid Ads','Social','Email','Referral'];
  const vals    = [38, 22, 18, 12, 6, 4];
  const colors  = [C.accent, C.emerald, C.amber, C.sky, C.violet, C.teal];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sources,
      datasets: [{ data: vals, backgroundColor: colors, borderColor: '#161d2e', borderWidth: 3, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      animation: { animateRotate: true, duration: 1000 },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.raw}%` } }
      }
    }
  });

  const legend = document.getElementById('trafficLegend');
  sources.forEach((s, i) => {
    legend.innerHTML += `<div class="legend-item">
      <span class="legend-dot" style="background:${colors[i]}"></span>
      <span class="legend-label">${s}</span>
      <span class="legend-pct">${vals[i]}%</span>
    </div>`;
  });
})();

/* ---- Customer Segments Bar ---- */
(function () {
  const ctx = document.getElementById('segmentChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Enterprise','Mid-Market','SMB','Startup','Individual'],
      datasets: [{
        label: 'Avg Spend ($)',
        data: [8400, 3200, 1400, 680, 220],
        backgroundColor: [C.accent, C.violet, C.sky, C.teal, C.emerald],
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutBounce' },
      scales: {
        x: { grid: { display: false } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => '$' + v.toLocaleString() }
        }
      },
      plugins: { tooltip: { callbacks: { label: c => ' $' + c.raw.toLocaleString() } } }
    }
  });
})();

/* ---- Heatmap ---- */
(function () {
  const container = document.getElementById('heatmapContainer');
  if (!container) return;

  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Hour header row
  const empty = document.createElement('div');
  empty.className = 'heatmap-label';
  container.appendChild(empty);

  hours.forEach(h => {
    const el = document.createElement('div');
    el.className = 'heatmap-hour-label';
    el.textContent = h % 6 === 0 ? `${h}h` : '';
    container.appendChild(el);
  });

  const maxVal = 980;
  days.forEach(day => {
    const label = document.createElement('div');
    label.className = 'heatmap-label';
    label.textContent = day;
    container.appendChild(label);

    hours.forEach(h => {
      // Simulate peak hours 9–18 on weekdays
      const isWeekend = day === 'Sat' || day === 'Sun';
      const peakHour  = h >= 9 && h <= 18;
      const base = isWeekend ? 80 : peakHour ? 500 : 120;
      const noise = Math.floor(Math.random() * 300);
      const val = Math.min(base + noise, maxVal);
      const pct = val / maxVal;

      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.dataset.val = val + ' sessions';
      const alpha = 0.08 + pct * 0.92;
      cell.style.background = `rgba(99,102,241,${alpha.toFixed(2)})`;
      container.appendChild(cell);
    });
  });
})();

/* ---- Top Products List ---- */
(function () {
  const list = document.getElementById('productList');
  if (!list) return;
  const products = [
    { name: 'Pro Suite Bundle',     cat: 'Software',    rev: 128400, pct: 100, color: C.accent },
    { name: 'Analytics Add-on',     cat: 'Analytics',   rev: 96200,  pct: 75,  color: C.violet },
    { name: 'Data Connector API',   cat: 'Integration', rev: 81700,  pct: 63,  color: C.sky },
    { name: 'Team License x50',     cat: 'Software',    rev: 74300,  pct: 58,  color: C.teal },
    { name: 'Priority Support',     cat: 'Service',     rev: 58900,  pct: 46,  color: C.emerald },
  ];

  products.forEach((p, i) => {
    list.innerHTML += `
    <div class="product-item">
      <div class="product-rank">${String(i + 1).padStart(2, '0')}</div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-cat">${p.cat}</div>
      </div>
      <div class="product-bar-wrap">
        <div class="product-bar-bg">
          <div class="product-bar-fill" style="width:0%;background:${p.color}"
               data-width="${p.pct}%"></div>
        </div>
      </div>
      <div class="product-rev">$${(p.rev / 1000).toFixed(1)}K</div>
    </div>`;
  });

  // Animate bars
  setTimeout(() => {
    list.querySelectorAll('.product-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 300);
})();

/* ---- Recent Transactions Table ---- */
(function () {
  const tbody = document.getElementById('transactionBody');
  if (!tbody) return;

  const avatarColors = [C.accent, C.violet, C.emerald, C.sky, C.amber, C.rose, C.teal, C.pink];
  const transactions = [
    { name: 'Sarah Okonkwo',   product: 'Pro Suite Bundle',   amount: '$2,840', status: 'completed', date: 'May 25, 2026' },
    { name: 'James Fitzgerald', product: 'Analytics Add-on',  amount: '$480',   status: 'completed', date: 'May 25, 2026' },
    { name: 'Mei Lin Zhang',   product: 'Team License x50',   amount: '$1,200', status: 'pending',   date: 'May 24, 2026' },
    { name: 'Carlos Ruiz',     product: 'Priority Support',   amount: '$360',   status: 'completed', date: 'May 24, 2026' },
    { name: 'Aisha Patel',     product: 'Data Connector API', amount: '$960',   status: 'completed', date: 'May 23, 2026' },
    { name: 'Tom Bergström',   product: 'Pro Suite Bundle',   amount: '$2,840', status: 'failed',    date: 'May 23, 2026' },
    { name: 'Nadia Kovacs',    product: 'Analytics Add-on',   amount: '$480',   status: 'completed', date: 'May 22, 2026' },
    { name: 'Rohan Mehta',     product: 'Team License x50',   amount: '$1,200', status: 'pending',   date: 'May 22, 2026' },
  ];

  transactions.forEach((t, i) => {
    const initials = t.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const badgeClass = `status-${t.status}`;
    tbody.innerHTML += `
    <tr>
      <td><div class="customer-cell">
        <div class="customer-avatar" style="background:${avatarColors[i % avatarColors.length]}">${initials}</div>
        <span style="color:var(--text-primary);font-weight:500">${t.name}</span>
      </div></td>
      <td>${t.product}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--text-primary)">${t.amount}</td>
      <td><span class="status-badge ${badgeClass}">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span></td>
      <td>${t.date}</td>
    </tr>`;
  });
})();

/* ============================================================
   REVENUE PAGE CHARTS
   ============================================================ */
function initRevenueCharts() {
  /* Revenue by Channel */
  (function () {
    const ctx = document.getElementById('revenueByChannelChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Direct',   data: [55,62,58,70,78,72,85,92,88,99,106,115], backgroundColor: C.accent,  borderRadius: 4, borderSkipped: false },
          { label: 'Online',   data: [82,94,88,102,114,106,122,132,128,146,158,172], backgroundColor: C.violet, borderRadius: 4, borderSkipped: false },
          { label: 'Partners', data: [36,42,38,46,52,50,58,64,62,72,78,84], backgroundColor: C.teal, borderRadius: 4, borderSkipped: false },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#94a3b8', boxWidth: 12, padding: 16, font: { size: 12 } }
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '$' + v + 'K' } }
        }
      }
    });
  })();

  /* Revenue Split Doughnut */
  (function () {
    const ctx = document.getElementById('revenueSplitChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Product', 'Service', 'Subscription', 'Licensing'],
        datasets: [{ data: [42, 24, 28, 6], backgroundColor: [C.accent, C.emerald, C.violet, C.amber], borderColor: '#161d2e', borderWidth: 3, hoverOffset: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } } } }
    });
  })();

  /* Quarterly Growth */
  (function () {
    const ctx = document.getElementById('quarterlyChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026'],
        datasets: [
          { label: '2025', data: [680, 740, 810, 890, null, null], backgroundColor: 'rgba(99,102,241,0.35)', borderRadius: 6 },
          { label: '2026', data: [null, null, null, null, 1080, 1210], backgroundColor: C.accent, borderRadius: 6 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        skipNull: true,
        plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 12 } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '$' + v + 'K' } } }
      }
    });
  })();
}

/* ============================================================
   CUSTOMER PAGE CHARTS
   ============================================================ */
function initCustomerCharts() {
  /* Customer Growth */
  (function () {
    const ctx = document.getElementById('customerGrowthChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'New',     data: [1480,1620,1540,1780,1920,1840,2060,2180,2110,2340,2480,1842], backgroundColor: C.emerald, borderRadius: 4, borderSkipped: false },
          { label: 'Churned', data: [-210,-240,-220,-260,-280,-265,-295,-310,-295,-330,-350,-312], backgroundColor: C.rose, borderRadius: 4, borderSkipped: false },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 12 } } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => (v >= 0 ? '+' : '') + v } }
        }
      }
    });
  })();

  /* Cohort Retention */
  (function () {
    const ctx = document.getElementById('retentionChart');
    if (!ctx) return;
    const cohorts = ['Jan','Feb','Mar','Apr','May','Jun'];
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Month 0','Month 1','Month 2','Month 3','Month 4','Month 5'],
        datasets: cohorts.map((c, i) => ({
          label: c,
          data: [100, 82 - i*2, 70 - i*2, 62 - i*1.5, 57 - i*1.5, 54 - i].map((v, j) => j <= (5 - i) ? v : null),
          borderColor: [C.accent, C.violet, C.emerald, C.sky, C.amber, C.teal][i],
          borderWidth: 2, tension: 0.3, pointRadius: 3, fill: false
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { min: 40, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } }
        }
      }
    });
  })();

  /* Geo Bars */
  (function () {
    const container = document.getElementById('geoBars');
    if (!container) return;
    const regions = [
      { name: 'North America', count: '9,840',  pct: 100, color: C.accent },
      { name: 'Europe',        count: '6,420',  pct: 65,  color: C.violet },
      { name: 'Asia-Pacific',  count: '4,890',  pct: 50,  color: C.sky },
      { name: 'Latin America', count: '2,140',  pct: 22,  color: C.emerald },
      { name: 'Middle East & Africa', count: '1,028', pct: 10, color: C.amber },
    ];
    regions.forEach(r => {
      container.innerHTML += `
      <div class="geo-item">
        <div class="geo-row">
          <span class="geo-region">${r.name}</span>
          <span class="geo-count">${r.count}</span>
        </div>
        <div class="geo-bar-bg">
          <div class="geo-bar-fill" style="width:0%;background:${r.color}" data-width="${r.pct}%"></div>
        </div>
      </div>`;
    });
    setTimeout(() => {
      container.querySelectorAll('.geo-bar-fill').forEach(b => { b.style.width = b.dataset.width; });
    }, 200);
  })();

  /* Demographics */
  (function () {
    const ctx = document.getElementById('demographicChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['18–24','25–34','35–44','45–54','55–64','65+'],
        datasets: [
          { label: 'Male',   data: [12, 28, 22, 16, 10, 5], backgroundColor: C.accent, borderRadius: 4, borderSkipped: false },
          { label: 'Female', data: [10, 24, 20, 14, 9, 4],  backgroundColor: C.violet, borderRadius: 4, borderSkipped: false },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 12 } } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } }
        }
      }
    });
  })();
}

/* ============================================================
   PRODUCTS PAGE CHARTS
   ============================================================ */
function initProductCharts() {
  /* Category Revenue */
  (function () {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Software','Analytics','Integration','Support','Training','Licensing'],
        datasets: [{
          label: 'Revenue ($K)',
          data: [1840, 960, 720, 480, 340, 210],
          backgroundColor: [C.accent, C.violet, C.sky, C.emerald, C.amber, C.teal],
          borderRadius: 6, borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '$' + v + 'K' } }, y: { grid: { display: false } } },
        plugins: { tooltip: { callbacks: { label: c => ' $' + c.raw + 'K' } } }
      }
    });
  })();

  /* Inventory */
  (function () {
    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
        datasets: [{ data: [68, 18, 9, 5], backgroundColor: [C.emerald, C.amber, C.rose, C.violet], borderColor: '#161d2e', borderWidth: 3, hoverOffset: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } } } }
    });
  })();

  /* Product Rankings Table */
  (function () {
    const tbody = document.getElementById('productRankBody');
    if (!tbody) return;
    const products = [
      { name: 'Pro Suite Bundle',     cat: 'Software',    units: 1240, rev: '$128.4K', growth: '+22.1%', pos: true, rating: 4.9 },
      { name: 'Analytics Add-on',     cat: 'Analytics',   units: 2040, rev: '$96.2K',  growth: '+18.6%', pos: true, rating: 4.7 },
      { name: 'Data Connector API',   cat: 'Integration', units: 850,  rev: '$81.7K',  growth: '+14.2%', pos: true, rating: 4.8 },
      { name: 'Team License x50',     cat: 'Software',    units: 620,  rev: '$74.3K',  growth: '+9.4%',  pos: true, rating: 4.6 },
      { name: 'Priority Support',     cat: 'Service',     units: 1635, rev: '$58.9K',  growth: '+11.8%', pos: true, rating: 4.9 },
      { name: 'ML Training Module',   cat: 'Training',    units: 490,  rev: '$44.1K',  growth: '+31.5%', pos: true, rating: 4.5 },
      { name: 'Enterprise Connector', cat: 'Integration', units: 280,  rev: '$39.2K',  growth: '-3.2%',  pos: false, rating: 4.3 },
      { name: 'Data Studio Pro',      cat: 'Analytics',   units: 740,  rev: '$33.3K',  growth: '+7.6%',  pos: true, rating: 4.6 },
      { name: 'API Access Tier 2',    cat: 'Licensing',   units: 920,  rev: '$27.6K',  growth: '+5.1%',  pos: true, rating: 4.4 },
      { name: 'Onboarding Pack',      cat: 'Service',     units: 1180, rev: '$21.2K',  growth: '-1.8%',  pos: false, rating: 4.2 },
    ];
    products.forEach((p, i) => {
      const stars = '★'.repeat(Math.floor(p.rating)) + (p.rating % 1 >= 0.5 ? '½' : '');
      tbody.innerHTML += `
      <tr>
        <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--text-muted)">${String(i+1).padStart(2,'0')}</td>
        <td style="color:var(--text-primary);font-weight:500">${p.name}</td>
        <td><span class="status-badge" style="background:rgba(99,102,241,0.12);color:var(--accent-light)">${p.cat}</span></td>
        <td style="font-family:'JetBrains Mono',monospace">${p.units.toLocaleString()}</td>
        <td style="font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--text-primary)">${p.rev}</td>
        <td style="color:${p.pos ? 'var(--emerald)' : 'var(--rose)'};font-weight:600">${p.growth}</td>
        <td style="color:var(--amber);font-size:12px">${stars} <span style="color:var(--text-secondary)">${p.rating}</span></td>
      </tr>`;
    });
  })();
}

/* ============================================================
   ANALYTICS PAGE CHARTS
   ============================================================ */
function initAnalyticsCharts() {
  /* Conversion Funnel */
  (function () {
    const container = document.getElementById('funnelContainer');
    if (!container) return;
    const steps = [
      { label: 'Visitors',   count: '124,800', pct: 100, color: C.accent },
      { label: 'Sign-ups',   count: '38,640',  pct: 31,  color: C.violet },
      { label: 'Trials',     count: '14,980',  pct: 12,  color: C.sky },
      { label: 'Activated',  count: '7,820',   pct: 6.3, color: C.teal },
      { label: 'Converted',  count: '4,790',   pct: 3.8, color: C.emerald },
      { label: 'Retained',   count: '4,178',   pct: 3.3, color: C.amber },
    ];
    const gradColors = [
      `linear-gradient(90deg,${C.accent},${C.violet})`,
      `linear-gradient(90deg,${C.violet},${C.sky})`,
      `linear-gradient(90deg,${C.sky},${C.teal})`,
      `linear-gradient(90deg,${C.teal},${C.emerald})`,
      `linear-gradient(90deg,${C.emerald},${C.amber})`,
      `linear-gradient(90deg,${C.amber},${C.orange})`,
    ];
    steps.forEach((s, i) => {
      container.innerHTML += `
      <div class="funnel-step">
        <div class="funnel-label">${s.label}</div>
        <div class="funnel-bar-wrap">
          <div class="funnel-bar-bg">
            <div class="funnel-bar-fill" style="width:0%;background:${gradColors[i]}" data-width="${s.pct}%">${s.count}</div>
          </div>
        </div>
        <div class="funnel-count">${s.count}</div>
        <div class="funnel-pct">${s.pct}%</div>
      </div>`;
    });
    setTimeout(() => {
      container.querySelectorAll('.funnel-bar-fill').forEach(b => { b.style.width = b.dataset.width; });
    }, 200);
  })();

  /* Device Split */
  (function () {
    const ctx = document.getElementById('deviceChart');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Desktop','Mobile','Tablet'],
        datasets: [{ data: [54, 37, 9], backgroundColor: [C.accent, C.emerald, C.amber], borderColor: '#161d2e', borderWidth: 3, hoverOffset: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12 } } } }
    });
  })();

  /* Forecast Chart */
  (function () {
    const ctx = document.getElementById('forecastChart');
    if (!ctx) return;
    const histLabels = ['Jan','Feb','Mar','Apr','May','Jun'];
    const forecastLabels = ['Jul','Aug','Sep','Oct','Nov','Dec'];
    const histData    = [210, 245, 228, 265, 290, 275];
    const forecastData= [null, null, null, null, null, null, 315, 340, 368, 395, 422, 455];
    const allLabels   = [...histLabels, ...forecastLabels];
    const allHist     = [...histData, ...Array(6).fill(null)];
    const allForecast = forecastData;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Actual',
            data: allHist,
            borderColor: C.accent,
            backgroundColor: 'rgba(99,102,241,0.12)',
            borderWidth: 2.5, tension: 0.4, fill: true,
            pointRadius: 4, pointBackgroundColor: C.accent,
          },
          {
            label: 'Forecast',
            data: allForecast,
            borderColor: C.emerald,
            backgroundColor: 'rgba(16,185,129,0.08)',
            borderWidth: 2.5, borderDash: [6, 4], tension: 0.4, fill: true,
            pointRadius: 4, pointBackgroundColor: C.emerald,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 12 } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '$' + v + 'K' } }
        }
      }
    });
  })();

  /* Scatter Chart — Bounce Rate vs Session Time */
  (function () {
    const ctx = document.getElementById('scatterChart');
    if (!ctx) return;
    const pages = ['Home','Pricing','Blog','Docs','Features','About','Login','Contact','Demo','Blog/AI'];
    const data = pages.map((p, i) => ({
      x: +(20 + Math.random() * 65).toFixed(1),
      y: +(40 + Math.random() * 280).toFixed(0),
      label: p
    }));
    new Chart(ctx, {
      type: 'scatter',
      data: { datasets: [{ label: 'Pages', data, backgroundColor: C.accent + 'bb', pointRadius: 7, pointHoverRadius: 10 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: c => `${pages[c.dataIndex]}: Bounce ${c.raw.x}% · ${c.raw.y}s`
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Bounce Rate (%)', color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { title: { display: true, text: 'Avg Session (sec)', color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  })();
}

/* ============================================================
   INIT
   ============================================================ */
// Animate product bars on load (overview page)
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('#productList .product-bar-fill').forEach(b => {
      b.style.width = b.dataset.width;
    });
  }, 500);
});
