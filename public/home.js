// Arcium homepage wireframe (test site).
// Client only. Nothing is saved; API keys, watchlists and assignments live in memory until reload.

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- portals shown in the control panel ----
const PORTALS = [
  { id: 'factory', name: 'Factory Portal', abbr: 'FA', color: '#4a6fa5', use: 'Build, assign and run models.' },
  { id: 'fusion', name: 'Fusion Portal', abbr: 'FU', color: '#7a4fa0', use: 'Combine signals and data streams.' },
  { id: 'arcade', name: 'Arcade Portal', abbr: 'AR', color: '#b5543c', use: 'Simulation runs and test games.' },
  { id: 'fund', name: 'Fund Portal', abbr: 'FD', color: '#3c8a5a', use: 'Fund portfolio and equity view.' },
  { id: 'datahub', name: 'Datahub', abbr: 'DH', color: '#2f7f8f', use: 'Data ingestion and tables.' },
  { id: 'brokerhub', name: 'Broker Hub', abbr: 'BH', color: '#8a7a2f', use: 'Broker connections and orders.' },
  { id: 'seedhub', name: 'Seedhub', abbr: 'SH', color: '#6b6b6b', use: 'Seed library and workbench.' },
];
const portalById = (id) => PORTALS.find((p) => p.id === id);
const portalIcon = (p) =>
  `<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect width="32" height="32" rx="6" fill="${p.color}"/><text x="16" y="21" text-anchor="middle" font-size="12" font-family="sans-serif" fill="#fff">${p.abbr}</text></svg>`;

// ---- machines: this account's silos, hangar and model catalog on each machine ----
const MACHINES = [
  {
    id: 'm1', name: 'Machine 01', balance: 250000,   // account balance (placeholder)
    specs: { cpu: 'Ryzen 9 7950X (16 cores)', ram: '64 GB DDR5', gpu: 'RTX 4070 12 GB', os: 'Windows 11 Pro' },
    silos: [
      { id: 'alpha', stack: '2026-Q4', optimizations: ['Grid search', 'Walk-forward', 'Bayesian'] },
      { id: 'beta', stack: '2026-Q4', optimizations: ['Grid search', 'Genetic'] },
    ],
    hangar: [
      { id: 'sim-1', kind: 'Sim', model: 'model_a' },
      { id: 'live-1', kind: 'Live', model: null },
    ],
    catalog: ['model_a', 'model_b', 'model_c'],
  },
  {
    id: 'm2', name: 'Machine 02', balance: 80000,   // account balance (placeholder)
    specs: { cpu: 'Xeon E5-2680 v4 (14 cores)', ram: '32 GB DDR4', gpu: 'none', os: 'Ubuntu 24.04' },
    silos: [{ id: 'gamma', stack: '2026-Q3', optimizations: ['Grid search'] }],
    hangar: [{ id: 'sim-2', kind: 'Sim', model: 'model_c' }],
    catalog: ['model_c', 'model_d'],
  },
];
const machineById = (id) => MACHINES.find((m) => m.id === id);

// ---- instrument universe (placeholder symbols) ----
const UNIVERSE = [
  { sym: 'AAPL', name: 'Apple Inc.' }, { sym: 'MSFT', name: 'Microsoft' }, { sym: 'NVDA', name: 'NVIDIA' },
  { sym: 'AMZN', name: 'Amazon' }, { sym: 'GOOG', name: 'Alphabet' }, { sym: 'META', name: 'Meta Platforms' },
  { sym: 'TSLA', name: 'Tesla' }, { sym: 'SPY', name: 'S&P 500 ETF' }, { sym: 'QQQ', name: 'Nasdaq 100 ETF' },
  { sym: 'TLT', name: '20Y Treasury ETF' }, { sym: 'GLD', name: 'Gold ETF' }, { sym: 'BTC-USD', name: 'Bitcoin' },
  { sym: 'ETH-USD', name: 'Ethereum' }, { sym: 'EUR-USD', name: 'Euro / US Dollar' },
];
const nameOf = (sym) => { const u = UNIVERSE.find((x) => x.sym === sym); return u ? u.name : ''; };

