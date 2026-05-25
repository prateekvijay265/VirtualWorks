/* ==========================================================
   DataForge — Data Cleaning & Structural Validation
   app.js — Main Application Logic
   ========================================================== */

'use strict';

// ============================================================
// STATE
// ============================================================
const State = {
  rawData: [],          // Original parsed rows
  headers: [],          // Column names
  cleanedData: [],      // Post-cleaning rows
  issues: [],           // Detected issues list
  columnStats: [],      // Per-column statistics
  activeTab: 'ingest',
  cleaningApplied: false,
  showChangesOnly: false,
  activeFilter: 'all',
  formatHint: 'csv',
};

// ============================================================
// DOM HELPERS
// ============================================================
const $ = id => document.getElementById(id);
const el = (tag, cls, html = '') => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

// ============================================================
// TAB NAVIGATION
// ============================================================
function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tabId}`)?.classList.add('active');
  document.getElementById(`nav-${tabId}`)?.classList.add('active');
  State.activeTab = tabId;
}

document.querySelectorAll('.nav-pill').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

$('go-analyze-btn').addEventListener('click', () => {
  switchTab('analyze');
  runAnalysis();
});

$('go-clean-btn').addEventListener('click', () => switchTab('clean'));
$('go-export-btn').addEventListener('click', () => {
  switchTab('export');
  renderExportPreview();
});

$('re-analyze-btn').addEventListener('click', runAnalysis);

// ============================================================
// SAMPLE DATA
// ============================================================
const SAMPLES = {
  sales: `order_id,customer,email,date,amount,status,region
1001,Alice Johnson,alice@company.com,2024-01-15,1250.00,Completed,North
1002,Bob Smith,bob@smith,2024-02-30,980.5,Pending,
1003,alice johnson,alice@company.com,2024-01-15,1250.00,completed,North
1004,Charlie Brown,charlie.b@email.com,15/03/2024,$2,100.00,Shipped,East
1005,Diana Prince,,March 5 2024,750,COMPLETED,West
1006,Edward Norton,edward@example.com,2024-04-10,99999.99,Completed,South
1007,,frank@example.com,2024-04-12,430.00,Pending,East
1008,Grace Hopper,grace@tech.org,2024-04-18,1870.50,Completed,North
1009,Henry Ford,henry.ford@auto.com,2024-05-01,,Shipped,West
1010,Grace Hopper,grace@tech.org,2024-04-18,1870.50,Completed,North`,

  employees: `emp_id,first_name,last_name,email,department,salary,hire_date,active
E001,John,Doe,john.doe@corp.com,Engineering,95000,2020-03-15,true
E002,jane,smith,jane.smith@corp,Marketing,72000,2019-11-01,True
E003,John,Doe,john.doe@corp.com,Engineering,95000,2020-03-15,true
E004,Mike,Johnson,,Sales,,2021-07-20,false
E005,Sarah,Connor,sarah.c@corp.com,HR,68000,03-22-2022,yes
E006,Tom,Hardy,tom.hardy@corp.com,Engineering,abc,2020-09-10,true
E007,Emily,Clark,emily@corp.com,Marketing,74500,2021-01-15,
E008,David,Lee,david.lee@corp.com,Sales,82000,2022-06-01,false
E009,Lisa,White,lisa.white@,Engineering,91000,2019-05-14,true
E010,Tom,Hardy,tom.hardy@corp.com,Engineering,145000,2020-09-10,true`,

  inventory: `sku,product_name,category,price,stock,supplier,last_updated,weight_kg
