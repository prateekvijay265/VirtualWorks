/* =============================================
   ChurnIQ - All JavaScript Logic
   Charts, Interactions, Animations
   ============================================= */

'use strict';

// ─── Global Chart Defaults ─────────────────────────────────────────────────
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;   // KEY: prevents infinite height growth
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.plugins.tooltip.backgroundColor = '#141827';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.08)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.plugins.tooltip.boxWidth = 8;
Chart.defaults.plugins.tooltip.boxHeight = 8;

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  cyan: '#22d3ee',
  green: '#34d399',
  red: '#f87171',
  amber: '#fbbf24',
  pink: '#f472b6',
  orange: '#fb923c',
  blue: '#60a5fa',
  emerald: '#10b981',
  rose: '#fb7185',
};

// ─── Utility: Gradient Builder ─────────────────────────────────────────────
function makeGradient(ctx, c1, c2, height = 260) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}

// ─── Background Particles ──────────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById('bgParticles');
  const colors = ['#6366f1','#8b5cf6','#22d3ee','#34d399','#f87171'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 60 + 20;
    p.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 25 + 15}s;
      animation-delay: ${Math.random() * 10}s;
      filter: blur(${size * 0.5}px);
    `;
    container.appendChild(p);
  }
}

// ─── KPI Counter Animation ─────────────────────────────────────────────────
function animateCount(el, target, suffix = '', prefix = '', duration = 1600) {
  const start = performance.now();
  const isFloat = target % 1 !== 0;
  function update(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    const val = target * eased;
    el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initKPIs() {
  const kpis = [
    { el: document.querySelector('.kpi-card[data-index="0"] .kpi-value'), target: 8.6, suffix: '%' },
    { el: document.querySelector('.kpi-card[data-index="1"] .kpi-value'), target: 1106, suffix: '' },
    { el: document.querySelector('.kpi-card[data-index="2"] .kpi-value'), target: 3241, suffix: '' },
    { el: document.getElementById('kpiLTV'), target: 212, prefix: '$', suffix: '' },
    { el: document.querySelector('.kpi-card[data-index="4"] .kpi-value'), target: 17.3, suffix: '%' },
  ];
  kpis.forEach(({ el, target, suffix = '', prefix = '' }) => {
    if (el) animateCount(el, target, suffix, prefix);
  });
}

// ─── Sparklines ────────────────────────────────────────────────────────────
function sparkline(id, data, color) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 40);
  g.addColorStop(0, color + '30');
  g.addColorStop(1, 'transparent');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{ data, borderColor: color, borderWidth: 1.5, pointRadius: 0,
        fill: true, backgroundColor: g, tension: 0.4 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { tooltip: { enabled: false }, legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } },
    }
  });
}

function initSparklines() {
  sparkline('spark0', [5.1,5.8,6.2,6.0,6.8,7.1,7.6,8.0,8.6], COLORS.red);
  sparkline('spark1', [780,820,910,870,950,1020,980,1060,1106], COLORS.red);
  sparkline('spark2', [2900,3050,3100,2980,3200,3150,3220,3180,3241], COLORS.amber);
  sparkline('spark3', [240,230,225,228,220,215,218,210,212], COLORS.amber);
  sparkline('spark4', [10,11,12,13,14,15,15,16,17.3], COLORS.green);
}

// ─── Chart 1: Churn Timeline ───────────────────────────────────────────────
function initChurnTimeline() {
  const ctx = document.getElementById('churnTimeline')?.getContext('2d');
  if (!ctx) return;
  const labels = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'];
  const churned = [5.1,5.4,5.8,6.2,6.0,6.8,7.1,7.6,8.0,8.2,8.4,8.6];
  const retained = [94.9,94.6,94.2,93.8,94.0,93.2,92.9,92.4,92.0,91.8,91.6,91.4];

  const gRed = makeGradient(ctx, 'rgba(248,113,113,0.3)', 'rgba(248,113,113,0.0)');
  const gGreen = makeGradient(ctx, 'rgba(52,211,153,0.2)', 'rgba(52,211,153,0.0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Churned %', data: churned, borderColor: COLORS.red, backgroundColor: gRed,
          borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4,
          pointBackgroundColor: COLORS.red, pointBorderColor: '#0e1220', pointBorderWidth: 2 },
        { label: 'Retained %', data: retained, borderColor: COLORS.green, backgroundColor: gGreen,
          borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4,
          pointBackgroundColor: COLORS.green, pointBorderColor: '#0e1220', pointBorderWidth: 2,
          yAxisID: 'y2' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end',
          labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle',
            color: '#94a3b8', font: { size: 12 } } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } },
        y2: { display: false }
      }
    }
  });
}

// ─── Chart 2: Cancellation Reasons ─────────────────────────────────────────
function initChurnReasons() {
  const ctx = document.getElementById('churnReasons')?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Too Expensive','Not Using It','Missing Features','Poor Performance','Found Better Alt','Bad Support','Other'],
      datasets: [{
        data: [31,22,18,12,9,5,3],
        backgroundColor: [COLORS.red,COLORS.amber,COLORS.primary,COLORS.cyan,COLORS.pink,COLORS.orange,COLORS.secondary],
        borderColor: '#111624',
        borderWidth: 3,
        hoverOffset: 6,
        hoverBorderColor: '#1e2740'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          display: true, position: 'right',
          labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle',
            color: '#94a3b8', font: { size: 11 }, padding: 10 }
        },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } }
      }
    }
  });
}

// ─── Chart 3: Login Frequency ──────────────────────────────────────────────
function initLoginFreq() {
  const ctx = document.getElementById('loginFreq')?.getContext('2d');
  if (!ctx) return;
  const labels = ['0 sessions','1–2','3–5','6–10','11–20','20+'];
  const churned = [34,28,18,12,6,2];
  const retained = [3,8,18,30,26,15];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Churned', data: churned, backgroundColor: 'rgba(248,113,113,0.75)',
          borderRadius: 5, borderSkipped: false },
        { label: 'Retained', data: retained, backgroundColor: 'rgba(99,102,241,0.75)',
          borderRadius: 5, borderSkipped: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end',
          labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', color: '#94a3b8' } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, stacked: false },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ─── Chart 4: Feature Usage Radar ──────────────────────────────────────────
function initFeatureUsage() {
  const ctx = document.getElementById('featureUsage')?.getContext('2d');
  if (!ctx) return;
  const labels = ['Dashboard','Reporting','Integrations','Mobile App','API Usage','Collaboration','Notifications','Settings'];
  const retained = [8.2,7.1,6.4,5.8,4.9,7.6,5.2,3.1];
  const churned = [3.1,2.2,1.4,1.8,0.9,2.4,1.1,2.9];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Retained', data: retained, backgroundColor: 'rgba(129,140,248,0.8)',
          borderRadius: 5, borderSkipped: false },
        { label: 'Churned', data: churned, backgroundColor: 'rgba(248,113,113,0.8)',
          borderRadius: 5, borderSkipped: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} interactions/wk` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          title: { display: true, text: 'Avg weekly interactions', color: '#475569', font: { size: 11 } } }
      }
    }
  });
}