// ---- state ----
const GRID_CELLS = 6;
const st = {
  // each workspace: { id, name, cells: [{ uid, portal, pinned } | null] }
  workspaces: [{ id: 1, name: 'Workspace 1', cells: Array(GRID_CELLS).fill(null) }],
  nextWsId: 2,
  activeWs: 1,
  nextUid: 1,
  sideAttached: false,
  sideOpen: false,
  apis: [], // { id, name, key, accounts: [] }
  nextApiId: 1,

  view: 'workspace',          // workspace | machine | watchlists | engines
  machine: 'm1',
  siloOpen: false, siloSel: null,
  hangarOpen: false, engineSel: null,

  // watchlists: instrument lists are watchlists, model lists hold model names
  lists: {
    instrument: [
      { id: 'i1', name: 'Main Portfolio', items: ['AAPL', 'MSFT', 'NVDA'] },
      { id: 'i2', name: 'Tech', items: ['AAPL', 'MSFT', 'NVDA', 'META', 'GOOG'] },
      { id: 'i3', name: 'Macro', items: ['SPY', 'QQQ', 'TLT', 'GLD'] },
    ],
    model: [{ id: 'ml1', name: 'Trend models', items: ['model_a'] }],
  },
  nextListId: 10,
  mgr: {
    instrument: { query: '', checked: [], memberChecked: [], target: 'i1' },
    model: { query: '', checked: [], memberChecked: [], target: 'ml1' },
  },
  alloc: { mode: 'full', value: 100 },   // account allocation: full | percent (1-100) | units (currency)
  engineMgr: 'instrument',    // which manager the Engines view shows under the toggle
  portfolioId: 'i1',
  assign: {},                 // sym -> [model ids]

  perf: Object.fromEntries(MACHINES.map((m, i) => [m.id, { cpu: 30 + i * 10, ram: 45 + i * 8, cpuHist: [], ramHist: [] }])),
};

// st.cells always refers to the active workspace's cells, so grid logic works per workspace.
Object.defineProperty(st, 'cells', {
  get: () => st.workspaces.find((w) => w.id === st.activeWs).cells,
});

const curMachine = () => machineById(st.machine);
const portfolio = () => st.lists.instrument.find((l) => l.id === st.portfolioId) || st.lists.instrument[0];

function setStatus(msg) { $('#status').textContent = msg; }