SKU001,Wireless Mouse,Electronics,$29.99,150,TechCorp,2024-01-10,0.2
SKU002,USB Hub,Electronics,24.99,89,TechCorp,,0.35
SKU003,Desk Lamp,Furniture,45.00,32,HomePro,2024-01-12,1.2
SKU001,Wireless Mouse,Electronics,$29.99,150,TechCorp,2024-01-10,0.2
SKU004,Notebook,Stationery,8.5,500,,Jan 15 2024,0.3
SKU005,Pen Set,Stationery,,200,OfficeMax,2024-01-20,0.1
SKU006,Monitor Stand,Furniture,89.00,15,HomePro,2024-01-22,2500
SKU007,Keyboard,Electronics,79.99,67,TechCorp,2024-01-25,0.85
SKU008,webcam,electronics,65.00,-5,TechCorp,2024-01-28,0.4
SKU009,Laptop Bag,Accessories,55.0,28,BagMakers,2024-02-01,0.95`
};

$('sample-sales').addEventListener('click', () => loadSample('sales'));
$('sample-employees').addEventListener('click', () => loadSample('employees'));
$('sample-inventory').addEventListener('click', () => loadSample('inventory'));

function loadSample(name) {
  $('raw-input').value = SAMPLES[name];
  State.formatHint = 'csv';
  setFormatActive('csv');
  showToast(`Loaded ${name} sample dataset`, 'info');
}

// ============================================================
// FORMAT TOGGLE
// ============================================================
$('fmt-csv').addEventListener('click', () => { State.formatHint = 'csv'; setFormatActive('csv'); });
$('fmt-json').addEventListener('click', () => { State.formatHint = 'json'; setFormatActive('json'); });

function setFormatActive(fmt) {
  document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.fmt-btn[data-fmt="${fmt}"]`)?.classList.add('active');
}

// ============================================================
// FILE UPLOAD
// ============================================================
const dropZone = $('drop-zone');

$('browse-btn').addEventListener('click', e => {
  e.stopPropagation();
  $('file-input').click();
});

$('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'tsv', 'json', 'txt'].includes(ext)) {
    showToast('Unsupported file type. Please use CSV, TSV, or JSON.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    $('raw-input').value = e.target.result;
    State.formatHint = ext === 'json' ? 'json' : 'csv';
    setFormatActive(State.formatHint);
    showToast(`Loaded: ${file.name}`, 'success');
  };
  reader.readAsText(file);
}

// ============================================================
// CSV PARSER
// ============================================================
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVRow(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCSVRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === ',' || ch === '\t') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseJSON(text) {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : (data.data || data.records || Object.values(data)[0] || []);
    if (!Array.isArray(arr) || arr.length === 0) return { headers: [], rows: [] };
    const headers = Object.keys(arr[0]);
    return { headers, rows: arr.map(r => { const o = {}; headers.forEach(h => o[h] = r[h] ?? ''); return o; }) };
  } catch {
    return { headers: [], rows: [] };
  }
}

// ============================================================
// PARSE & DISPLAY
// ============================================================
$('parse-btn').addEventListener('click', parseAndDisplay);
$('clear-input-btn').addEventListener('click', () => { $('raw-input').value = ''; });

function parseAndDisplay() {
  const text = $('raw-input').value.trim();
  if (!text) { showToast('Please paste or upload data first.', 'warning'); return; }

  showLoading('Parsing data...');

  setTimeout(() => {
    let result;
    const isJson = text.startsWith('{') || text.startsWith('[');
    result = isJson ? parseJSON(text) : parseCSV(text);

    if (!result.headers.length) {
      hideLoading();
      showToast('Could not parse data. Check format.', 'error');
      return;
    }

    State.headers = result.headers;
    State.rawData = result.rows;
    State.cleanedData = [];
    State.issues = [];
    State.cleaningApplied = false;

    renderPreviewTable(State.rawData, $('preview-table'), State.headers);
    $('dataset-meta').innerHTML = `
      <span>${State.rawData.length} rows</span>
      <span>·</span>
      <span>${State.headers.length} columns</span>
    `;
    $('preview-hint').textContent = `Showing first ${Math.min(State.rawData.length, 50)} rows`;
    $('recent-section').style.display = 'block';

    setStatus('active', 'Data loaded');
    hideLoading();
    showToast(`Parsed ${State.rawData.length} rows × ${State.headers.length} columns`, 'success');
  }, 300);
}