// ─── Chart 5: Engagement Decay ─────────────────────────────────────────────
function initEngagementDecay() {
  const ctx = document.getElementById('engagementDecay')?.getContext('2d');
  if (!ctx) return;
  const labels = ['<7 days','8–14','15–21','22–30','31–45','46–60','61–90','90+'];
  const data = [28,22,18,14,9,5,3,1];
  const g = makeGradient(ctx, 'rgba(251,191,36,0.5)', 'rgba(251,191,36,0.0)', 240);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Churn %', data, borderColor: COLORS.amber, backgroundColor: g,
        borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 5,
        pointBackgroundColor: COLORS.amber, pointBorderColor: '#111624', pointBorderWidth: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}% churned` } } },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ─── Chart 6: Support Correlation ─────────────────────────────────────────
function initSupportCorr() {
  const ctx = document.getElementById('supportCorr')?.getContext('2d');
  if (!ctx) return;
  const labels = ['0','1','2','3','4','5+'];
  const churnRate = [4.2,6.1,9.8,15.4,22.7,38.9];

  const g = makeGradient(ctx, 'rgba(244,114,182,0.5)', 'rgba(244,114,182,0.0)', 240);
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Churn Rate', data: churnRate, borderColor: COLORS.pink,
        backgroundColor: g, borderWidth: 2.5, fill: true, tension: 0.3,
        pointRadius: 5, pointBackgroundColor: COLORS.pink,
        pointBorderColor: '#111624', pointBorderWidth: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        tooltip: { callbacks: { label: ctx => ` Churn: ${ctx.parsed.y}%`,
          title: ctx => `${ctx[0].label} ticket(s)` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false },
          title: { display: true, text: 'Support Tickets (30d)', color: '#475569', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ─── Chart 7: NPS Distribution ────────────────────────────────────────────
function initNPSChart() {
  const ctx = document.getElementById('npsChart')?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['0','1','2','3','4','5','6','7','8','9','10'],
      datasets: [
        { label: 'Churned', data: [22,18,15,12,8,10,7,4,2,1,1],
          backgroundColor: 'rgba(248,113,113,0.75)', borderRadius: 4, borderSkipped: false },
        { label: 'Retained', data: [1,1,2,3,4,6,8,12,20,22,21],
          backgroundColor: 'rgba(52,211,153,0.75)', borderRadius: 4, borderSkipped: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end',
          labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', color: '#94a3b8' } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false },
          title: { display: true, text: 'NPS Score', color: '#475569', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } }
      }
    }
  });
}

// ─── Chart 8: Plan Churn ───────────────────────────────────────────────────
function initPlanChurn() {
  const ctx = document.getElementById('planChurn')?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Free Trial','Starter','Professional','Business','Enterprise'],
      datasets: [{
        label: 'Churn Rate',
        data: [62,18,9.4,5.2,1.8],
        backgroundColor: [
          'rgba(248,113,113,0.85)',
          'rgba(251,191,36,0.85)',
          'rgba(99,102,241,0.85)',
          'rgba(52,211,153,0.85)',
          'rgba(34,211,238,0.85)',
        ],
        borderRadius: 6, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { tooltip: { callbacks: { label: ctx => ` Churn: ${ctx.parsed.x}%` } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } },
        y: { grid: { display: false }, border: { display: false } }
      }
    }
  });
}

// ─── Chart 9: Tenure Churn ────────────────────────────────────────────────
function initTenureChurn() {
  const ctx = document.getElementById('tenureChurn')?.getContext('2d');
  if (!ctx) return;
  const g = makeGradient(ctx, 'rgba(34,211,238,0.5)', 'rgba(34,211,238,0.0)', 240);
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['0–30d','1–3mo','3–6mo','6–12mo','1–2yr','2–3yr','3yr+'],
      datasets: [{ label: 'Churn Rate', data: [34,19,12,8,5.2,3.8,2.1],
        borderColor: COLORS.cyan, backgroundColor: g, borderWidth: 2.5, fill: true,
        tension: 0.4, pointRadius: 5, pointBackgroundColor: COLORS.cyan,
        pointBorderColor: '#111624', pointBorderWidth: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { tooltip: { callbacks: { label: ctx => ` Churn: ${ctx.parsed.y}%` } } },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ─── Chart 10: Region Churn ───────────────────────────────────────────────
function initRegionChurn() {
  const ctx = document.getElementById('regionChurn')?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['North America','Europe','APAC','Latin America','Middle East','Africa'],
      datasets: [{
        label: 'Cancellations',
        data: [312,254,198,168,102,72],
        backgroundColor: [
          'rgba(99,102,241,0.8)','rgba(139,92,246,0.8)','rgba(34,211,238,0.8)',
          'rgba(251,191,36,0.8)','rgba(248,113,113,0.8)','rgba(52,211,153,0.8)'
        ],
        borderRadius: 5, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} cancellations/mo` } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false } }
      }
    }
  });
}