// ---- view switching (page nav tabs) ----
function showView(v) {
  st.view = v;
  $$('.view').forEach((s) => s.classList.toggle('hidden', s.id !== `view-${v}`));
  $$('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === v));
  $('#ws-btn').classList.toggle('on', v === 'workspace');
  $('#machine-btn').classList.toggle('on', v === 'machine');
}

// ---- workspace dropdown ----
function renderWsMenu() {
  const active = st.workspaces.find((w) => w.id === st.activeWs);
  $('#ws-title').textContent = active.name;
  $('#ws-menu').innerHTML =
    st.workspaces.map((w) =>
      `<button type="button" data-ws="${w.id}">${w.id === st.activeWs ? '&#10003; ' : ''}${esc(w.name)}</button>`).join('') +
    '<button type="button" data-ws-new="1">New workspace</button>';
}

function selectWs(id) {
  st.activeWs = id;
  st.view = 'workspace';
  setStatus(`Switched to ${st.workspaces.find((w) => w.id === id).name}.`);
  renderAll();
}

function newWs() {
  const id = st.nextWsId++;
  st.workspaces.push({ id, name: `Workspace ${id}`, cells: Array(GRID_CELLS).fill(null) });
  selectWs(id);
}

// ---- machine dropdown + machine view ----
function renderMachineMenu() {
  $('#machine-btn').innerHTML = `Machine: ${esc(curMachine().name)} &#9662;`;
  $('#machine-menu').innerHTML = MACHINES.map((m) =>
    `<button type="button" data-machine="${m.id}">${m.id === st.machine ? '&#10003; ' : ''}${esc(m.name)}</button>`).join('');
}

function selectMachine(id) {
  st.machine = id;
  st.siloSel = null;
  st.engineSel = null;
  st.view = 'machine';
  renderAll();
}

function renderMachineView() {
  const m = curMachine();
  $('#machine-title').textContent = m.name;
  $('#specs').innerHTML = Object.entries(m.specs).map(([k, v]) =>
    `<tr><th>${esc(k.toUpperCase())}</th><td>${esc(v)}</td></tr>`).join('');
  $('#machine-silos').innerHTML = '<ul>' + m.silos.map((s) =>
    `<li><b>${esc(s.id)}</b> · stack ${esc(s.stack)} · ${s.optimizations.length} optimizations</li>`).join('') + '</ul>';
  $('#machine-catalog').innerHTML = m.catalog.map((id) =>
    `<span class="chip drag" draggable="true" data-drag="model:${esc(id)}">${esc(id)}</span>`).join('');
  $('#machine-hangar').innerHTML = '<ul>' + (m.hangar.map((e) =>
    `<li>${esc(e.id)} · ${esc(e.kind)} · ${esc(e.model || 'empty')}</li>`).join('') || '<li class="muted">no engines</li>') + '</ul>';
  renderRealtime();
}

// simulated realtime CPU/RAM for each machine; the machine view shows the selected one
const clamp = (v) => Math.max(3, Math.min(98, v));
function tickPerf() {
  MACHINES.forEach((m) => {
    const p = st.perf[m.id];
    p.cpu = clamp(p.cpu + (Math.random() * 12 - 6));
    p.ram = clamp(p.ram + (Math.random() * 6 - 3));
    p.cpuHist = [...p.cpuHist, p.cpu].slice(-40);
    p.ramHist = [...p.ramHist, p.ram].slice(-40);
  });
  if (st.view === 'machine') renderRealtime();
}

function meter(label, val, hist) {
  return `<div class="meter">
    <div class="meter-head"><span>${label}</span><span>${val.toFixed(0)}%</span></div>
    <div class="bar"><span style="width:${val.toFixed(0)}%"></span></div>
    ${hist.length > 1 ? spark(hist) : ''}
  </div>`;
}

function renderRealtime() {
  const block = $('#rt-block');
  if (!block) return;
  const p = st.perf[st.machine];
  block.innerHTML = meter('CPU', p.cpu, p.cpuHist) + meter('RAM', p.ram, p.ramHist) +
    '<p class="muted">Simulated realtime, updates every second.</p>';
}

// ---- side panel: silo manager and hangar sections, then portal tiles ----
function renderSideSections() {
  const m = curMachine();

  const silos = m.silos.map((s) =>
    `<button type="button" data-silo="${esc(s.id)}" class="${st.siloSel === s.id ? 'on' : ''}">${esc(s.id)} · ${esc(s.stack)}</button>`).join('');
  const sel = m.silos.find((s) => s.id === st.siloSel);
  const siloBody = sel
    ? sel.optimizations.map((o) => `<div class="opt"><b>${esc(o)}</b><div class="ph-sm">optimization panel placeholder</div></div>`).join('')
    : '<p class="muted">Select a silo to see its optimization panels.</p>';

  const hangar = m.hangar.map((e) =>
    `<button type="button" data-engine="${esc(e.id)}" class="${st.engineSel === e.id ? 'on' : ''}">${esc(e.id)} · ${esc(e.kind)} · ${esc(e.model || 'empty')}</button>`).join('');
  const eng = m.hangar.find((e) => e.id === st.engineSel);
  const engBody = eng
    ? `<div class="opt"><b>${esc(eng.id)}</b><div class="ph-sm">kind ${esc(eng.kind)}, model ${esc(eng.model || 'none')}, status placeholder</div></div>`
    : '<p class="muted">Select an engine to see its details.</p>';

  $('#side-sections').innerHTML = `
    <div class="side-sec">
      <button type="button" class="sec-head" data-sec="silo">${st.siloOpen ? '&#9662;' : '&#9656;'} Silo Manager · ${esc(m.name)}</button>
      ${st.siloOpen ? `<div class="sec-body">
        ${silos || '<p class="muted">No silos on this machine.</p>'}
        <div class="sub">${siloBody}</div>
        <div class="sub muted">Model catalog: ${esc(m.catalog.join(', '))}</div>
      </div>` : ''}
    </div>
    <div class="side-sec">
      <button type="button" class="sec-head" data-sec="hangar">${st.hangarOpen ? '&#9662;' : '&#9656;'} Hangar · ${esc(m.name)}</button>
      ${st.hangarOpen ? `<div class="sec-body">
        ${hangar || '<p class="muted">No engines added.</p>'}
        <div class="sub">${engBody}</div>
      </div>` : ''}
    </div>`;
}

// ---- watchlists: generic manager for instruments (watchlists) and models (model lists) ----
function universeFor(kind) {
  if (kind === 'instrument') return UNIVERSE.map((u) => ({ id: u.sym, label: u.sym, name: u.name }));
  return curMachine().catalog.map((id) => ({ id, label: id, name: '' }));
}

function visibleItems(kind) {
  const q = st.mgr[kind].query.trim().toLowerCase();
  return universeFor(kind).filter((u) =>
    !q || u.label.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
}

function targetList(kind) {
  return st.lists[kind].find((l) => l.id === st.mgr[kind].target) || st.lists[kind][0];
}

function mgrHtml(kind) {
  return `
    <div class="mgr">
      <div class="mgr-bar">
        <input type="search" data-mgr-query="${kind}" value="${esc(st.mgr[kind].query)}"
          placeholder="${kind === 'instrument' ? 'Search symbol or name' : 'Search model'}">
        <label><input type="checkbox" data-checkall="${kind}"> Check all</label>
      </div>
      <div class="mgr-grid">
        <div class="mgr-results" data-results="${kind}"></div>
        <div class="mgr-lists" data-lists="${kind}"></div>
      </div>
    </div>`;
}

function renderMgrResults(kind) {
  const checked = st.mgr[kind].checked;
  const vis = visibleItems(kind);
  const html = vis.map((u) => {
    const drag = kind === 'model' ? ` draggable="true" data-drag="model:${esc(u.id)}"` : '';
    return `<label class="row-item"${drag}>
      <input type="checkbox" data-check="${kind}" data-id="${esc(u.id)}" ${checked.includes(u.id) ? 'checked' : ''}>
      <span class="sym">${esc(u.label)}</span><span class="muted">${esc(u.name)}</span>
    </label>`;
  }).join('');
  $$(`[data-results="${kind}"]`).forEach((el) => { el.innerHTML = html || '<p class="muted">No matches.</p>'; });
  const all = vis.length > 0 && vis.every((u) => checked.includes(u.id));
  $$(`[data-checkall="${kind}"]`).forEach((cb) => { cb.checked = all; });
}

function renderMgrLists(kind) {
  const t = targetList(kind);
  const memberChecked = st.mgr[kind].memberChecked;
  const lists = st.lists[kind].map((l) =>
    `<li><button type="button" data-target="${kind}:${l.id}" class="${l.id === t.id ? 'on' : ''}">${esc(l.name)} (${l.items.length})</button></li>`).join('');
  const others = st.lists[kind].filter((l) => l.id !== t.id)
    .map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
  const items = t.items.map((item) => `
    <label class="row-item list-member-item">
      <input type="checkbox" data-member-check="${kind}" data-id="${esc(item)}" ${memberChecked.includes(item) ? 'checked' : ''}>
      <span class="sym">${esc(item)}</span>
    </label>
  `).join('') || '<span class="muted">empty</span>';
  const listBuilderTitle = kind === 'instrument' ? 'Portfolio List Builder' : 'Model List Builder';
  const html = `
    <div class="box-sub"><b>${listBuilderTitle}</b>
      <ul class="list-ul">${lists}</ul>
      <div class="acct-row">
        <input type="text" data-newlist="${kind}" placeholder="New list name">
        <button type="button" data-create="${kind}">Create list</button>
      </div>
    </div>
    <div class="box-sub"><b>Editing: ${esc(t.name)}</b>
      <div class="acct-row">
        <button type="button" data-add="${kind}">Add checked</button>
        <button type="button" data-remove="${kind}">Remove checked</button>
      </div>
      <div class="acct-row">
        <select data-import-src="${kind}">${others || '<option value="">no other lists</option>'}</select>
        <button type="button" data-import="${kind}">Import list</button>
      </div>
      <textarea data-paste="${kind}" rows="2" placeholder="Paste ${kind === 'instrument' ? 'symbols' : 'models'}, comma or line separated"></textarea>
      <button type="button" data-paste-go="${kind}">Import pasted</button>
    </div>
    <div class="box-sub"><b>In this list</b>
      <div class="acct-row list-member-actions">
        <label><input type="checkbox" data-member-checkall="${kind}" ${t.items.length > 0 && t.items.every((item) => memberChecked.includes(item)) ? 'checked' : ''}> Select all</label>
        <button type="button" data-remove-members="${kind}" ${memberChecked.length ? '' : 'disabled'}>− Remove selected</button>
      </div>
      <div class="list-members">${items}</div>
    </div>`;
  $$(`[data-lists="${kind}"]`).forEach((el) => { el.innerHTML = html; });
}

function renderMgrParts(kind) {
  renderMgrResults(kind);
  renderMgrLists(kind);
}

function renderWatchView() {
  $('#watch-mgr').innerHTML = mgrHtml('instrument');
  renderMgrParts('instrument');
}

function renderEnginesManager() {
  $('#engines-mgr').innerHTML = mgrHtml(st.engineMgr);
  renderMgrParts(st.engineMgr);
  $$('[data-eng-mgr]').forEach((b) => b.classList.toggle('on', b.dataset.engMgr === st.engineMgr));
}

// ---- account allocation: which balance the engines read ----
const ALLOC_LABEL = { full: 'full balance', percent: 'percent of balance', units: 'currency units' };
const money = (v) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function allocatedBalance() {
  const bal = curMachine().balance;
  const { mode, value } = st.alloc;
  if (mode === 'percent') return bal * value / 100;
  if (mode === 'units') return Math.min(value, bal);
  return bal;
}

function setAllocMode(mode) {
  st.alloc.mode = mode;
  if (mode === 'percent') st.alloc.value = 100;
  if (mode === 'units') st.alloc.value = curMachine().balance;
  renderAlloc();
}

function applyAlloc(raw) {
  const bal = curMachine().balance;
  const n = Number(raw);
  let msg = '';
  if (st.alloc.mode === 'percent') {
    if (raw === '' || !Number.isFinite(n) || n < 1 || n > 100) msg = 'Percent must be between 1 and 100.';
    else st.alloc.value = n;
  } else if (st.alloc.mode === 'units') {
    if (raw === '' || !Number.isFinite(n) || n <= 0) msg = 'Enter a currency amount above 0.';
    else {
      st.alloc.value = Math.min(n, bal);
      if (n > bal) msg = `Capped at the account balance (${money(bal)}).`;
    }
  }
  renderAlloc(msg);
}

function renderAlloc(msg = '') {
  const bal = curMachine().balance;
  document.querySelectorAll('[name="alloc"]').forEach((r) => { r.checked = r.value === st.alloc.mode; });
  const input = $('#alloc-value');
  input.disabled = st.alloc.mode === 'full';
  input.placeholder = st.alloc.mode === 'percent' ? '1-100' : st.alloc.mode === 'units' ? 'amount' : '';
  if (document.activeElement !== input) {
    input.value = st.alloc.mode === 'full' ? '' : st.alloc.value;
  }
  $('#alloc-read').textContent =
    `Account balance ${money(bal)}. Engines read ${money(allocatedBalance())} (${ALLOC_LABEL[st.alloc.mode]}).`;
  $('#alloc-msg').textContent = msg;
}

// ---- engines: nav graph, portfolio table with model assignments ----
const NAV_SERIES = [100, 101.2, 100.8, 102.5, 101.9, 103.4, 104.1, 103.0, 105.2, 106.0];

function assignModel(syms, model) {
  syms.forEach((s) => { st.assign[s] = [...new Set([...(st.assign[s] || []), model])]; });
}

function renderEngines() {
  renderAlloc();
  $('#portfolio-select').innerHTML = st.lists.instrument.map((l) =>
    `<option value="${l.id}" ${l.id === st.portfolioId ? 'selected' : ''}>${esc(l.name)}</option>`).join('');
  $('#engine-machine').textContent = `Machine: ${curMachine().name}`;
  $('#nav-graph').innerHTML = spark(NAV_SERIES);

  const p = portfolio();
  const rows = p.items.map((sym) => {
    const models = (st.assign[sym] || []).map((m) =>
      `<span class="chip">${esc(m)} <button type="button" data-unassign="${esc(sym)}|${esc(m)}">x</button></span>`).join('');
    return `<tr data-drop-sym="${esc(sym)}">
      <td><b>${esc(sym)}</b></td><td>${esc(nameOf(sym))}</td>
      <td>${models || '<span class="muted">drop a model here</span>'}</td></tr>`;
  }).join('');
  $('#portfolio-table').innerHTML = `
    <table>
      <thead><tr><th>Instrument</th><th>Name</th><th>Models</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="muted">Portfolio is empty. Add instruments in Watchlists.</td></tr>'}</tbody>
    </table>`;

  renderEnginesManager();
}

function handleModelDrop(target, data) {
  if (!data.startsWith('model:')) return setStatus('Only models can be dropped on the portfolio.');
  const model = data.slice(6);
  if (target.dataset.dropSym) {
    const sym = target.dataset.dropSym;
    assignModel([sym], model);
    setStatus(`${model} assigned to ${sym}.`);
  } else {
    const p = portfolio();
    if (!p.items.length) return setStatus('Portfolio is empty. Add instruments in Watchlists first.');
    assignModel(p.items, model);
    setStatus(`${model} assigned to the whole portfolio (${p.items.length} instruments).`);
  }
  renderEngines();
}

// ---- control panel tiles (modal and side panel share the same tiles) ----
function renderTiles() {
  const html = PORTALS.map((p) => `
    <div class="tile" draggable="true" data-tile="${p.id}" title="Drag into the workspace, or click to place">
      ${portalIcon(p)}
      <div><div class="tile-name">${esc(p.name)}</div><div class="tile-use">${esc(p.use)}</div></div>
    </div>`).join('');
  $('#modal-tiles').innerHTML = html;
  $('#side-tiles').innerHTML = html;
}

function openModal() { $('#insert-modal').classList.remove('hidden'); }
function closeModal() { $('#insert-modal').classList.add('hidden'); }

function renderSide() {
  const panel = $('#side-panel');
  panel.classList.toggle('attached', st.sideAttached);
  panel.classList.toggle('open', st.sideOpen);
  const arrow = $('#side-arrow');
  arrow.innerHTML = st.sideOpen ? '&#9664;' : '&#9654;';
  arrow.setAttribute('aria-expanded', String(st.sideOpen));
}

// ---- workspace grid ----
function panelHtml(c) {
  const p = portalById(c.portal);
  return `
    <div class="panel">
      <div class="panel-head" ${c.pinned ? '' : `draggable="true" data-move="${c.uid}"`}>
        ${portalIcon(p)}
        <span class="panel-name">${esc(p.name)}</span>
        <button type="button" data-pin="${c.uid}">${c.pinned ? 'Unpin' : 'Anchor'}</button>
        <button type="button" data-close="${c.uid}" aria-label="Close panel">&times;</button>
      </div>
      <div class="panel-body">
        <p>${esc(p.use)}</p>
        <div class="ph">${esc(p.name)} content placeholder</div>
      </div>
    </div>`;
}

function renderGrid() {
  $('#grid').innerHTML = st.cells.map((c, i) => `
    <div class="cell" data-cell="${i}">
      ${c ? panelHtml(c) : '<span class="empty">Empty cell: drop a portal here</span>'}
    </div>`).join('');
}

function place(index, portalId) {
  st.cells[index] = { uid: st.nextUid++, portal: portalId, pinned: false };
  setStatus(`${portalById(portalId).name} placed in cell ${index + 1}.`);
  renderGrid();
}

function placeInFirstEmpty(portalId) {
  const i = st.cells.indexOf(null);
  if (i < 0) return setStatus('Workspace is full. Close a panel or drop onto a cell.');
  if (st.view !== 'workspace') st.view = 'workspace';
  place(i, portalId);
  showView('workspace');
  closeModal();
}

function findCell(uid) { return st.cells.findIndex((c) => c && c.uid === uid); }

function handleDrop(index, data) {
  const sep = data.indexOf(':');
  const kind = data.slice(0, sep);
  const val = data.slice(sep + 1);

  if (kind === 'new') {
    if (st.cells[index]) return setStatus('That cell is occupied. Drop on an empty cell, or drag a panel onto another to swap.');
    return place(index, val);
  }
  if (kind === 'move') {
    const from = findCell(Number(val));
    if (from < 0 || from === index) return;
    if (st.cells[from].pinned) return setStatus('That panel is anchored. Unpin it to move it.');
    if (st.cells[index] && st.cells[index].pinned) return setStatus('That cell holds an anchored panel. Unpin it first.');
    [st.cells[from], st.cells[index]] = [st.cells[index], st.cells[from]];
    setStatus('Panel moved.');
    renderGrid();
  }
}

// ---- API tools tree ----
function apiHtml(a) {
  const accounts = a.accounts.map((acc, i) =>
    `<li>${esc(acc)} <button type="button" data-del-acc="${a.id}:${i}">remove</button></li>`).join('');
  return `
    <div class="api-node">
      <div class="api-head">
        <span>${esc(a.name)}</span>
        <button type="button" data-del-api="${a.id}">Remove API</button>
      </div>
      <label>API key
        <input type="password" data-key="${a.id}" value="${esc(a.key)}" autocomplete="off">
      </label>
      <div>Account IDs</div>
      <ul>${accounts || '<li class="muted">none yet</li>'}</ul>
      <div class="acct-row">
        <input type="text" data-new-acc="${a.id}" placeholder="account ID">
        <button type="button" data-add-acc="${a.id}">Add account ID</button>
      </div>
    </div>`;
}

function renderApis() {
  $('#api-list').innerHTML = st.apis.length
    ? st.apis.map(apiHtml).join('')
    : '<p class="muted">No API names yet.</p>';
}

// ---- small sparkline placeholders ----
function spark(values) {
  const w = 240, h = 100;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`)
    .join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
}

// ---- menus ----
function toggleMenu(menuId) {
  const menu = $(menuId);
  const wasOpen = !menu.classList.contains('hidden');
  document.querySelectorAll('.menu').forEach((m) => m.classList.add('hidden'));
  if (!wasOpen) menu.classList.remove('hidden');
}

// ---- full re-render (used on navigation; grid and realtime are cheap to rebuild) ----
function renderAll() {
  renderWsMenu();
  renderMachineMenu();
  renderGrid();
  renderSideSections();
  renderMachineView();
  renderWatchView();
  renderEngines();
  showView(st.view);
}

// ---- wiring ----
document.addEventListener('click', (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;

  // tile click: place in first empty cell
  const tile = el.closest('[data-tile]');
  if (tile) return placeInFirstEmpty(tile.dataset.tile);

  // page nav menus
  if (el.closest('#machine-btn')) return toggleMenu('#machine-menu');
  const machinePick = el.closest('[data-machine]');
  if (machinePick) { $('#machine-menu').classList.add('hidden'); return selectMachine(machinePick.dataset.machine); }
  if (el.closest('#ws-btn')) return toggleMenu('#ws-menu');
  const wsPick = el.closest('[data-ws]');
  if (wsPick) { $('#ws-menu').classList.add('hidden'); return selectWs(Number(wsPick.dataset.ws)); }
  if (el.closest('[data-ws-new]')) { $('#ws-menu').classList.add('hidden'); return newWs(); }

  // top bar menus
  if (el.closest('#user-btn')) return toggleMenu('#user-menu');
  if (el.closest('#acct-btn')) return toggleMenu('#acct-menu');
  if (!el.closest('.menu-wrap')) document.querySelectorAll('.menu').forEach((m) => m.classList.add('hidden'));

  const open = el.closest('[data-open="api"]');
  if (open) {
    $('#user-menu').classList.add('hidden');
    $('#acct-menu').classList.remove('hidden');
    return;
  }

  // page nav tabs
  const tab = el.closest('[data-tab]');
  if (tab) { st.view = tab.dataset.tab; return renderAll(); }

  // control panel: icon, arrow, detach, attach, modal
  if (el.closest('#ctrl-btn')) {
    if (st.sideAttached) { st.sideOpen = !st.sideOpen; return renderSide(); }
    return openModal();
  }
  if (el.closest('#side-arrow')) { st.sideOpen = !st.sideOpen; return renderSide(); }
  if (el.closest('#side-detach')) { st.sideAttached = false; st.sideOpen = false; return renderSide(); }
  if (el.closest('#attach-btn')) {
    st.sideAttached = true; st.sideOpen = true;
    closeModal(); renderSide();
    return;
  }
  if (el.closest('#modal-close')) return closeModal();
  if (el.id === 'insert-modal') return closeModal();

  // side panel sections
  const sec = el.closest('[data-sec]');
  if (sec) {
    if (sec.dataset.sec === 'silo') st.siloOpen = !st.siloOpen;
    else st.hangarOpen = !st.hangarOpen;
    return renderSideSections();
  }
  const silo = el.closest('[data-silo]');
  if (silo) {
    const id = silo.dataset.silo;
    st.siloSel = st.siloSel === id ? null : id;
    return renderSideSections();
  }
  const engine = el.closest('[data-engine]');
  if (engine) {
    const id = engine.dataset.engine;
    st.engineSel = st.engineSel === id ? null : id;
    return renderSideSections();
  }

  // workspace panel actions
  const pin = el.closest('[data-pin]');
  if (pin) {
    const i = findCell(Number(pin.dataset.pin));
    if (i >= 0) { st.cells[i].pinned = !st.cells[i].pinned; renderGrid(); }
    return;
  }
  const close = el.closest('[data-close]');
  if (close) {
    const i = findCell(Number(close.dataset.close));
    if (i >= 0) { st.cells[i] = null; setStatus('Panel closed.'); renderGrid(); }
    return;
  }

  // engines: manager toggle
  const engToggle = el.closest('[data-eng-mgr]');
  if (engToggle) {
    st.engineMgr = engToggle.dataset.engMgr;
    return renderEnginesManager();
  }

  // engines: remove one model from one instrument
  const unassign = el.closest('[data-unassign]');
  if (unassign) {
    const [sym, model] = unassign.dataset.unassign.split('|');
    st.assign[sym] = (st.assign[sym] || []).filter((m) => m !== model);
    return renderEngines();
  }

  // watchlist / model list manager actions (scoped to the manager box that was clicked)
  const root = el.closest('.mgr');
  if (root) {
    const tgt = el.closest('[data-target]');
    if (tgt) {
      const [kind, listId] = tgt.dataset.target.split(':');
      st.mgr[kind].target = listId;
      st.mgr[kind].memberChecked = [];
      return renderMgrParts(kind);
    }
    const add = el.closest('[data-add]');
    if (add) {
      const kind = add.dataset.add;
      const list = targetList(kind);
      list.items = [...new Set([...list.items, ...st.mgr[kind].checked])];
      setStatus(`Added ${st.mgr[kind].checked.length} checked to ${list.name}.`);
      return afterListChange(kind);
    }
    const remove = el.closest('[data-remove]');
    if (remove) {
      const kind = remove.dataset.remove;
      const list = targetList(kind);
      list.items = list.items.filter((i) => !st.mgr[kind].checked.includes(i));
      setStatus(`Removed checked from ${list.name}.`);
      return afterListChange(kind);
    }
    const removeMembers = el.closest('[data-remove-members]');
    if (removeMembers) {
      const kind = removeMembers.dataset.removeMembers;
      const list = targetList(kind);
      const selectedMembers = st.mgr[kind].memberChecked;
      list.items = list.items.filter((item) => !selectedMembers.includes(item));
      st.mgr[kind].memberChecked = [];
      setStatus(`Removed ${selectedMembers.length} selected item${selectedMembers.length === 1 ? '' : 's'} from ${list.name}.`);
      return afterListChange(kind);
    }
    const create = el.closest('[data-create]');
    if (create) {
      const kind = create.dataset.create;
      const input = root.querySelector(`[data-newlist="${kind}"]`);
      const name = input.value.trim();
      if (!name) return;
      const id = `${kind === 'instrument' ? 'i' : 'ml'}${st.nextListId++}`;
      st.lists[kind].push({ id, name, items: [] });
      st.mgr[kind].target = id;
      setStatus(`Created list "${name}".`);
      return afterListChange(kind);
    }
    const imp = el.closest('[data-import]');
    if (imp) {
      const kind = imp.dataset.import;
      const src = st.lists[kind].find((l) => l.id === root.querySelector(`[data-import-src="${kind}"]`).value);
      const list = targetList(kind);
      if (!src) return setStatus('No list to import.');
      list.items = [...new Set([...list.items, ...src.items])];
      setStatus(`Imported ${src.name} into ${list.name}.`);
      return afterListChange(kind);
    }
    const paste = el.closest('[data-paste-go]');
    if (paste) {
      const kind = paste.dataset.pasteGo;
      const raw = root.querySelector(`[data-paste="${kind}"]`).value;
      const tokens = raw.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean)
        .map((t) => (kind === 'instrument' ? t.toUpperCase() : t));
      const list = targetList(kind);
      list.items = [...new Set([...list.items, ...tokens])];
      setStatus(`Imported ${tokens.length} pasted into ${list.name}.`);
      return afterListChange(kind);
    }
  }

  // API tools
  if (el.closest('#api-add')) {
    const input = $('#api-name');
    const name = input.value.trim();
    if (!name) return;
    st.apis.push({ id: st.nextApiId++, name, key: '', accounts: [] });
    input.value = '';
    return renderApis();
  }
  const delApi = el.closest('[data-del-api]');
  if (delApi) {
    st.apis = st.apis.filter((a) => a.id !== Number(delApi.dataset.delApi));
    return renderApis();
  }
  const addAcc = el.closest('[data-add-acc]');
  if (addAcc) {
    const id = Number(addAcc.dataset.addAcc);
    const api = st.apis.find((a) => a.id === id);
    const input = document.querySelector(`[data-new-acc="${id}"]`);
    const val = input.value.trim();
    if (!api || !val) return;
    api.accounts.push(val);
    return renderApis();
  }
  const delAcc = el.closest('[data-del-acc]');
  if (delAcc) {
    const [id, i] = delAcc.dataset.delAcc.split(':').map(Number);
    const api = st.apis.find((a) => a.id === id);
    if (api) api.accounts.splice(i, 1);
    return renderApis();
  }
});

// list changes: instrument lists also feed the portfolio table
function afterListChange(kind) {
  renderMgrParts(kind);
  if (kind === 'instrument') renderEngines();
}

// typing and selection changes that do not need a full re-render
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!(el instanceof Element)) return;
  if (el.dataset.key) {
    const api = st.apis.find((a) => a.id === Number(el.dataset.key));
    if (api) api.key = el.value;
    return;
  }
  if (el.id === 'alloc-value') return applyAlloc(el.value);
  if (el.dataset.mgrQuery) {
    const kind = el.dataset.mgrQuery;
    st.mgr[kind].query = el.value;
    return renderMgrResults(kind);
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (!(el instanceof Element)) return;
  if (el.name === 'alloc') return setAllocMode(el.value);
  if (el.id === 'alloc-value') return applyAlloc(el.value);
  if (el.id === 'portfolio-select') {
    st.portfolioId = el.value;
    return renderEngines();
  }
  if (el.dataset.check) {
    const kind = el.dataset.check;
    const id = el.dataset.id;
    const arr = st.mgr[kind].checked;
    st.mgr[kind].checked = el.checked ? [...new Set([...arr, id])] : arr.filter((x) => x !== id);
    return renderMgrResults(kind);
  }
  if (el.dataset.memberCheck) {
    const kind = el.dataset.memberCheck;
    const arr = st.mgr[kind].memberChecked;
    st.mgr[kind].memberChecked = el.checked
      ? [...new Set([...arr, el.dataset.id])]
      : arr.filter((item) => item !== el.dataset.id);
    return renderMgrLists(kind);
  }
  if (el.dataset.memberCheckall) {
    const kind = el.dataset.memberCheckall;
    st.mgr[kind].memberChecked = el.checked ? [...targetList(kind).items] : [];
    return renderMgrLists(kind);
  }
  if (el.dataset.checkall) {
    const kind = el.dataset.checkall;
    const vis = visibleItems(kind).map((u) => u.id);
    const cur = st.mgr[kind].checked.filter((x) => !vis.includes(x));
    st.mgr[kind].checked = el.checked ? [...cur, ...vis] : cur;
    return renderMgrResults(kind);
  }
});

// drag: tiles and panel headers (workspace), models (assign to instruments / portfolio)
document.addEventListener('dragstart', (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  const tile = el.closest('[data-tile]');
  if (tile) return e.dataTransfer.setData('text/plain', `new:${tile.dataset.tile}`);
  const head = el.closest('[data-move]');
  if (head) return e.dataTransfer.setData('text/plain', `move:${head.dataset.move}`);
  const model = el.closest('[data-drag]');
  if (model) e.dataTransfer.setData('text/plain', model.dataset.drag);
});

document.addEventListener('dragover', (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  const cell = el.closest('[data-cell]');
  const drop = el.closest('[data-drop-sym],[data-drop-portfolio]');
  if (cell || drop) e.preventDefault();
  if (cell) cell.classList.add('over');
  if (drop) drop.classList.add('over');
});

document.addEventListener('dragleave', (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  const t = el.closest('[data-cell],[data-drop-sym],[data-drop-portfolio]');
  if (t) t.classList.remove('over');
});

document.addEventListener('drop', (e) => {
  const el = e.target instanceof Element ? e.target : null;
  if (!el) return;
  const cell = el.closest('[data-cell]');
  const drop = el.closest('[data-drop-sym],[data-drop-portfolio]');
  if (cell) {
    e.preventDefault();
    cell.classList.remove('over');
    handleDrop(Number(cell.dataset.cell), e.dataTransfer.getData('text/plain'));
  } else if (drop) {
    e.preventDefault();
    drop.classList.remove('over');
    handleModelDrop(drop, e.dataTransfer.getData('text/plain'));
  }
});

document.addEventListener('dragend', () => {
  document.querySelectorAll('.over').forEach((c) => c.classList.remove('over'));
});

// ---- init ----
renderTiles();
renderApis();
renderSide();
$('#graph-a').innerHTML = spark([3, 5, 4, 7, 6, 9, 8, 11, 10, 12]);
$('#graph-b').innerHTML = spark([12, 11, 13, 10, 9, 10, 8, 7, 9, 6]);
$('#graph-c').innerHTML = spark([5, 5, 6, 8, 7, 7, 9, 9, 10, 10]);
setInterval(tickPerf, 1000);
renderAll();