function renderPreviewTable(data, table, headers, highlights = {}) {
  table.innerHTML = '';
  const maxRows = 50;

  // Header
  const thead = el('thead');
  const hr = el('tr');
  headers.forEach(h => {
    const th = el('th', '', h);
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  // Body
  const tbody = el('tbody');
  data.slice(0, maxRows).forEach((row, ridx) => {
    const tr = el('tr');
    headers.forEach(col => {
      const val = row[col];
      const td = el('td', '', val === '' || val === null || val === undefined ? '<em style="color:var(--accent-red);opacity:0.7">null</em>' : escapeHtml(String(val)));

      const key = `${ridx}-${col}`;
      if (highlights[key]) td.classList.add(highlights[key]);
      else if (val === '' || val === null || val === undefined) td.classList.add('cell-missing');

      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ============================================================
// DATA ANALYSIS ENGINE
// ============================================================
function runAnalysis() {
  if (!State.rawData.length) {
    showToast('No data loaded. Please import a dataset first.', 'warning');
    switchTab('ingest');
    return;
  }

  showLoading('Analyzing data quality...');

  setTimeout(() => {
    const { stats, issues } = analyzeData(State.rawData, State.headers);
    State.columnStats = stats;
    State.issues = issues;

    renderHealthBanner(stats, issues);
    renderColumnCards(stats);
    renderIssuesTable(issues);

    $('issues-list-card').style.display = 'block';
    $('issues-count-hint').textContent = `${issues.length} issues detected`;

    setStatus('warning', `${issues.length} issues`);
    hideLoading();
    showToast(`Analysis complete — ${issues.length} issues found`, issues.length > 0 ? 'warning' : 'success');
  }, 600);
}

function analyzeData(rows, headers) {
  const stats = headers.map(col => analyzeColumn(col, rows));
  const issues = detectIssues(rows, headers, stats);
  return { stats, issues };
}

function analyzeColumn(col, rows) {
  const values = rows.map(r => r[col]);
  const nonEmpty = values.filter(v => v !== '' && v !== null && v !== undefined);
  const total = values.length;
  const missing = total - nonEmpty.length;

  const type = inferType(nonEmpty);
  const unique = new Set(nonEmpty.map(String)).size;
  const duplicateVals = findDuplicateValues(nonEmpty.map(String));

  let numericStats = {};
  if (type === 'number') {
    const nums = nonEmpty.map(v => parseFloat(String(v).replace(/[$,\s]/g, ''))).filter(n => !isNaN(n));
    if (nums.length > 0) {
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const sorted = [...nums].sort((a, b) => a - b);
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const std = Math.sqrt(nums.map(n => (n - mean) ** 2).reduce((a, b) => a + b, 0) / nums.length);
      const mode = findMode(nums);
      numericStats = { mean, median, std, mode, min: Math.min(...nums), max: Math.max(...nums), nums };
    }
  }

  const emailIssues = (type === 'email' || col.toLowerCase().includes('email'))
    ? nonEmpty.filter(v => !isValidEmail(String(v))).length : 0;

  const dateIssues = (type === 'date' || col.toLowerCase().includes('date'))
    ? nonEmpty.filter(v => !isValidDate(String(v))).length : 0;

  const formatInconsistencies = detectFormatInconsistencies(col, nonEmpty, type);

  return {
    col, type, total, missing, nonEmpty: nonEmpty.length,
    unique, duplicateVals, numericStats,
    emailIssues, dateIssues, formatInconsistencies,
    completeness: ((total - missing) / total * 100).toFixed(1),
    uniqueness: total > 0 ? (unique / total * 100).toFixed(1) : 0,
    values,
  };
}

function inferType(values) {
  if (!values.length) return 'string';

  const sample = values.slice(0, 20).map(String);
  const emailLike = sample.filter(v => v.includes('@')).length;
  if (emailLike / sample.length > 0.5) return 'email';

  const dateLike = sample.filter(v => isValidDate(v) || /\d{1,4}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(v)).length;
  if (dateLike / sample.length > 0.6) return 'date';

  const numLike = sample.filter(v => !isNaN(parseFloat(v.replace(/[$,\s%]/g, ''))));
  if (numLike.length / sample.length > 0.7) return 'number';

  const boolLike = sample.filter(v => /^(true|false|yes|no|1|0)$/i.test(v.trim())).length;
  if (boolLike / sample.length > 0.8) return 'boolean';

  const uniqueVals = new Set(sample.map(v => v.toLowerCase()));
  if (uniqueVals.size <= Math.max(3, sample.length * 0.2)) return 'categorical';

  return 'string';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(val) {
  if (!val || val.length < 6) return false;
  return !isNaN(Date.parse(val)) || /^\d{4}-\d{2}-\d{2}$/.test(val);
}

function findDuplicateValues(arr) {
  const counts = {};
  arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
  return Object.entries(counts).filter(([, c]) => c > 1).map(([v, c]) => ({ value: v, count: c }));
}

function findMode(nums) {
  const counts = {};
  nums.forEach(n => counts[n] = (counts[n] || 0) + 1);
  return parseFloat(Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 0);
}

function detectFormatInconsistencies(col, values, type) {
  const issues = [];
  if (type === 'string' || type === 'categorical') {
    const caseMixed = values.some(v => v !== String(v).toLowerCase() && v !== String(v).toUpperCase() && v !== String(v));
    const hasLeadingTrailing = values.some(v => v !== v.trim());
    if (hasLeadingTrailing) issues.push('Whitespace');
  }
  if (type === 'number') {
    const hasCurrency = values.some(v => /[$€£¥,]/.test(String(v)));
    if (hasCurrency) issues.push('Currency symbols');
    const nonNumeric = values.filter(v => isNaN(parseFloat(String(v).replace(/[$,\s]/g, ''))));
    if (nonNumeric.length > 0) issues.push(`${nonNumeric.length} non-numeric`);
  }
  if (type === 'date') {
    const formats = new Set();
    values.forEach(v => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) formats.add('ISO');
      else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) formats.add('MM/DD/YY');
      else if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(v)) formats.add('MM-DD-YY');
      else formats.add('Other');
    });
    if (formats.size > 1) issues.push(`Mixed formats (${[...formats].join(', ')})`);
  }
  if (type === 'email') {
    const invalid = values.filter(v => !isValidEmail(String(v)));
    if (invalid.length) issues.push(`${invalid.length} invalid`);
  }
  return issues;
}

function detectIssues(rows, headers, stats) {
  const issues = [];

  // Duplicate rows
  const rowStrings = rows.map(r => JSON.stringify(headers.map(h => r[h])));
  const seenRows = new Set();
  rows.forEach((row, idx) => {
    const key = rowStrings[idx];
    if (seenRows.has(key)) {
      issues.push({
        row: idx + 1, col: '(all)', type: 'duplicate',
        value: 'Entire row is a duplicate',
        suggestion: 'Remove duplicate row',
      });
    } else {
      seenRows.add(key);
    }
  });

  // Column-level issues
  stats.forEach(stat => {
    const { col, type, values, numericStats, emailIssues, dateIssues, formatInconsistencies } = stat;

    values.forEach((val, idx) => {
      // Missing
      if (val === '' || val === null || val === undefined) {
        const suggestion = type === 'number' && numericStats.mean !== undefined
          ? `Fill with ${type === 'number' ? 'mean (' + numericStats.mean.toFixed(2) + ')' : 'mode'}`
          : 'Fill with mode or drop row';
        issues.push({ row: idx + 1, col, type: 'missing', value: '(empty)', suggestion });
      }

      // Outliers
      if (type === 'number' && numericStats.std !== undefined && val !== '' && val !== null) {
        const num = parseFloat(String(val).replace(/[$,\s]/g, ''));
        if (!isNaN(num) && Math.abs(num - numericStats.mean) > 3 * numericStats.std) {
          issues.push({
            row: idx + 1, col, type: 'outlier',
            value: String(val),
            suggestion: `Extreme value (mean: ${numericStats.mean.toFixed(2)}, ±3σ)`,
          });
        }
      }

      // Email validation
      if ((type === 'email' || col.toLowerCase().includes('email')) && val && !isValidEmail(String(val))) {
        issues.push({
          row: idx + 1, col, type: 'format',
          value: String(val),
          suggestion: 'Fix email format (missing @ or domain)',
        });
      }

      // Date format
      if ((type === 'date' || col.toLowerCase().includes('date')) && val && !isValidDate(String(val))) {
        issues.push({
          row: idx + 1, col, type: 'format',
          value: String(val),
          suggestion: 'Convert to ISO 8601 (YYYY-MM-DD)',
        });
      }

      // Number with currency
      if (type === 'number' && val && /[$€£¥,]/.test(String(val))) {
        issues.push({
          row: idx + 1, col, type: 'format',
          value: String(val),
          suggestion: `Clean number: ${String(val).replace(/[$,€£¥\s]/g, '')}`,
        });
      }
    });
  });

  return issues.slice(0, 500); // Cap for display
}

// ============================================================
// RENDER HEALTH BANNER
// ============================================================
function renderHealthBanner(stats, issues) {
  const totalCells = State.rawData.length * State.headers.length;
  const missingCount = issues.filter(i => i.type === 'missing').length;
  const dupCount = issues.filter(i => i.type === 'duplicate').length;
  const fmtCount = issues.filter(i => i.type === 'format').length;
  const outlierCount = issues.filter(i => i.type === 'outlier').length;

  const issueScore = Math.max(0, 100 - (issues.length / Math.max(totalCells, 1)) * 100 * 5);
  const score = Math.round(Math.max(0, Math.min(100, issueScore)));

  // Animate ring
  const ring = $('score-ring');
  const circumference = 314;
  const offset = circumference - (score / 100) * circumference;
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);

  $('health-score-num').textContent = score + '%';
  $('hstat-rows').querySelector('.hstat-value').textContent = State.rawData.length;
  $('hstat-cols').querySelector('.hstat-value').textContent = State.headers.length;
  $('hstat-dups').querySelector('.hstat-value').textContent = dupCount;
  $('hstat-missing').querySelector('.hstat-value').textContent = missingCount;
  $('hstat-invalid').querySelector('.hstat-value').textContent = fmtCount + outlierCount;
}

// ============================================================
// RENDER COLUMN CARDS
// ============================================================
function renderColumnCards(stats) {
  const grid = $('column-analysis');
  grid.innerHTML = '';
  grid.className = 'issues-grid';

  stats.forEach(stat => {
    const card = el('div', 'col-card');

    const typeLabels = {
      string: 'String', number: 'Number', date: 'Date',
      email: 'Email', boolean: 'Bool', categorical: 'Enum', mixed: 'Mixed'
    };

    card.innerHTML = `
      <div class="col-card-header">
        <span class="col-name">${escapeHtml(stat.col)}</span>
        <span class="col-type-badge col-type-${stat.type}">${typeLabels[stat.type] || stat.type}</span>
      </div>
      <div class="col-metrics">
        <div class="col-metric">
          <span class="col-metric-label">Complete</span>
          <div class="col-metric-bar-wrap">
            <div class="col-metric-bar bar-complete" style="width:${stat.completeness}%"></div>
          </div>
          <span class="col-metric-val" style="color:${parseFloat(stat.completeness) > 90 ? 'var(--accent-green)' : 'var(--accent-yellow)'}">${stat.completeness}%</span>
        </div>
        <div class="col-metric">
          <span class="col-metric-label">Unique</span>
          <div class="col-metric-bar-wrap">
            <div class="col-metric-bar bar-unique" style="width:${stat.uniqueness}%"></div>
          </div>
          <span class="col-metric-val">${stat.unique}</span>
        </div>
        ${stat.numericStats.mean !== undefined ? `
        <div class="col-metric">
          <span class="col-metric-label">Mean</span>
          <div class="col-metric-bar-wrap"></div>
          <span class="col-metric-val">${stat.numericStats.mean.toFixed(2)}</span>
        </div>` : ''}
      </div>
      <div class="col-issues-list">
        ${stat.missing === 0 && stat.emailIssues === 0 && stat.dateIssues === 0 && stat.formatInconsistencies.length === 0
          ? '<span class="issue-chip issue-chip-ok">✓ Clean</span>' : ''}
        ${stat.missing > 0 ? `<span class="issue-chip issue-chip-miss">⚠ ${stat.missing} missing</span>` : ''}
        ${stat.duplicateVals.length > 0 ? `<span class="issue-chip issue-chip-dup">⊘ duplicates</span>` : ''}
        ${stat.emailIssues > 0 ? `<span class="issue-chip issue-chip-fmt">✉ ${stat.emailIssues} invalid</span>` : ''}
        ${stat.dateIssues > 0 ? `<span class="issue-chip issue-chip-fmt">📅 ${stat.dateIssues} bad dates</span>` : ''}
        ${stat.formatInconsistencies.map(f => `<span class="issue-chip issue-chip-fmt">⚡ ${escapeHtml(f)}</span>`).join('')}
      </div>
    `;

    grid.appendChild(card);
  });
}

// ============================================================
// RENDER ISSUES TABLE
// ============================================================
function renderIssuesTable(issues, filter = 'all') {
  const tbody = $('issues-tbody');
  tbody.innerHTML = '';

  const filtered = filter === 'all' ? issues : issues.filter(i => i.type === filter);
  $('issues-count-hint').textContent = `${filtered.length} of ${issues.length} issues shown`;

  filtered.forEach(issue => {
    const tr = el('tr');
    tr.innerHTML = `
      <td style="color:var(--text-muted)">#${issue.row}</td>
      <td style="color:var(--accent-purple);font-family:var(--font-mono)">${escapeHtml(issue.col)}</td>
      <td><span class="issue-badge ${issue.type}">${issue.type}</span></td>
      <td class="${issue.type === 'missing' ? 'cell-missing' : ''}" title="${escapeHtml(String(issue.value))}">${escapeHtml(String(issue.value))}</td>
      <td class="suggestion-text" title="${escapeHtml(issue.suggestion)}">${escapeHtml(issue.suggestion)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Filter chips
$('issue-filters').addEventListener('click', e => {
  const chip = e.target.closest('[data-filter]');
  if (!chip) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  State.activeFilter = chip.dataset.filter;
  renderIssuesTable(State.issues, State.activeFilter);
});

// ============================================================
// CLEANING ENGINE
// ============================================================
$('apply-rules-btn').addEventListener('click', applyCleaningRules);

function applyCleaningRules() {
  if (!State.rawData.length) {
    showToast('No data to clean. Please import a dataset first.', 'warning');
    return;
  }

  showLoading('Applying cleaning rules...');

  setTimeout(() => {
    const rules = {
      dedup: $('rule-dedup').checked,
      fill: $('rule-fill').checked,
      fillStrategy: $('fill-strategy').value,
      text: $('rule-text').checked,
      dates: $('rule-dates').checked,
      outliers: $('rule-outliers').checked,
      emails: $('rule-emails').checked,
      numbers: $('rule-numbers').checked,
    };

    const result = cleanData(State.rawData, State.headers, State.columnStats, rules);
    State.cleanedData = result.cleaned;
    State.cleaningApplied = true;

    // Update summary bar
    $('cs-removed').textContent = result.stats.removed;
    $('cs-filled').textContent = result.stats.filled;
    $('cs-fixed').textContent = result.stats.fixed;
    $('cs-flagged').textContent = result.stats.flagged;
    $('clean-summary-bar').style.display = 'flex';

    // Render cleaned table
    const wrap = $('clean-table-wrap');
    wrap.innerHTML = '';
    const table = el('table', 'data-table');
    renderPreviewTable(State.cleanedData, table, State.headers, result.highlights);
    wrap.appendChild(table);

    $('clean-hint').textContent = `${State.cleanedData.length} rows after cleaning`;
    $('clean-footer').style.display = 'flex';

    setStatus('active', 'Clean');
    hideLoading();
    showToast(`Cleaning complete! ${result.stats.removed} rows removed, ${result.stats.filled} values filled`, 'success');
  }, 700);
}

function cleanData(rows, headers, colStats, rules) {
  let data = rows.map(r => ({ ...r }));
  const highlights = {};
  const stats = { removed: 0, filled: 0, fixed: 0, flagged: 0 };
  const removedIdxs = new Set();

  // Compute column stats for fill strategies
  const statMap = {};
  colStats.forEach(s => statMap[s.col] = s);

  // 1. Dedup
  if (rules.dedup) {
    const seen = new Set();
    data = data.filter((row, idx) => {
      const key = JSON.stringify(headers.map(h => row[h]));
      if (seen.has(key)) { removedIdxs.add(idx); stats.removed++; return false; }
      seen.add(key);
      return true;
    });
  }

  // 2. Text standardization
  if (rules.text) {
    data.forEach((row, ridx) => {
      headers.forEach(col => {
        const val = row[col];
        if (typeof val === 'string' && val !== val.trim()) {
          row[col] = val.trim();
          highlights[`${ridx}-${col}`] = 'cell-changed';
          stats.fixed++;
        }
      });
    });
  }

  // 3. Number normalization
  if (rules.numbers) {
    data.forEach((row, ridx) => {
      headers.forEach(col => {
        const stat = statMap[col];
        if (stat?.type === 'number' && row[col]) {
          const cleaned = String(row[col]).replace(/[$€£¥,\s%]/g, '');
          if (cleaned !== String(row[col]) && !isNaN(parseFloat(cleaned))) {
            row[col] = cleaned;
            highlights[`${ridx}-${col}`] = 'cell-changed';
            stats.fixed++;
          }
        }
      });
    });
  }

  // 4. Date normalization
  if (rules.dates) {
    data.forEach((row, ridx) => {
      headers.forEach(col => {
        const stat = statMap[col];
        if ((stat?.type === 'date' || col.toLowerCase().includes('date')) && row[col]) {
          const d = new Date(row[col]);
          if (!isNaN(d) && !/^\d{4}-\d{2}-\d{2}$/.test(row[col])) {
            const iso = d.toISOString().split('T')[0];
            row[col] = iso;
            highlights[`${ridx}-${col}`] = 'cell-changed';
            stats.fixed++;
          }
        }
      });
    });
  }

  // 5. Fill missing
  if (rules.fill) {
    data.forEach((row, ridx) => {
      headers.forEach(col => {
        if (row[col] === '' || row[col] === null || row[col] === undefined) {
          const stat = statMap[col];
          let fillVal = '';

          if (rules.fillStrategy === 'drop') return;
          if (rules.fillStrategy === 'zero') {
            fillVal = stat?.type === 'number' ? '0' : '';
          } else if (rules.fillStrategy === 'mean' && stat?.numericStats?.mean !== undefined) {
            fillVal = stat.numericStats.mean.toFixed(2);
          } else if (rules.fillStrategy === 'median' && stat?.numericStats?.median !== undefined) {
            fillVal = stat.numericStats.median.toFixed(2);
          } else if (stat?.type === 'number' && stat?.numericStats?.mean !== undefined) {
            fillVal = stat.numericStats.mean.toFixed(2);
          } else {
            // Mode for categorical
            const nonEmpty = stat?.values?.filter(v => v !== '' && v !== null) || [];
            const counts = {};
            nonEmpty.forEach(v => counts[v] = (counts[v] || 0) + 1);
            const modeEntry = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
            fillVal = modeEntry ? modeEntry[0] : 'N/A';
          }

          row[col] = fillVal;
          highlights[`${ridx}-${col}`] = 'cell-changed';
          stats.filled++;
        }
      });
    });

    // Drop rows if strategy is 'drop'
    if (rules.fillStrategy === 'drop') {
      const before = data.length;
      data = data.filter(row => headers.every(h => row[h] !== '' && row[h] !== null && row[h] !== undefined));
      stats.removed += before - data.length;
    }
  }

  // 6. Outlier flagging
  if (rules.outliers) {
    data.forEach((row, ridx) => {
      headers.forEach(col => {
        const stat = statMap[col];
        if (stat?.type === 'number' && stat.numericStats?.std !== undefined) {
          const num = parseFloat(String(row[col]).replace(/[$,\s]/g, ''));
          if (!isNaN(num) && Math.abs(num - stat.numericStats.mean) > 3 * stat.numericStats.std) {
            highlights[`${ridx}-${col}`] = 'cell-flagged';
            stats.flagged++;
          }
        }
      });
    });
  }

  // 7. Email flagging
  if (rules.emails) {
    data.forEach((row, ridx) => {
      headers.forEach(col => {
        const stat = statMap[col];
        if ((stat?.type === 'email' || col.toLowerCase().includes('email')) && row[col] && !isValidEmail(String(row[col]))) {
          highlights[`${ridx}-${col}`] = 'cell-invalid';
        }
      });
    });
  }

  return { cleaned: data, highlights, stats };
}

// Diff toggle
$('diff-show-changes').addEventListener('click', () => {
  $('diff-show-changes').classList.add('active');
  $('diff-show-all').classList.remove('active');
});

$('diff-show-all').addEventListener('click', () => {
  $('diff-show-all').classList.add('active');
  $('diff-show-changes').classList.remove('active');
});

// ============================================================
// EXPORT
// ============================================================
$('download-csv-btn').addEventListener('click', () => downloadCSV());
$('download-json-btn').addEventListener('click', () => downloadJSON());
$('download-report-btn').addEventListener('click', () => downloadReport());

function getExportData() {
  return State.cleanedData.length ? State.cleanedData : State.rawData;
}

function downloadCSV() {
  const data = getExportData();
  if (!data.length) { showToast('No data to export.', 'warning'); return; }

  const rows = [State.headers.join(',')];
  data.forEach(row => {
    const vals = State.headers.map(h => {
      const v = String(row[h] ?? '');
      return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    });
    rows.push(vals.join(','));
  });

  downloadFile(rows.join('\n'), 'dataforge_cleaned.csv', 'text/csv');
  showToast('CSV downloaded!', 'success');
}

function downloadJSON() {
  const data = getExportData();
  if (!data.length) { showToast('No data to export.', 'warning'); return; }

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, 'dataforge_cleaned.json', 'application/json');
  showToast('JSON downloaded!', 'success');
}

function downloadReport() {
  const data = getExportData();
  if (!State.rawData.length) { showToast('No data to report on.', 'warning'); return; }

  const report = generateReport(data);
  downloadFile(report, 'dataforge_report.txt', 'text/plain');
  showToast('Report downloaded!', 'success');
}

function generateReport(data) {
  const now = new Date().toISOString();
  const lines = [
    '='.repeat(60),
    'DATAFORGE — DATA CLEANING REPORT',
    `Generated: ${now}`,
    '='.repeat(60),
    '',
    'DATASET SUMMARY',
    '-'.repeat(40),
    `Original rows: ${State.rawData.length}`,
    `Cleaned rows:  ${data.length}`,
    `Columns:       ${State.headers.length}`,
    `Headers:       ${State.headers.join(', ')}`,
    '',
    'ISSUES DETECTED',
    '-'.repeat(40),
    `Total issues:   ${State.issues.length}`,
    `Duplicates:     ${State.issues.filter(i => i.type === 'duplicate').length}`,
    `Missing values: ${State.issues.filter(i => i.type === 'missing').length}`,
    `Format issues:  ${State.issues.filter(i => i.type === 'format').length}`,
    `Outliers:       ${State.issues.filter(i => i.type === 'outlier').length}`,
    '',
    'COLUMN STATISTICS',
    '-'.repeat(40),
  ];

  State.columnStats.forEach(s => {
    lines.push(`\n${s.col} [${s.type}]`);
    lines.push(`  Total: ${s.total} | Missing: ${s.missing} | Unique: ${s.unique} | Completeness: ${s.completeness}%`);
    if (s.numericStats.mean !== undefined) {
      lines.push(`  Mean: ${s.numericStats.mean.toFixed(2)} | Median: ${s.numericStats.median?.toFixed(2)} | Std: ${s.numericStats.std?.toFixed(2)}`);
    }
    if (s.emailIssues > 0) lines.push(`  Email issues: ${s.emailIssues}`);
    if (s.dateIssues > 0) lines.push(`  Date issues: ${s.dateIssues}`);
    if (s.formatInconsistencies.length) lines.push(`  Format: ${s.formatInconsistencies.join(', ')}`);
  });

  lines.push('', '='.repeat(60), 'END OF REPORT', '='.repeat(60));
  return lines.join('\n');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderExportPreview() {
  const data = getExportData();
  if (!data.length) return;

  const wrap = $('export-table-wrap');
  wrap.innerHTML = '';
  const table = el('table', 'data-table');
  renderPreviewTable(data, table, State.headers);
  wrap.appendChild(table);

  $('export-row-count').textContent = `${data.length} rows ready`;
  $('export-preview-card').style.display = 'block';
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  };

  const toast = el('div', `toast toast-${type}`);
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-text">${escapeHtml(message)}</span>
  `;

  const container = $('toast-container');
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================
// LOADING
// ============================================================
function showLoading(text = 'Processing...') {
  $('loading-text').textContent = text;
  $('loading-overlay').style.display = 'flex';
}

function hideLoading() {
  $('loading-overlay').style.display = 'none';
}

// ============================================================
// STATUS
// ============================================================
function setStatus(type, text) {
  const dot = document.querySelector('.status-dot');
  const label = document.querySelector('.status-text');
  dot.className = `status-dot ${type}`;
  label.textContent = text;
}

// ============================================================
// INIT
// ============================================================
(function init() {
  // Auto-load sales sample on start for wow effect
  setTimeout(() => {
    if (!State.rawData.length) {
      $('raw-input').value = SAMPLES.sales;
      setFormatActive('csv');
    }
  }, 500);
})();