// ─── Risk Table ────────────────────────────────────────────────────────────
const SEGMENTS = [
  { name: 'Free Trial → No Conversion', users: 2108, churn: 62, risk: 95, driver: 'No Activation', action: 'Onboarding flow + Day-3 nudge', driverColor: 'rgba(248,113,113,0.15)', driverText: '#f87171' },
  { name: 'Single-User Starter (0–30d)', users: 847, churn: 41, risk: 87, driver: 'Low Engagement', action: 'Feature discovery email sequence', driverColor: 'rgba(251,191,36,0.15)', driverText: '#fbbf24' },
  { name: 'Downgraded Users (30d post)', users: 512, churn: 38, risk: 82, driver: 'Budget Sensitivity', action: 'Annual plan discount offer', driverColor: 'rgba(251,191,36,0.15)', driverText: '#fbbf24' },
  { name: '1 Support Ticket > No Resolution', users: 634, churn: 34, risk: 79, driver: 'Poor Support CX', action: 'Priority re-escalation + CS call', driverColor: 'rgba(248,113,113,0.15)', driverText: '#f87171' },
  { name: 'Mobile-Only Users', users: 1242, churn: 28, risk: 71, driver: 'Feature Parity Gap', action: 'Mobile roadmap preview + beta invite', driverColor: 'rgba(139,92,246,0.15)', driverText: '#a78bfa' },
  { name: 'Team < 3 (Professional Plan)', users: 918, churn: 22, risk: 64, driver: 'ROI Uncertainty', action: 'Case study + ROI calculator share', driverColor: 'rgba(34,211,238,0.15)', driverText: '#22d3ee' },
  { name: 'Inactive 14+ Days (Starter)', users: 1547, churn: 19, risk: 58, driver: 'Disengagement', action: 'Win-back campaign + usage tips', driverColor: 'rgba(251,191,36,0.15)', driverText: '#fbbf24' },
  { name: 'Single Integration Users', users: 761, churn: 15, risk: 44, driver: 'Low Stickiness', action: 'Integration discovery tooltip', driverColor: 'rgba(99,102,241,0.15)', driverText: '#818cf8' },
  { name: 'Annual Plan (Renewal Due)', users: 423, churn: 11, risk: 38, driver: 'Renewal Friction', action: 'Auto-renew incentive email (60d prior)', driverColor: 'rgba(52,211,153,0.15)', driverText: '#34d399' },
  { name: 'Business 12–24mo Tenure', users: 298, churn: 7, risk: 24, driver: 'Competitor Eval', action: 'QBR + executive sponsor outreach', driverColor: 'rgba(52,211,153,0.15)', driverText: '#34d399' },
];

function riskColor(score) {
  if (score >= 80) return { bar: '#f87171', pill: 'rgba(248,113,113,0.15)', text: '#f87171' };
  if (score >= 55) return { bar: '#fbbf24', pill: 'rgba(251,191,36,0.15)', text: '#fbbf24' };
  return { bar: '#34d399', pill: 'rgba(52,211,153,0.15)', text: '#34d399' };
}

function renderTable(filter = '') {
  const tbody = document.getElementById('riskTableBody');
  const rows = SEGMENTS.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.driver.toLowerCase().includes(filter.toLowerCase()));
  tbody.innerHTML = rows.map(s => {
    const rc = riskColor(s.risk);
    return `<tr>
      <td style="color:#f1f5f9;font-weight:500">${s.name}</td>
      <td>${s.users.toLocaleString()}</td>
      <td style="color:${s.churn >= 30 ? '#f87171' : s.churn >= 15 ? '#fbbf24' : '#34d399'};font-weight:600">${s.churn}%</td>
      <td>
        <div class="risk-bar-cell">
          <div class="risk-bar-bg">
            <div class="risk-bar-fill" style="width:${s.risk}%;background:${rc.bar}"></div>
          </div>
          <span class="risk-score-pill" style="background:${rc.pill};color:${rc.text}">${s.risk}</span>
        </div>
      </td>
      <td><span class="driver-tag" style="background:${s.driverColor};color:${s.driverText}">${s.driver}</span></td>
      <td><span class="action-tag">${s.action}</span></td>
    </tr>`;
  }).join('');
}

// ─── Retention Cards ───────────────────────────────────────────────────────
const RETENTION_DATA = [
  {
    icon: '🎯', title: 'Personalized Onboarding',
    desc: 'Deploy role-specific onboarding flows triggered within the first 48 hours. Users who complete onboarding have 3.2× higher 90-day retention.',
    impact: 28, impactLabel: '% reduction in\nearly churn',
    priority: 'HIGH', priorityColor: 'rgba(248,113,113,0.15)', priorityText: '#f87171',
    color: 'rgba(248,113,113,0.08)', bottomGrad: 'linear-gradient(90deg,#f87171,#ef4444)'
  },
  {
    icon: '💰', title: 'Price Sensitivity Intervention',
    desc: 'Offer targeted discount plans (annual switch, team bundles) to users who viewed pricing pages 3+ times without converting.',
    impact: 22, impactLabel: '% of "too expensive"\nchurn recoverable',
    priority: 'HIGH', priorityColor: 'rgba(248,113,113,0.15)', priorityText: '#f87171',
    color: 'rgba(251,191,36,0.05)', bottomGrad: 'linear-gradient(90deg,#fbbf24,#f59e0b)'
  },
  {
    icon: '🔔', title: 'Proactive Engagement Nudges',
    desc: 'Trigger in-app and email alerts when users are inactive for 7+ days. A/B tests show 34% re-activation with feature-highlight emails.',
    impact: 34, impactLabel: '% re-activation\nrate achieved',
    priority: 'MED', priorityColor: 'rgba(251,191,36,0.15)', priorityText: '#fbbf24',
    color: 'rgba(99,102,241,0.06)', bottomGrad: 'linear-gradient(90deg,#6366f1,#8b5cf6)'
  },
  {
    icon: '🤝', title: 'Customer Success Program',
    desc: 'Assign CS reps to accounts with churn risk score > 70. Direct outreach reduces churn by up to 41% in at-risk Business/Enterprise tiers.',
    impact: 41, impactLabel: '% churn drop\nin high-risk tiers',
    priority: 'HIGH', priorityColor: 'rgba(248,113,113,0.15)', priorityText: '#f87171',
    color: 'rgba(52,211,153,0.05)', bottomGrad: 'linear-gradient(90deg,#34d399,#10b981)'
  },
  {
    icon: '⚡', title: 'Feature Adoption Campaigns',
    desc: 'Users who adopt 3+ core features churn at 4.1% vs 18% for single-feature users. Deploy in-app tours for underused high-value features.',
    impact: 4.1, impactLabel: '% churn rate for\nmulti-feature users',
    priority: 'MED', priorityColor: 'rgba(251,191,36,0.15)', priorityText: '#fbbf24',
    color: 'rgba(34,211,238,0.05)', bottomGrad: 'linear-gradient(90deg,#22d3ee,#0891b2)'
  },
  {
    icon: '🏆', title: 'Loyalty & Milestone Rewards',
    desc: 'Gamified milestone rewards (badges, credits, exclusive features) at 30, 90, and 180-day marks increase long-term retention by 19%.',
    impact: 19, impactLabel: '% increase in\nlong-term retention',
    priority: 'LOW', priorityColor: 'rgba(52,211,153,0.15)', priorityText: '#34d399',
    color: 'rgba(244,114,182,0.05)', bottomGrad: 'linear-gradient(90deg,#f472b6,#ec4899)'
  },
];

function initRetentionCards() {
  const grid = document.getElementById('retentionGrid');
  grid.innerHTML = RETENTION_DATA.map(r => `
    <div class="retention-card" style="background:${r.color}">
      <div class="ret-accent-bar" style="background:${r.bottomGrad}"></div>
      <span class="ret-priority" style="background:${r.priorityColor};color:${r.priorityText}">${r.priority}</span>
      <div class="ret-icon" style="background:${r.priorityColor}">${r.icon}</div>
      <div class="ret-title">${r.title}</div>
      <div class="ret-desc">${r.desc}</div>
      <div class="ret-impact">
        <div class="ret-impact-num" style="color:${r.priorityText}">${r.impact}%</div>
        <div class="ret-impact-label">${r.impactLabel}</div>
      </div>
    </div>
  `).join('');
}

// ─── Chart 11: Retention Impact ───────────────────────────────────────────
function initRetentionImpact() {
  const ctx = document.getElementById('retentionImpact')?.getContext('2d');
  if (!ctx) return;
  const labels = ['Jan','Feb','Mar','Apr','May','Jun'];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Baseline (No Action)', data: [8.6,9.1,9.6,10.2,10.9,11.5],
          borderColor: '#475569', borderWidth: 2, borderDash: [6,3], tension: 0.4,
          pointRadius: 0, fill: false },
        { label: 'Onboarding Fix', data: [8.6,8.1,7.6,7.2,6.9,6.7],
          borderColor: COLORS.red, borderWidth: 2.5, tension: 0.4,
          pointRadius: 4, pointBackgroundColor: COLORS.red, pointBorderColor: '#111624', pointBorderWidth: 2 },
        { label: 'CS Program', data: [8.6,8.3,7.9,7.4,6.8,6.2],
          borderColor: COLORS.green, borderWidth: 2.5, tension: 0.4,
          pointRadius: 4, pointBackgroundColor: COLORS.green, pointBorderColor: '#111624', pointBorderWidth: 2 },
        { label: 'Full Strategy', data: [8.6,7.8,7.0,6.2,5.6,5.1],
          borderColor: COLORS.primary, borderWidth: 3, tension: 0.4,
          pointRadius: 4, pointBackgroundColor: COLORS.primary, pointBorderColor: '#111624', pointBorderWidth: 2 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end',
          labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', color: '#94a3b8' } },
        tooltip: { mode: 'index', intersect: false,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ─── Chart 12: Win-Back ───────────────────────────────────────────────────
function initWinback() {
  const ctx = document.getElementById('winback')?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Email\nCampaign','In-App\nOffer','SMS\nOutreach','Phone\nCall','Social\nRetargeting','Referral\nBonus'],
      datasets: [{
        label: 'Re-activation Rate',
        data: [22,31,18,44,14,27],
        backgroundColor: [
          'rgba(99,102,241,0.8)','rgba(52,211,153,0.8)','rgba(34,211,238,0.8)',
          'rgba(248,113,113,0.8)','rgba(251,191,36,0.8)','rgba(244,114,182,0.8)'
        ],
        borderRadius: 6, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { tooltip: { callbacks: { label: ctx => ` Re-activation: ${ctx.parsed.y}%` } } },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ─── Chart 13: Forecast ───────────────────────────────────────────────────
function initForecast() {
  const ctx = document.getElementById('forecast')?.getContext('2d');
  if (!ctx) return;
  const labels = ['W-12','W-10','W-8','W-6','W-4','W-2','Now','W+2','W+4','W+6','W+8','W+10','W+12'];
  const historical = [6.2,6.5,6.8,7.1,7.5,8.0,8.6,null,null,null,null,null,null];
  const forecast = [null,null,null,null,null,null,8.6,9.0,9.4,9.1,8.7,8.4,8.1];
  const upper = [null,null,null,null,null,null,8.6,9.8,10.4,10.1,9.8,9.6,9.4];
  const lower = [null,null,null,null,null,null,8.6,8.2,8.4,8.1,7.6,7.2,6.8];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Historical', data: historical, borderColor: COLORS.primary,
          borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: COLORS.primary,
          pointBorderColor: '#111624', pointBorderWidth: 2, tension: 0.4, fill: false,
          spanGaps: false },
        { label: 'Forecast', data: forecast, borderColor: COLORS.cyan,
          borderWidth: 2.5, borderDash: [6,3], pointRadius: 4,
          pointBackgroundColor: COLORS.cyan, pointBorderColor: '#111624', pointBorderWidth: 2,
          tension: 0.4, fill: false, spanGaps: false },
        { label: 'Upper Bound', data: upper, borderColor: 'rgba(34,211,238,0.2)',
          borderWidth: 1, pointRadius: 0, fill: '+1', backgroundColor: 'rgba(34,211,238,0.06)',
          tension: 0.4, spanGaps: false },
        { label: 'Lower Bound', data: lower, borderColor: 'rgba(34,211,238,0.2)',
          borderWidth: 1, pointRadius: 0, fill: false, tension: 0.4, spanGaps: false },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', align: 'end',
          labels: {
            boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle',
            color: '#94a3b8', filter: item => item.text !== 'Upper Bound' && item.text !== 'Lower Bound'
          }
        },
        tooltip: { mode: 'index', intersect: false,
          callbacks: { label: ctx => ctx.raw != null ? ` ${ctx.dataset.label}: ${ctx.raw}%` : '' } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ─── Chart 14: Feature Importance ────────────────────────────────────────
function initFeatureImportance() {
  const ctx = document.getElementById('featureImportance')?.getContext('2d');
  if (!ctx) return;
  const features = [
    'Days Since Last Login',
    'Support Tickets (30d)',
    'NPS Score',
    'Feature Adoption Count',
    'Plan Price vs Usage',
    'Onboarding Completion',
    'Team Size',
    'Contract Tenure',
  ];
  const importance = [0.182,0.156,0.141,0.128,0.112,0.098,0.089,0.094];
  const sorted = features.map((f,i) => ({ f, v: importance[i] }))
    .sort((a,b) => a.v - b.v);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(s => s.f),
      datasets: [{
        label: 'Importance',
        data: sorted.map(s => s.v),
        backgroundColor: sorted.map((_, i) => {
          const t = i / sorted.length;
          return `rgba(${Math.round(99 + (99-99)*t)},${Math.round(102 + (240-102)*t)},${Math.round(241 - (241-153)*t)},0.85)`;
        }),
        borderRadius: 5, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { tooltip: { callbacks: { label: ctx => ` Importance: ${(ctx.parsed.x * 100).toFixed(1)}%` } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          ticks: { callback: v => (v*100).toFixed(0) + '%' } },
        y: { grid: { display: false }, border: { display: false } }
      }
    }
  });
}

// ─── Chart 15: Risk Distribution ─────────────────────────────────────────
function initRiskDist() {
  const ctx = document.getElementById('riskDist')?.getContext('2d');
  if (!ctx) return;
  const bins = Array.from({length: 20}, (_, i) => i * 5);
  const low   = [0,0,380,620,890,1040,980,860,710,520,0,0,0,0,0,0,0,0,0,0];
  const med   = [0,0,0,0,0,60,180,290,340,380,360,320,280,200,120,0,0,0,0,0];
  const high  = [0,0,0,0,0,0,0,0,0,0,30,80,160,210,240,280,310,240,180,120];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins.map(b => b + '%'),
      datasets: [
        { label: 'Low Risk', data: low, backgroundColor: 'rgba(52,211,153,0.75)', borderRadius: 3, borderSkipped: false },
        { label: 'Medium Risk', data: med, backgroundColor: 'rgba(251,191,36,0.75)', borderRadius: 3, borderSkipped: false },
        { label: 'High Risk', data: high, backgroundColor: 'rgba(248,113,113,0.75)', borderRadius: 3, borderSkipped: false },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} users` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false },
          title: { display: true, text: 'Churn Probability Score', color: '#475569', font: { size: 11 } } },
        y: { stacked: false, grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
          title: { display: true, text: 'Number of Users', color: '#475569', font: { size: 11 } } }
      }
    }
  });
}

// ─── Nav Active State ─────────────────────────────────────────────────────
function initNavHighlight() {
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-item');
  const topbar = document.querySelector('.topbar');
  const topH = topbar ? topbar.offsetHeight : 72;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(n => n.classList.remove('active'));
        const active = document.getElementById('nav-' + id);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: `-${topH + 20}px 0px -60% 0px`, threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

// ─── Export Simulation ────────────────────────────────────────────────────
const EXPORT_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function initExport() {
  const btn = document.getElementById('exportBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.innerHTML = '✓ Exported!';
    btn.style.background = 'linear-gradient(135deg,#34d399,#10b981)';
    setTimeout(() => {
      btn.innerHTML = `${EXPORT_SVG} Export`;
      btn.style.background = '';
    }, 2000);
  });
}

// ─── Search Filter ────────────────────────────────────────────────────────
function initSearch() {
  const input = document.getElementById('segmentSearch');
  if (!input) return;
  input.addEventListener('input', () => renderTable(input.value));
}

// ─── Init All ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initKPIs();
  initSparklines();

  // Overview
  initChurnTimeline();
  initChurnReasons();

  // Behavior
  initLoginFreq();
  initFeatureUsage();
  initEngagementDecay();
  initSupportCorr();
  initNPSChart();

  // Segments
  initPlanChurn();
  initTenureChurn();
  initRegionChurn();
  renderTable();
  initSearch();

  // Retention
  initRetentionCards();
  initRetentionImpact();
  initWinback();

  // Predictions
  initForecast();
  initFeatureImportance();
  initRiskDist();

  // Nav & UX
  initNavHighlight();
  initExport();
});
