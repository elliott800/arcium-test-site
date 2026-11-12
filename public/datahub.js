const SECTIONS = [
  { id: 'home', title: 'Datahub overview', subtitle: 'Choose a data workspace to explore and manage.' },
  { id: 'recorder', title: 'Recorder', subtitle: 'Review recorded data or control the recording pipeline.' },
  { id: 'sources', title: 'Sources', subtitle: 'Inspect connected providers and configure source access.' },
  { id: 'warehouse', title: 'Warehouse', subtitle: 'Explore stored data or manage warehouse processing.' },
];

const SOURCES = {
  instrument: [
    { id: 'yahoo', label: 'Yahoo' },
    { id: 'webull', label: 'Webull' },
  ],
  reference: [
    { id: 'yahoo', label: 'Yahoo' },
    { id: 'fred', label: 'FRED' },
    { id: 'edgar', label: 'EDGAR' },
  ],
};

const INSTRUMENT_DATA = {
  yahoo: {
    Stock: {
      Spot: ['AAPL — Apple Inc.', 'MSFT — Microsoft Corp.', 'NVDA — NVIDIA Corp.'],
      Option: ['AAPL 2026-12-18 250C', 'MSFT 2027-01-15 500C'],
    },
    Commodity: { Spot: ['GC — Gold', 'CL — WTI Crude Oil'] },
    Currency: { Spot: ['EUR/USD', 'USD/JPY'] },
    Crypto: { Spot: ['BTC/USD', 'ETH/USD'] },
    Bond: { Spot: ['US 10Y Treasury'] },
    'Real estate': { Spot: ['VNQ — Vanguard Real Estate ETF'] },
    ETF: { Spot: ['SPY — SPDR S&P 500 ETF', 'QQQ — Invesco QQQ'] },
    ETN: { Spot: ['VXX — iPath Series B S&P 500 VIX ETN'] },
    Spread: { Option: ['SPY Dec 2026 600/650 call spread'] },
  },
  webull: {
    Stock: {
      Spot: ['AAPL — Apple Inc.', 'TSLA — Tesla Inc.', 'AMZN — Amazon.com Inc.'],
      Option: ['TSLA 2026-12-18 400C', 'AMZN 2027-01-15 250C'],
    },
    Commodity: { Future: ['GCZ6 — Gold Dec 2026', 'CLZ6 — WTI Crude Dec 2026'] },
    Currency: { Spot: ['EUR/USD'] },
    Crypto: { Spot: ['BTC/USD', 'ETH/USD'] },
    ETF: { Spot: ['SPY — SPDR S&P 500 ETF', 'IWM — iShares Russell 2000 ETF'] },
  },
};

const REFERENCE_DATA = {
  yahoo: {
    Structured: {
      'Economic benchmarks': ['US 10-Year Treasury Yield', 'S&P 500 Index'],
      'Financial statements': ['AAPL — Annual financials', 'MSFT — Quarterly financials'],
    },
    Unstructured: {
      'Text feed': ['Market news feed', 'Company headlines'],
    },
  },
  fred: {
    Structured: {
      'Economic benchmarks': ['CPIAUCSL — Consumer Price Index', 'UNRATE — Unemployment Rate', 'FEDFUNDS — Federal Funds Rate'],
    },
  },
  edgar: {
    Structured: {
      'Financial statements': ['AAPL — 10-K filings', 'MSFT — 10-Q filings', 'NVDA — Company facts'],
    },
    Unstructured: {
      'Text feed': ['SEC filing text', 'Company filing exhibits'],
    },
  },
};

const OPTION_DETAILS = {
  Yahoo: {
    AAPL: {
      'Dec 2026': {
        '$240': ['Greeks', 'Level 1', 'Level 2'],
        '$250': ['Greeks', 'Level 1', 'Level 2'],
      },
      'Jan 2027': {
        '$250': ['Greeks', 'Level 1'],
      },
    },
    MSFT: {
      'Jan 2027': {
        '$480': ['Greeks', 'Level 1'],
        '$500': ['Greeks', 'Level 1', 'Level 2'],
      },
    },
  },
  Webull: {
    TSLA: {
      'Dec 2026': {
        '$380': ['Greeks', 'Level 1', 'Level 2'],
        '$400': ['Greeks', 'Level 1'],
      },
      'Jan 2027': {
        '$400': ['Greeks', 'Level 1', 'Level 2'],
      },
    },
    AMZN: {
      'Jan 2027': {
        '$240': ['Greeks', 'Level 1'],
        '$250': ['Greeks', 'Level 1', 'Level 2'],
      },
    },
  },
};

const WAREHOUSE_SAMPLE_RATE_RANGES = {
  '1s': ['2025-01-03:2025-03-31', '2025-10-01:2026-11-10'],
  '1m': ['2025-01-03:2025-08-29', '2025-10-01:2026-11-10'],
  '5m': ['2025-05-12:2025-08-29', '2025-10-01:2026-11-10'],
  '1h': ['2025-01-03:2025-03-31', '2025-05-12:2026-11-10'],
};
const RECORDING_FREQUENCIES = ['1s', '5s', '15s', '1m', '5m', '15m', '1h', '1d'];
const OPTION_RECORDING_FREQUENCIES = ['1s', '1m', '5m', '1h'];
const DRILL_HUES = [8, 205, 132, 278, 42, 185, 322, 92, 238, 58];

const view = document.querySelector('#datahub-view');
const navigation = document.querySelector('#datahub-navigation');
let activeSection = 'home';
let activePanel = 'summary';
let recorderControllerView = 'builder';
let recorderRegistryView = 'sources';
let activeCategory = 'instrument';
let activeSource = 'all';
let expandedDrillKeys = new Set();
let drillStateContext = null;
let rainbowDrillColors = true;
let activeRatePickerKey = null;
let warehouseTagQuery = '';
let builderCategory = 'instrument';
let builderSource = 'yahoo';
let builderTagQuery = '';
let builderFilters = { include: new Set(), exclude: new Set() };
let builderSelections = new Set();
let builderDraftItems = new Set();
let builderDraftSelections = new Set();
let builderExpandedDrillKeys = new Set();
let builderItemRateOverrides = new Map();
let builderListName = '';
let builderStatusMessage = '';
const BUILDER_COLUMNS = [
  { id: 'item', label: 'Catalog item' },
  { id: 'category', label: 'Category' },
  { id: 'source', label: 'Source' },
  { id: 'tags', label: 'Tags' },
  { id: 'type', label: 'Item type' },
  { id: 'recorderAccess', label: 'Recorder access' },
];
let builderColumns = ['item', 'category', 'source', 'tags'];
let builderSort = { column: 'item', direction: 'asc' };
let draggedBuilderColumn = null;
const selectedBuilderAvailableColumns = new Set();
const selectedBuilderActiveColumns = new Set();
let recorderEnabled = false;
const sourceAccess = {
  yahoo: { recorder: true, warehouse: true },
  webull: { recorder: true, warehouse: true },
  fred: { recorder: true, warehouse: true },
  edgar: { recorder: true, warehouse: true },
};
let builtLists = createPremadeRecorderLists();
let recordingFrequencies = ['1m'];
let recordingSelections = new Set();
let recordingRateOverrides = new Map();
const sourceObjects = {
  yahoo: { mappings: [] },
  webull: { mappings: [] },
  fred: { mappings: [] },
  edgar: { mappings: [] },
};
let sourceFormProvider = 'yahoo';
let pendingSourceMapping = null;
let sourceTerminalHistory = [];
let ingesterTerminalHistory = [];
let selectedRegistryListName = '';

function createPremadeRecorderLists() {
  return [{
    name: 'Core Market Watch',
    category: 'instrument',
    sourceId: 'yahoo',
    source: 'Yahoo',
    items: [
      'Stock / Spot / AAPL — Apple Inc.',
      'Stock / Spot / MSFT — Microsoft Corp.',
      'Stock / Spot / NVDA — NVIDIA Corp.',
    ].map((label) => ({ label, tags: tagsFromText(label, 'yahoo', 'technology') })),
    frequencies: ['1m', '1h'],
    premade: true,
  }];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function sectionDetails(sectionId) {
  return SECTIONS.find((section) => section.id === sectionId);
}

function sourceList() {
  return [...new Map(Object.values(SOURCES).flat().map((source) => [source.id, source])).values()];
}

function sourceAccessEnabled(sourceId, channel) {
  return sourceAccess[sourceId]?.[channel] ?? false;
}

function dataSourcesForChannel(category, channel) {
  return dataSourcesFor(category).filter((source) => sourceAccessEnabled(source.id, channel));
}

function renderHeading(section) {
  return `
    <header class="page-heading">
      <div>
        <p class="eyebrow">ARCIUM DATAHUB</p>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.subtitle)}</p>
      </div>
    </header>
  `;
}

function homeCard(sectionId, icon, title, description) {
  return `
    <button class="home-card" type="button" data-open-section="${sectionId}">
      <span class="card-icon" aria-hidden="true">${icon}</span>
      <span><strong>${title}</strong><small>${description}</small></span>
      <span class="card-arrow" aria-hidden="true">↗</span>
    </button>
  `;
}

function renderHome() {
  return `
    ${renderHeading(sectionDetails('home'))}
    <div class="home-grid" aria-label="Datahub workspaces">
      ${homeCard('recorder', '◉', 'Recorder', 'Recording status, activity summary, and controls.')}
      ${homeCard('sources', '⇄', 'Sources', 'Connected providers, source health, and configuration.')}
      ${homeCard('warehouse', '▤', 'Warehouse', 'Stored data summaries and processing controls.')}
    </div>
  `;
}

function sectionTabs() {
  return `
    <div class="section-tabs" role="tablist" aria-label="${escapeHtml(sectionDetails(activeSection).title)} views">
      <button class="section-tab ${activePanel === 'summary' ? 'is-active' : ''}" type="button"
        role="tab" aria-selected="${activePanel === 'summary'}" data-panel="summary">Summary</button>
      <button class="section-tab ${activePanel === 'controller' ? 'is-active' : ''}" type="button"
        role="tab" aria-selected="${activePanel === 'controller'}" data-panel="controller">Controller</button>
    </div>
  `;
}

function dataSourcesFor(category) {
  if (category === 'all') {
    return [...new Map(Object.values(SOURCES).flat().map((source) => [source.id, source])).values()];
  }
  return SOURCES[category];
}

function renderFilters() {
  const accessChannel = activeSection === 'warehouse' ? 'warehouse' : 'recorder';
  const sources = dataSourcesForChannel(activeCategory, accessChannel);
  if (!sources.some((source) => source.id === activeSource) && activeSource !== 'all') activeSource = 'all';
  return `
    <div class="filter-row">
      <label class="filter-control">CATEGORY
        <select id="category-filter" aria-label="Select data category">
          ${activeSection === 'warehouse' ? `<option value="all" ${activeCategory === 'all' ? 'selected' : ''}>All data</option>` : ''}
          ${activeSection === 'recorder' ? `<option value="all" ${activeCategory === 'all' ? 'selected' : ''}>Both</option>` : ''}
          <option value="instrument" ${activeCategory === 'instrument' ? 'selected' : ''}>Instrument</option>
          <option value="reference" ${activeCategory === 'reference' ? 'selected' : ''}>Reference</option>
        </select>
      </label>
      <label class="filter-control">SOURCE
        <select id="source-filter" aria-label="Select data source">
          <option value="all" ${activeSource === 'all' ? 'selected' : ''}>All sources</option>
          ${sources.map((source) => `<option value="${source.id}" ${activeSource === source.id ? 'selected' : ''}>${source.label}</option>`).join('')}
        </select>
      </label>
      ${activeSection === 'warehouse' ? `
        <label class="filter-control warehouse-search-control">TAG SEARCH
          <input id="warehouse-tag-search" class="builder-input" type="search" value="${escapeHtml(warehouseTagQuery)}"
            placeholder='# stock option !# future # technology "Apple Inc."' aria-describedby="warehouse-search-help">
        </label>
      ` : ''}
    </div>
    ${activeSection === 'warehouse' ? '<p id="warehouse-search-help" class="tag-search-help">Use # for included tags and !# for excluded tags; switch between them as needed. Tags can be space- or comma-separated, and quoted text such as "Apple Inc." searches as a phrase.</p>' : ''}
  `;
}

function sourcesToRender(category = activeCategory, sourceId = null) {
  const accessChannel = activeSection === 'warehouse' ? 'warehouse' : 'recorder';
  if (sourceId) return dataSourcesFor(category).filter((source) => source.id === sourceId);
  return activeSource === 'all'
    ? dataSourcesForChannel(category, accessChannel)
    : dataSourcesForChannel(category, accessChannel).filter((source) => source.id === activeSource);
}

function tagsFromText(...values) {
  return values.flatMap((value) => String(value || '').toLowerCase().match(/[a-z0-9]+/g) || []);
}

function normalizeTag(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function parseTagQuery(value) {
  const parsed = { include: [], exclude: [], phrases: [] };
  let mode = null;
  const tokens = value.match(/!#|#|"(?:\\.|[^"\\])*"|[^\s,]+/g) || [];
  for (const rawToken of tokens) {
    if (rawToken === '#') {
      mode = 'include';
      continue;
    }
    if (rawToken === '!#') {
      mode = 'exclude';
      continue;
    }
    if (rawToken.startsWith('"')) {
      const phrase = rawToken.slice(1, -1).replace(/\\"/g, '"').trim().toLowerCase();
      if (phrase) parsed.phrases.push(phrase);
      continue;
    }
    if (rawToken.startsWith('!#')) {
      mode = 'exclude';
      const term = normalizeTag(rawToken.slice(2));
      if (term) parsed.exclude.push(term);
      continue;
    }
    if (rawToken.startsWith('#')) {
      mode = 'include';
      const term = normalizeTag(rawToken.slice(1));
      if (term) parsed.include.push(term);
      continue;
    }
    if (mode) {
      const term = normalizeTag(rawToken);
      if (term) parsed[mode].push(term);
    }
  }
  parsed.include = [...new Set(parsed.include)];
  parsed.exclude = [...new Set(parsed.exclude)];
  parsed.phrases = [...new Set(parsed.phrases)];
  return parsed;
}

function optionTree(sourceLabel, optionLabels) {
  const underlyings = new Set(optionLabels.map((label) => label.split(/\s+/)[0]));
  return [...underlyings].map((underlying) => ({
    label: underlying,
    source: sourceLabel,
    tags: tagsFromText(underlying, sourceLabel, 'technology'),
    children: Object.entries(OPTION_DETAILS[sourceLabel]?.[underlying] || {}).map(([expiration, strikes]) => ({
      label: expiration,
      tags: tagsFromText(expiration),
      children: Object.entries(strikes).map(([strike, dataTypes]) => ({
        label: `Strike ${strike}`,
        source: sourceLabel,
        tags: tagsFromText(strike, ...dataTypes, ...OPTION_RECORDING_FREQUENCIES),
        frequencies: OPTION_RECORDING_FREQUENCIES,
        leaf: true,
      })),
    })),
  }));
}

function collectInstrumentRows(category = 'instrument', sourceId = null) {
  const groups = new Map();
  for (const source of sourcesToRender(category, sourceId)) {
    const catalog = INSTRUMENT_DATA[source.id] || {};
    for (const [type, forms] of Object.entries(catalog)) {
      if (!groups.has(type)) groups.set(type, new Map());
      const formGroups = groups.get(type);
      for (const [form, instruments] of Object.entries(forms)) {
        if (!formGroups.has(form)) formGroups.set(form, []);
        if (form === 'Option') {
          formGroups.get(form).push(...optionTree(source.label, instruments));
          continue;
        }
        for (const item of instruments) {
          if (!formGroups.get(form).some((entry) => entry.label === item)) {
            formGroups.get(form).push({
              label: item,
              source: source.label,
              frequencies: RECORDING_FREQUENCIES,
              tags: tagsFromText(type, form, item, source.label, /AAPL|MSFT|NVDA|TSLA|AMZN/.test(item) ? 'technology' : ''),
              leaf: true,
            });
          }
        }
      }
    }
  }
  return [...groups.entries()].map(([type, forms]) => ({
    label: type,
    tags: tagsFromText(type),
    count: [...forms.values()].reduce((total, items) => total + items.length, 0),
    children: [...forms.entries()].map(([form, instruments]) => ({
      label: form,
      tags: tagsFromText(form),
      count: instruments.length,
      children: instruments,
    })),
  }));
}

function collectReferenceRows(category = 'reference', sourceId = null) {
  const structures = new Map();
  for (const source of sourcesToRender(category, sourceId)) {
    const catalog = REFERENCE_DATA[source.id] || {};
    for (const [structure, groups] of Object.entries(catalog)) {
      if (!structures.has(structure)) structures.set(structure, new Map());
      const groupMap = structures.get(structure);
      for (const [group, items] of Object.entries(groups)) {
        if (!groupMap.has(group)) groupMap.set(group, []);
        for (const item of items) {
          if (!groupMap.get(group).some((entry) => entry.label === item)) {
            groupMap.get(group).push({
              label: item,
              source: source.label,
              tags: tagsFromText(structure, group, item, source.label),
              leaf: true,
            });
          }
        }
      }
    }
  }
  return [...structures.entries()].map(([structure, groups]) => ({
    label: structure,
    tags: tagsFromText(structure),
    count: [...groups.values()].reduce((total, items) => total + items.length, 0),
    children: [...groups.entries()].map(([group, items]) => ({
      label: group,
      tags: tagsFromText(group),
      count: items.length,
      children: items.map((item) => ({ ...item, leaf: true })),
    })),
  }));
}

function withWarehouseDateRanges(rows) {
  return rows.map((row) => {
    if (row.leaf) {
      const frequencies = row.frequencies || ['1m', '5m', '1h'];
      const dateRanges = frequencies.flatMap((frequency) =>
        (WAREHOUSE_SAMPLE_RATE_RANGES[frequency] || []).map((range) => ({
          label: `${frequency} · ${range}`,
          source: row.source,
          tags: tagsFromText('date range', frequency, range),
          leaf: true,
        })));
      return {
        ...row,
        frequencies,
        children: dateRanges,
      };
    }
    return { ...row, children: row.children ? withWarehouseDateRanges(row.children) : undefined };
  });
}

function filterRowsByTags(rows, parsedQuery, inheritedTags = [], inheritedText = '') {
  return rows.flatMap((row) => {
    const tags = [...inheritedTags, ...(row.tags || []), ...tagsFromText(row.label, row.source)];
    const searchText = `${inheritedText} ${row.label || ''} ${row.source || ''} ${(row.tags || []).join(' ')}`.toLowerCase();
    if (row.leaf) {
      const normalizedTags = new Set(tags.map(normalizeTag));
      const matchesIncludes = parsedQuery.include.every((tag) => normalizedTags.has(tag));
      const matchesExcludes = parsedQuery.exclude.every((tag) => !normalizedTags.has(tag));
      const matchesPhrases = parsedQuery.phrases.every((phrase) => searchText.includes(phrase));
      if (!matchesIncludes || !matchesExcludes || !matchesPhrases) return [];
      return [{ ...row, children: row.children ? filterRowsByTags(row.children, parsedQuery, tags, searchText) : undefined }];
    }
    const children = row.children ? filterRowsByTags(row.children, parsedQuery, tags, searchText) : [];
    if (children.length === 0) return [];
    return [{ ...row, children, count: children.reduce((total, child) => total + (child.count || (child.leaf ? 1 : 0)), 0) }];
  });
}

function selectionKey(path, index) {
  return `${path}-${index}`;
}

function renderRecordCheckbox(key, depth) {
  if (activeSection !== 'recorder' && activeSection !== 'warehouse') return '';
  const purpose = activeSection === 'warehouse' ? 'warehouse data' : 'recording';
  return `<input class="row-select" type="checkbox" data-record-key="${key}" aria-label="Select ${escapeHtml(key)} for ${purpose}" style="margin-left:${depth * 12}px">`;
}

function drillLightness(depth) {
  return depth === 0 ? 26 : Math.min(93, 72 + (depth - 1) * 9);
}

function drillSaturation(depth) {
  return depth === 0 ? 58 : Math.max(12, 30 - (depth - 1) * 8);
}

function drillTextColor(hue, lightness, depth, columnIndex) {
  const saturation = drillSaturation(depth);
  const cellSaturation = columnIndex === 0 || columnIndex >= 4
    ? saturation : Math.max(0, saturation - columnIndex * 3);
  const cellLightness = Math.min(93, lightness + (columnIndex === 0 || columnIndex >= 4 ? 0 : columnIndex * 2));
  const h = hue / 60;
  const chroma = (1 - Math.abs(2 * cellLightness / 100 - 1)) * cellSaturation / 100;
  const x = chroma * (1 - Math.abs(h % 2 - 1));
  const match = cellLightness / 100 - chroma / 2;
  const rgb = h < 1 ? [chroma, x, 0] : h < 2 ? [x, chroma, 0]
    : h < 3 ? [0, chroma, x] : h < 4 ? [0, x, chroma]
      : h < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const linear = rgb.map((value) => {
    const channel = value + match;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const rowLuminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const dark = [52, 64, 51].map((value) => {
    const channelValue = value / 255;
    return channelValue <= 0.04045 ? channelValue / 12.92 : ((channelValue + 0.055) / 1.055) ** 2.4;
  });
  const darkLuminance = 0.2126 * dark[0] + 0.7152 * dark[1] + 0.0722 * dark[2];
  const whiteContrast = 1.05 / (rowLuminance + 0.05);
  const darkContrast = (rowLuminance + 0.05) / (darkLuminance + 0.05);
  return whiteContrast >= darkContrast ? '#fff' : '#344033';
}

function selectedRatesForRow(key, row) {
  const override = recordingRateOverrides.get(key);
  const available = row.frequencies || [];
  return override ? available.filter((frequency) => override.has(frequency))
    : available.filter((frequency) => recordingFrequencies.includes(frequency));
}

function renderInstrumentRateOptions(row, key, includeRecordingControls = activeSection === 'recorder' || activeSection === 'warehouse') {
  if (!includeRecordingControls) return '';
  if (!row.frequencies?.length || row.sampleRate) return '<span class="rate-cell-empty">—</span>';
  const warehouseMode = activeSection === 'warehouse';
  const selectedRates = warehouseMode ? row.frequencies : selectedRatesForRow(key, row);
  const rateLabel = selectedRates.length ? selectedRates.join(', ') : 'None selected';
  const action = warehouseMode ? 'View stored rates' : 'Choose recording rates';
  return `<button type="button" class="rate-picker-button" data-rate-picker="${escapeHtml(key)}" aria-label="${action} for ${escapeHtml(row.label)}"><span>${escapeHtml(rateLabel)}</span><small>${warehouseMode ? 'View' : 'Choose'}</small></button>`;
}

function renderRatePickerDialog(rows) {
  if ((activeSection !== 'recorder' && activeSection !== 'warehouse') || !activeRatePickerKey) return '';
  const row = findRowBySelectionKey(rows, activeRatePickerKey);
  if (!row?.frequencies?.length) return '';
  const warehouseMode = activeSection === 'warehouse';
  const selectedRates = warehouseMode ? row.frequencies : selectedRatesForRow(activeRatePickerKey, row);
  return `
    <dialog class="rate-picker-dialog" data-rate-picker-dialog aria-labelledby="rate-picker-title">
      <form method="dialog" class="rate-picker-form">
        <div class="rate-picker-heading">
          <div><h4 id="rate-picker-title">${warehouseMode ? 'Stored recording rates' : 'Recording rates'}</h4><p>${escapeHtml(row.label)} · ${warehouseMode ? 'Warehouse rates are view-only. Manage recording rates in Recorder.' : `${escapeHtml(row.source || 'Source')} allows these rates`}</p></div>
          <button type="submit" class="rate-picker-close" data-close-rate-picker aria-label="Close rate picker">×</button>
        </div>
        <div class="rate-picker-options ${warehouseMode ? 'rate-picker-options--stored' : 'rate-picker-options--cards'}">
          ${row.frequencies.map((frequency) => `<label class="${selectedRates.includes(frequency) ? 'is-selected' : ''}"><input type="checkbox" data-instrument-frequency="${escapeHtml(frequency)}" data-instrument-rate-key="${escapeHtml(activeRatePickerKey)}" ${selectedRates.includes(frequency) ? 'checked' : ''} ${warehouseMode ? 'disabled' : ''}>${escapeHtml(frequency)}</label>`).join('')}
        </div>
        <button type="submit" class="builder-action" data-close-rate-picker>Done</button>
      </form>
    </dialog>
  `;
}

function captureRateSummary(rows) {
  const capturedRates = new Set();
  let selectedItems = 0;
  const visit = (items, path = 'root') => items.forEach((row, index) => {
    const key = selectionKey(path, index);
    if (row.children?.length) {
      visit(row.children, key);
      return;
    }
    if (row.frequencies?.length && recordingSelections.has(key)) {
      const selectedRates = selectedRatesForRow(key, row);
      if (selectedRates.length) selectedItems += 1;
      selectedRates.forEach((frequency) => capturedRates.add(frequency));
    }
  });
  visit(rows);
  return {
    selectedItems,
    rates: RECORDING_FREQUENCIES.filter((frequency) => capturedRates.has(frequency)),
  };
}

function formatForRow(row) {
  if (row.format) return row.format;
  const tags = new Set(row.tags || []);
  if (tags.has('unstructured')) return 'Unstructured';
  if (tags.has('structured')) return 'Structured';
  if (tags.has('greeks')) return 'Greeks';
  if (tags.has('level')) return 'Market data';
  return 'Time series';
}

function renderDrillRows(rows, path = 'root', depth = 0, parentHue = null, viewMode = 'summary') {
  return rows.map((row, index) => {
    const registryMode = viewMode === 'registry';
    const key = selectionKey(path, index);
    const hue = parentHue === null ? DRILL_HUES[index % DRILL_HUES.length] : parentHue;
    const lightness = drillLightness(depth);
    const saturation = drillSaturation(depth);
    const yellowShift = Math.max(0, depth - 4) / 3;
    const displayHue = (hue + ((52 - hue + 360) % 360) * yellowShift) % 360;
    const expandable = Array.isArray(row.children) && row.children.length > 0;
    const checked = expandable ? branchIsFullySelected(row, key) : recordingSelections.has(key);
    const partiallyChecked = expandable && branchHasSelection(row, key) && !checked;
    const checkbox = registryMode
      ? ''
      : renderRecordCheckbox(key, depth)
        .replace('style=', `${checked ? 'checked ' : ''}${partiallyChecked ? 'aria-checked="mixed" ' : ''}style=`);
    const hasRateColumn = (activeSection === 'recorder' || activeSection === 'warehouse') && !registryMode;
    const columnCount = hasRateColumn ? 5 : 4;
    const childRows = expandable
      ? `<tr class="child-row" data-parent="${key}" id="children-${key}" hidden><td colspan="${columnCount}" class="nested-cell"><table class="nested-table"><tbody>${renderDrillRows(row.children, key, depth + 1, displayHue, viewMode)}</tbody></table></td></tr>`
      : '';
    const nameCell = expandable
      ? `<div class="drill-row-wrap">${checkbox}<button class="drill-row" style="padding-left:${12 + depth * 20}px" type="button" data-drill-key="${key}" aria-expanded="false" aria-controls="children-${key}">
          <span class="drill-chevron" aria-hidden="true">›</span><span>${escapeHtml(row.label)}</span>
          <span class="drill-count">${row.count ?? row.children.length}</span>
        </button></div>`
      : `<div class="drill-row drill-leaf" style="padding-left:${12 + depth * 20}px">
          ${checkbox}<span class="drill-chevron" aria-hidden="true">•</span><span>${escapeHtml(row.label)}</span>
          ${row.source ? `<span class="source-pill">${escapeHtml(row.source)}</span>` : ''}
        </div>`;
    const contents = row.leaf && expandable
      ? `${row.children.length} stored date ranges · Frequencies: ${row.frequencies?.join(', ')}`
      : row.frequencies?.length
        ? `Frequencies: ${row.frequencies.join(', ')}`
      : expandable ? 'Expand to drill down' : (row.leaf ? 'Available' : 'No records');
    const rowContents = row.mapDetails
      ? escapeHtml(row.mapDetails)
      : registryMode && row.contents ? escapeHtml(row.contents) : contents;
    return `
      <tr data-drill-row data-depth="${depth}" style="--row-hue:${displayHue};--row-saturation:${saturation}%;--row-lightness:${lightness}%"><td style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 0)}">${nameCell}</td><td style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 1)}">${escapeHtml(row.source || '—')}</td><td style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 2)}">${escapeHtml(formatForRow(row))}</td><td style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 3)}">${rowContents}</td>${hasRateColumn ? `<td class="rate-picker-cell" style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 4)}">${renderInstrumentRateOptions(row, key)}</td>` : ''}</tr>
      ${childRows}
    `;
  }).join('');
}

function summaryRows() {
  if (activeSection === 'warehouse') {
    const categories = activeCategory === 'all' ? ['instrument', 'reference'] : [activeCategory];
    return categories.map((category) => {
      const sourceRows = sourcesToRender(category).map((source) => {
        const catalogRows = category === 'instrument'
          ? collectInstrumentRows(category, source.id)
          : collectReferenceRows(category, source.id);
        return {
          label: source.label,
          source: source.label,
          tags: tagsFromText(source.label, 'source'),
          count: catalogRows.reduce((total, row) => total + (row.count || (row.leaf ? 1 : 0)), 0),
          children: catalogRows,
        };
      });
      if (activeCategory !== 'all') return sourceRows;
      return sourceRows.length ? [{
        label: category === 'instrument' ? 'Instrument' : 'Reference',
        tags: [category],
        count: sourceRows.reduce((total, row) => total + row.count, 0),
        children: sourceRows,
      }] : [];
    }).flat();
  }
  if (activeCategory === 'instrument') return [
    ...collectInstrumentRows(),
  ];
  if (activeCategory === 'reference') return [
    ...collectReferenceRows(),
  ];
  return [
    { label: 'Instrument', tags: ['instrument'], children: collectInstrumentRows() },
    { label: 'Reference', tags: ['reference'], children: collectReferenceRows() },
  ].filter((row) => row.children.length > 0);
}

function visibleSummaryRows() {
  const rows = summaryRows();
  if (activeSection !== 'warehouse') return rows;
  return filterRowsByTags(withWarehouseDateRanges(rows), parseTagQuery(warehouseTagQuery));
}

function setBranchSelection(rows, targetKey, checked, path = 'root') {
  let found = false;
  rows.forEach((row, index) => {
    const key = selectionKey(path, index);
    if (key === targetKey) {
      const applyToBranch = (branch, branchPath) => {
        branch.forEach((child, childIndex) => {
          const childKey = selectionKey(branchPath, childIndex);
          if (checked) recordingSelections.add(childKey);
          else recordingSelections.delete(childKey);
          if (child.children) applyToBranch(child.children, childKey);
        });
      };
      if (checked) recordingSelections.add(key);
      else recordingSelections.delete(key);
      if (row.children) applyToBranch(row.children, key);
      found = true;
      return;
    }
    if (!found && row.children) found = setBranchSelection(row.children, targetKey, checked, key);
  });
  return found;
}

function branchIsFullySelected(row, key) {
  if (!row.children?.length) return recordingSelections.has(key);
  return row.children.every((child, index) => branchIsFullySelected(child, selectionKey(key, index)));
}

function branchHasSelection(row, key) {
  if (recordingSelections.has(key)) return true;
  return row.children?.some((child, index) => branchHasSelection(child, selectionKey(key, index))) || false;
}

function findRowBySelectionKey(rows, targetKey, path = 'root') {
  for (const [index, row] of rows.entries()) {
    const key = selectionKey(path, index);
    if (key === targetKey) return row;
    if (row.children) {
      const found = findRowBySelectionKey(row.children, targetKey, key);
      if (found) return found;
    }
  }
  return null;
}

function renderRecordingControls(rows) {
  const rateSummary = captureRateSummary(rows);
  const allFrequenciesSelected = recordingFrequencies.length === RECORDING_FREQUENCIES.length;
  return `
    <section class="recorder-tools" aria-label="Recording controls">
      <div class="recorder-tools-heading">
        <div><h4>Recording controls</h4><p>Choose what to record and how often. These controls apply to this table.</p></div>
        <span class="recording-status ${recorderEnabled ? 'is-running' : ''}">${recorderEnabled ? 'Recording on' : 'Recording off'}</span>
      </div>
      <div class="recorder-filter-row">${renderFilters()}</div>
      <div class="recorder-control-row">
        <div class="recorder-master">
          <div><strong>Master recording</strong><small>Turn recording on or off for selected items.</small></div>
          <button class="switch" type="button" role="switch" aria-checked="${recorderEnabled}" aria-label="${recorderEnabled ? 'Pause recording' : 'Start recording'}" data-switch="recorder"></button>
        </div>
        <details class="frequency-dropdown">
          <summary>Data rates <span class="frequency-count">${recordingFrequencies.length} of ${RECORDING_FREQUENCIES.length} selected</span></summary>
          <div class="frequency-options">
            <label class="frequency-master-option"><input type="checkbox" data-frequency-master ${allFrequenciesSelected ? 'checked' : ''} aria-checked="${allFrequenciesSelected ? 'true' : recordingFrequencies.length ? 'mixed' : 'false'}"> All data rates</label>
            ${RECORDING_FREQUENCIES.map((frequency) => `<label><input type="checkbox" data-frequency="${frequency}" ${recordingFrequencies.includes(frequency) ? 'checked' : ''}> ${frequency}</label>`).join('')}
          </div>
        </details>
      </div>
      <p class="capture-rate-summary" role="status" aria-live="polite">
        <strong>${rateSummary.selectedItems} instrument${rateSummary.selectedItems === 1 ? '' : 's'} selected</strong>
        · Rates: ${rateSummary.rates.length ? rateSummary.rates.join(', ') : 'none'}
        · ${recorderEnabled && rateSummary.selectedItems ? 'Recording these rates' : recorderEnabled ? 'Choose instruments to start capture' : 'Recorder paused'}
      </p>
    </section>
  `;
}

function countVisibleItems(rows) {
  return rows.reduce((total, row) => {
    if (Number.isFinite(row.count)) return total + row.count;
    if (row.leaf) return total + 1;
    return total + countVisibleItems(row.children || []);
  }, 0);
}

function renderSummary() {
  if (activeSection === 'sources') return renderSourceSummary();
  const rows = visibleSummaryRows();
  const itemCount = countVisibleItems(rows);
  const activeSourceCount = activeCategory === 'all'
    ? new Set([...sourcesToRender('instrument'), ...sourcesToRender('reference')].map((source) => source.id)).size
    : sourcesToRender().length;
  const tableContent = rows.length
    ? renderDrillRows(rows)
    : `<tr><td colspan="${activeSection === 'recorder' || activeSection === 'warehouse' ? 5 : 4}"><div class="empty-state">No data matches these filters. Try a different source or tag search.</div></td></tr>`;
  const recorderTools = activeSection === 'recorder' ? renderRecordingControls(rows) : '';
  const ratePicker = activeSection === 'recorder' || activeSection === 'warehouse' ? renderRatePickerDialog(rows) : '';
  return `
    ${sectionTabs()}
    <section class="panel" aria-label="${escapeHtml(sectionDetails(activeSection).title)} summary">
      <div class="panel-heading">
        <div><h3>${escapeHtml(sectionDetails(activeSection).title)} ${activeSection === 'warehouse' ? 'Data Viewer' : 'Summary'}</h3>
          <p>${activeSection === 'warehouse'
    ? 'Search recorded data by tags, then expand sources and instruments to inspect sample rates and their stored date intervals.'
    : 'Choose a category and source, then expand a row to drill into its contents.'}</p></div>
      </div>
      <div class="summary-overview-heading"><h4>Current view</h4><span>${activeCategory === 'all' ? (activeSection === 'recorder' ? 'Instrument + Reference' : 'All data') : activeCategory === 'instrument' ? 'Instrument data' : 'Reference data'} · ${activeSource === 'all' ? 'All sources' : escapeHtml(sourcesToRender().find((source) => source.id === activeSource)?.label || activeSource)}</span></div>
      <div class="summary-cards">
        <div class="summary-stat"><span>Top-level groups</span><strong>${rows.length}</strong></div>
        <div class="summary-stat"><span>${activeSection === 'warehouse' ? 'Matching items' : 'Items in view'}</span><strong>${itemCount}</strong></div>
        <div class="summary-stat"><span>Available sources</span><strong>${activeSourceCount}</strong></div>
      </div>
      ${recorderTools}
      <div class="table-view-controls">
        ${activeSection === 'recorder' || activeSection === 'warehouse' ? `<label class="select-all-control"><input type="checkbox" data-select-all ${rows.length > 0 && rows.every((row, index) => branchIsFullySelected(row, selectionKey('root', index))) ? 'checked' : ''}> Select all ${activeSection === 'warehouse' ? 'data' : 'items'} in this view</label>` : ''}
        <label class="rainbow-toggle"><input type="checkbox" data-rainbow-drill ${rainbowDrillColors ? 'checked' : ''}> Rainbow drill colors</label>
      </div>
      ${activeSection === 'warehouse' ? `
        <div class="warehouse-table-filters">
          ${renderFilters()}
          <p class="tag-query-example">Example: <code># stock option !# future # technology</code> includes stock, option, and technology tags while excluding futures. Quote text phrases, for example <code>"Apple Inc."</code>.</p>
        </div>
      ` : ''}
      <div class="drill-table-wrap">
        <table class="drill-table ${rainbowDrillColors ? 'rainbow-mode' : ''}">
          <thead><tr><th scope="col">${activeSection === 'warehouse' ? 'Warehouse drill table' : 'Drill table'}</th><th scope="col">Source</th><th scope="col">Format</th><th scope="col">Contents</th>${activeSection === 'recorder' || activeSection === 'warehouse' ? `<th scope="col">${activeSection === 'warehouse' ? 'Recording frequency' : 'Rates'}</th>` : ''}</tr></thead>
          <tbody>${tableContent}</tbody>
        </table>
      </div>
      ${ratePicker}
    </section>
  `;
}

function controllerCard(title, description, checked, id) {
  return `
    <div class="controller-card">
      <div><strong>${title}</strong><small>${description}</small></div>
      <button class="switch" type="button" role="switch" aria-checked="${checked}" aria-label="${title}" data-switch="${id}"></button>
    </div>
  `;
}

function renderSourceMappings() {
  const mappings = sourceObjects[sourceFormProvider].mappings;
  if (mappings.length === 0) return '<p class="empty-state">No source map rows yet. Draft and approve a mapping to build this drill table.</p>';
  const categories = new Map();
  mappings.forEach((mapping, index) => {
    if (!categories.has(mapping.category)) categories.set(mapping.category, new Map());
    const groups = categories.get(mapping.category);
    if (!groups.has(mapping.group)) groups.set(mapping.group, []);
    groups.get(mapping.group).push({ ...mapping, sourceMapIndex: index });
  });
  const rows = [...categories].map(([category, groups]) => ({
    label: category,
    count: [...groups.values()].reduce((total, items) => total + items.length, 0),
    children: [...groups].map(([group, items]) => ({
      label: group,
      count: items.length,
      children: items.map((mapping) => ({
        label: `${mapping.method || 'GET'} ${mapping.request || '(request not set)'}`,
        source: sourceFormProvider.toUpperCase(),
        format: mapping.format,
        tags: sourceMappingTags(mapping),
        mapDetails: `${mapping.key} → ${mapping.column}${mapping.form ? ` · ${mapping.form}` : ''} · tags: ${sourceMappingTags(mapping).join(', ')}`,
        leaf: true,
        sourceMapIndex: mapping.sourceMapIndex,
      })),
    })),
  }));
  return `<div class="drill-table-wrap source-map-table-wrap"><table class="drill-table source-map-table"><thead><tr><th>Source map drill table</th><th>Source</th><th>Format</th><th>Mapped fields and tags</th><th>Action</th></tr></thead><tbody>${renderSourceMapRows(rows)}</tbody></table></div>`;
}

function renderSourceMapRows(rows, path = `map-${sourceFormProvider}`, depth = 0, parentHue = null) {
  return rows.map((row, index) => {
    const key = selectionKey(path, index);
    const hue = parentHue === null ? DRILL_HUES[index % DRILL_HUES.length] : parentHue;
    const lightness = drillLightness(depth);
    const saturation = drillSaturation(depth);
    const yellowShift = Math.max(0, depth - 4) / 3;
    const displayHue = (hue + ((52 - hue + 360) % 360) * yellowShift) % 360;
    const expandable = Boolean(row.children?.length);
    const details = row.mapDetails || '';
    const label = expandable
      ? `<button class="drill-row" type="button" data-drill-key="${key}" aria-expanded="false" aria-controls="children-${key}"><span class="drill-chevron" aria-hidden="true">›</span><span>${escapeHtml(row.label)}</span><span class="drill-count">${row.count}</span></button>`
      : `<div class="drill-row drill-leaf"><span class="drill-chevron" aria-hidden="true">•</span><span>${escapeHtml(row.label)}</span></div>`;
    const nested = expandable
      ? `<tr class="child-row" id="children-${key}" hidden><td colspan="5" class="nested-cell"><table class="nested-table"><tbody>${renderSourceMapRows(row.children, key, depth + 1, displayHue)}</tbody></table></td></tr>`
      : '';
    return `<tr data-drill-row data-depth="${depth}" style="--row-hue:${displayHue};--row-saturation:${saturation}%;--row-lightness:${lightness}%"><td style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 0)}">${label}</td><td style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 1)}">${escapeHtml(row.source || '—')}</td><td style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 2)}">${escapeHtml(row.format || '—')}</td><td class="source-map-details" style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 3)}">${escapeHtml(details || 'Expand to inspect mappings')}</td><td style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 4)}">${Number.isInteger(row.sourceMapIndex) ? `<button type="button" class="secondary-action" data-remove-mapping="${row.sourceMapIndex}">Remove</button>` : ''}</td></tr>${nested}`;
  }).join('');
}

function sourceMappingTags(mapping) {
  return [...new Set(tagsFromText(
    sourceFormProvider,
    mapping.request,
    mapping.key,
    mapping.category,
    mapping.group,
    mapping.form,
    mapping.column,
    mapping.format,
    mapping.tags,
  ))];
}

function renderSourceSummary() {
  const sources = sourceList();
  return `
    ${sectionTabs()}
    <section class="panel source-summary-panel" aria-label="Source mappings summary">
      <div class="panel-heading"><div><h3>Source Summary</h3><p>Track endpoint access, configured Recorder/Warehouse mappings, and each source map's readiness.</p></div></div>
      <div class="source-summary-table-wrap"><table class="source-summary-table source-operations-table"><thead><tr><th>Source</th><th>Recorder status</th><th>Recorder endpoints</th><th>Warehouse status</th><th>Warehouse endpoints</th><th>Map endpoints</th><th>Map status</th></tr></thead><tbody>
        ${sources.map((source) => {
    const mappings = sourceObjects[source.id].mappings;
    return `<tr><td><strong>${escapeHtml(source.label)}</strong></td><td><span class="endpoint-status ${sourceAccessEnabled(source.id, 'recorder') ? 'is-on' : 'is-off'}">${sourceAccessEnabled(source.id, 'recorder') ? 'On' : 'Off'}</span></td><td>${mappings.length} configured</td><td><span class="endpoint-status ${sourceAccessEnabled(source.id, 'warehouse') ? 'is-on' : 'is-off'}">${sourceAccessEnabled(source.id, 'warehouse') ? 'On' : 'Off'}</span></td><td>${mappings.length} configured</td><td>${mappings.length} configured</td><td>${mappings.length ? 'Mapped' : 'Needs map'}</td></tr>`;
  }).join('')}
      </tbody></table></div>
      <div class="source-summary-grid">
        ${sources.map((source) => {
    const mappings = sourceObjects[source.id].mappings;
    return `<article class="source-summary-card">
            <header><div><h4>${escapeHtml(source.label)}</h4><p>${source.id === 'yahoo' ? 'Instrument and Reference' : source.id === 'webull' ? 'Instrument' : 'Reference'} · ${mappings.length} mapped request${mappings.length === 1 ? '' : 's'}</p></div>
              <button type="button" class="secondary-action" data-edit-source="${source.id}">Configure source</button></header>
            ${mappings.length ? `<div class="source-summary-table-wrap"><table class="source-summary-table"><thead><tr><th>Request</th><th>Response key</th><th>Site category</th><th>Format</th><th>Tags</th></tr></thead><tbody>
              ${mappings.map((mapping) => `<tr><td>${escapeHtml(mapping.method || 'GET')} ${escapeHtml(mapping.request || '—')}</td><td>${escapeHtml(mapping.key)}</td><td>${escapeHtml(mapping.category)} / ${escapeHtml(mapping.group)}${mapping.form ? ` / ${escapeHtml(mapping.form)}` : ''}</td><td>${escapeHtml(mapping.format)}</td><td>${escapeHtml(sourceMappingTags(mapping).join(', '))}</td></tr>`).join('')}
            </tbody></table></div>` : '<p class="source-no-mappings">No request mappings configured. Configure this source to define its request keys and category mapping.</p>'}
          </article>`;
  }).join('')}
      </div>
      <p class="source-summary-note">Source mappings define requests for Recorder collection lists. They do not indicate that data has already been stored; see Warehouse Summary for recorded inventory.</p>
    </section>
  `;
}

function availableCatalogItems(category, sourceId) {
  const source = dataSourcesForChannel(category, 'recorder').find((item) => item.id === sourceId);
  if (!source) return [];
  if (category === 'instrument') {
    const catalog = INSTRUMENT_DATA[sourceId] || {};
    return Object.entries(catalog).flatMap(([type, forms]) =>
      Object.entries(forms).flatMap(([form, instruments]) =>
        instruments.map((instrument) => `${type} / ${form} / ${instrument}`)));
  }
  const catalog = REFERENCE_DATA[sourceId] || {};
  return Object.entries(catalog).flatMap(([structure, groups]) =>
    Object.entries(groups).flatMap(([group, items]) =>
      items.map((item) => `${structure} / ${group} / ${item}`)));
}

function builderCatalogRows() {
  const query = parseTagQuery(builderTagQuery);
  const searchTokens = [];
  let tagMode = null;
  for (const token of builderTagQuery.match(/!#|#|"(?:\\.|[^"\\])*"|[^\s,]+/g) || []) {
    if (token === '#') {
      tagMode = 'include';
      continue;
    }
    if (token === '!#') {
      tagMode = 'exclude';
      continue;
    }
    if (token.startsWith('#') || token.startsWith('!#') || token.startsWith('"')) continue;
    if (tagMode === null) searchTokens.push(token.toLowerCase());
  }
  const sourceLabel = sourceList().find((source) => source.id === builderSource)?.label || builderSource;
  return availableCatalogItems(builderCategory, builderSource).filter((label) => {
    const tags = new Set(tagsFromText(
      label,
      builderSource,
      sourceLabel,
      builderCategory,
      /AAPL|MSFT|NVDA|TSLA|AMZN/.test(label) ? 'technology' : '',
    ));
    const searchText = `${label} ${sourceLabel} ${builderCategory} ${[...tags].join(' ')}`.toLowerCase();
    if (![...query.include, ...builderFilters.include].every((tag) => tags.has(tag))) return false;
    if ([...query.exclude, ...builderFilters.exclude].some((tag) => tags.has(tag))) return false;
    if (!query.phrases.every((phrase) => label.toLowerCase().includes(phrase))) return false;
    if (!searchTokens.every((token) => searchText.includes(token))) return false;
    return true;
  }).sort((left, right) => {
    const leftValue = builderColumnValue(left, builderSort.column);
    const rightValue = builderColumnValue(right, builderSort.column);
    const comparison = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
    return builderSort.direction === 'asc' ? comparison : -comparison;
  });
}

function selectedBundleIncludes(label) {
  const list = builtLists.find((item) => item.name === selectedRegistryListName);
  return Boolean(list?.items.some((item) => item.label === label));
}

function builderColumnValue(label, column) {
  const sourceLabel = sourceList().find((source) => source.id === builderSource)?.label || builderSource;
  const values = {
    item: label,
    category: builderCategory === 'instrument' ? 'Instrument' : 'Reference',
    source: sourceLabel,
    tags: [...new Set(tagsFromText(
      label,
      builderSource,
      sourceLabel,
      builderCategory,
      /AAPL|MSFT|NVDA|TSLA|AMZN/.test(label) ? 'technology' : '',
    ))].sort().join(', '),
    type: (() => {
      const tags = tagsFromText(label);
      return ['option', 'future', 'stock', 'rate', 'yield', 'filing', 'reference']
        .find((tag) => tags.includes(tag)) || 'Catalog item';
    })(),
    recorderAccess: sourceAccessEnabled(builderSource, 'recorder') ? 'Enabled' : 'Off',
  };
  return values[column] || '';
}

function renderBuilderFilterChips() {
  return [...builderFilters.include].map((tag) => ({ type: 'include', tag, prefix: '#' }))
    .concat([...builderFilters.exclude].map((tag) => ({ type: 'exclude', tag, prefix: '!#' })))
    .map(({ type, tag, prefix }) => `<span class="chip">${prefix}${escapeHtml(tag)}
      <button type="button" data-builder-remove-filter="${type}:${escapeHtml(tag)}" aria-label="Remove ${prefix}${escapeHtml(tag)}">×</button>
    </span>`).join('');
}

function renderBuilderColumnDialog() {
  return `<dialog id="builder-columns-dialog" class="builder-columns-dialog">${renderBuilderColumnDialogContent()}</dialog>`;
}

function renderBuilderColumnDialogContent() {
  const available = BUILDER_COLUMNS.filter((column) => !builderColumns.includes(column.id));
  const active = builderColumns.map((id) => BUILDER_COLUMNS.find((column) => column.id === id)).filter(Boolean);
  return `
    <div class="builder-columns-content">
      <div class="panel-heading"><div><p class="eyebrow">TABLE VIEW</p><h4>Choose creation-table columns</h4></div>
        <button type="button" class="secondary-action" data-close-builder-dialog>Done</button>
      </div>
      <div class="builder-column-grid">
        <section><h5>Available columns</h5>
          <label><input type="checkbox" data-builder-select-all-columns="available"> Select all</label>
          <div class="builder-column-options">${available.map((column) => `
            <label><input type="checkbox" data-builder-available-column="${column.id}" ${selectedBuilderAvailableColumns.has(column.id) ? 'checked' : ''}> ${column.label}</label>
          `).join('') || '<p class="empty-state">All columns are active.</p>'}</div>
          <button type="button" class="builder-action" data-add-builder-columns>＋ Add selected</button>
        </section>
        <section><h5>Active columns</h5>
          <label><input type="checkbox" data-builder-select-all-columns="active"> Select all</label>
          <div class="builder-column-options">${active.map((column) => `
            <label><input type="checkbox" data-builder-active-column="${column.id}" ${selectedBuilderActiveColumns.has(column.id) ? 'checked' : ''}> ${column.label}</label>
          `).join('') || '<p class="empty-state">No columns selected.</p>'}</div>
          <button type="button" class="secondary-action" data-remove-builder-columns>− Remove selected</button>
        </section>
      </div>
    </div>
  `;
}

function renderBuilderFilterDialog() {
  const allTags = [...new Set(availableCatalogItems(builderCategory, builderSource)
    .flatMap((label) => tagsFromText(label, builderSource, builderCategory)))].sort();
  return `
    <dialog id="builder-filter-dialog" class="builder-filter-dialog">
      <div class="builder-filter-content">
        <div class="panel-heading"><div><p class="eyebrow">CATALOG FILTERS</p><h4>Add include/exclude tags</h4></div>
          <button type="button" class="secondary-action" data-close-builder-dialog>×</button>
        </div>
        <label>Include tags<input name="include" list="builder-filter-tags" placeholder="Comma-separated tags" value="${escapeHtml([...builderFilters.include].join(', '))}"></label>
        <label>Exclude tags<input name="exclude" list="builder-filter-tags" placeholder="Comma-separated tags" value="${escapeHtml([...builderFilters.exclude].join(', '))}"></label>
        <datalist id="builder-filter-tags">${allTags.map((tag) => `<option value="${escapeHtml(tag)}"></option>`).join('')}</datalist>
        <div class="builder-filter-actions">
          <button type="button" class="secondary-action" data-clear-builder-filters>Clear filters</button>
          <button type="button" class="builder-action" data-apply-builder-filters>Apply filters</button>
        </div>
      </div>
    </dialog>
  `;
}

function builderCatalogTree(rows, includeSelectedBundle = false) {
  const buildTree = (labels) => {
    const roots = [];
    const rootMap = new Map();
    const sourceLabel = sourceList().find((source) => source.id === builderSource)?.label || builderSource;
    labels.forEach((label) => {
      const parts = label.split(' / ');
      const descriptors = parts.slice(0, -1);
      const item = parts[parts.length - 1];
      if (!descriptors.length || !item) return;
      let siblings = roots;
      let siblingsByLabel = rootMap;
      for (const descriptor of [...descriptors, sourceLabel]) {
        if (!siblingsByLabel.has(descriptor)) {
          const node = { label: descriptor, children: [], childMap: new Map() };
          siblingsByLabel.set(descriptor, node);
          siblings.push(node);
        }
        const parent = siblingsByLabel.get(descriptor);
        siblings = parent.children;
        siblingsByLabel = parent.childMap;
      }
      siblings.push({
        label: item,
        value: label,
        frequencies: builderItemFrequencies(label),
        leaf: true,
      });
    });
    return roots;
  };

  const roots = buildTree(rows);
  const selectedList = includeSelectedBundle
    ? builtLists.find((list) => list.name === selectedRegistryListName)
    : null;
  if (selectedList) {
    const memberLabels = new Set(selectedList.items.map((item) => item.label));
    const bundleRows = buildTree(rows.filter((label) => memberLabels.has(label)));
    if (bundleRows.length) {
      roots.unshift({
        label: selectedList.name,
        children: bundleRows,
        loadedBundleRoot: true,
      });
    }
  }

  const setCounts = (nodes) => nodes.forEach((node) => {
    if (node.children) {
      setCounts(node.children);
      node.count = node.children.reduce((total, child) => total + (child.count || 1), 0);
      delete node.childMap;
    }
  });
  setCounts(roots);
  return roots;
}

function builderItemFrequencies(label) {
  if (builderCategory !== 'instrument') return [];
  const [, form] = label.split(' / ');
  return form === 'Option' ? OPTION_RECORDING_FREQUENCIES : RECORDING_FREQUENCIES;
}

function selectedBuilderItemRates(label, frequencies) {
  if (!frequencies.length) return [];
  if (builderItemRateOverrides.has(label)) {
    const overridden = builderItemRateOverrides.get(label);
    return frequencies.filter((frequency) => overridden.has(frequency));
  }
  const savedList = builtLists.find((list) => list.name === selectedRegistryListName);
  const savedItem = savedList?.items.find((item) => item.label === label);
  const defaults = savedItem?.frequencies || savedList?.frequencies || recordingFrequencies;
  return frequencies.filter((frequency) => defaults.includes(frequency));
}

function renderBuilderItemRates(label, frequencies) {
  const selectedRates = selectedBuilderItemRates(label, frequencies);
  return `<div class="builder-rate-layer" role="group" aria-label="Recording rates for ${escapeHtml(label)}">
    ${frequencies.map((frequency) => `<label class="${selectedRates.includes(frequency) ? 'is-selected' : ''}"><input type="checkbox" data-builder-item-frequency="${frequency}" data-builder-item-key="${escapeHtml(label)}" ${selectedRates.includes(frequency) ? 'checked' : ''}>${frequency}</label>`).join('')}
  </div>`;
}

function builderNodeSelectionValues(node) {
  if (node.leaf) return [node.value];
  return node.children.flatMap(builderNodeSelectionValues);
}

function hasSelectedBuilderDraftItems() {
  return [...builderSelections].some((label) => builderDraftItems.has(label));
}

function findBuilderNode(nodes, targetPath, path = []) {
  for (const node of nodes) {
    const nodePath = [...path, node.label];
    if (nodePath.join('/') === targetPath) return node;
    if (node.children?.length) {
      const found = findBuilderNode(node.children, targetPath, nodePath);
      if (found) return found;
    }
  }
  return null;
}

function renderBuilderDrillRows(nodes, columns, path = [], depth = 0, parentHue = null, creationMode = false) {
  return nodes.map((node, index) => {
    const nodePath = [...path, node.label];
    const keyPrefix = creationMode ? 'builder-draft' : 'builder';
    const key = `${keyPrefix}-${encodeURIComponent(nodePath.join('/'))}`;
    const hasRateLayer = Boolean(node.leaf && node.frequencies?.length);
    const expandable = Boolean(node.children?.length || hasRateLayer);
    const expanded = builderExpandedDrillKeys.has(key);
    const hue = parentHue === null ? DRILL_HUES[index % DRILL_HUES.length] : parentHue;
    const lightness = drillLightness(depth);
    const saturation = drillSaturation(depth);
    const displayHue = (hue + ((52 - hue + 360) % 360) * (Math.max(0, depth - 4) / 3)) % 360;
    const itemContent = expandable
      ? `<div class="drill-row-wrap"><button class="drill-row" style="padding-left:${12 + depth * 20}px" type="button" data-drill-key="${key}" aria-expanded="${expanded}" aria-controls="children-${key}">
          <span class="drill-chevron" aria-hidden="true">›</span><span>${escapeHtml(node.label)}</span>${node.count ? `<span class="drill-count">${node.count}</span>` : '<span class="drill-count">Rates</span>'}
        </button></div>`
      : `<div class="drill-row drill-leaf" style="padding-left:${12 + depth * 20}px"><span class="drill-chevron" aria-hidden="true">•</span><span>${escapeHtml(node.label)}</span></div>`;
    const hasItemColumn = columns.some((column) => column.id === 'item');
    const descendantValues = expandable ? builderNodeSelectionValues(node) : [];
    const activeSelections = creationMode ? builderDraftSelections : builderSelections;
    const selectedDescendants = descendantValues.filter((value) => activeSelections.has(value)).length;
    const branchChecked = expandable && selectedDescendants === descendantValues.length;
    const branchPartial = selectedDescendants > 0 && !branchChecked;
    const selectionCell = creationMode
      ? node.leaf
        ? `<input type="checkbox" data-builder-draft-select="${escapeHtml(node.value)}" ${builderDraftSelections.has(node.value) ? 'checked' : ''} aria-label="Select ${escapeHtml(node.value)} in the recording creation table">${hasRateLayer && !hasItemColumn ? itemContent : ''}`
        : `<input type="checkbox" data-builder-draft-branch-select="${encodeURIComponent(nodePath.join('/'))}" ${branchChecked ? 'checked' : ''} ${branchPartial ? 'aria-checked="mixed"' : ''} aria-label="Select ${escapeHtml(node.label)} and its ${descendantValues.length} creation table items">${hasItemColumn ? '' : itemContent}`
      : node.leaf
        ? `<input type="checkbox" data-builder-select="${escapeHtml(node.value)}" ${builderSelections.has(node.value) ? 'checked' : ''} aria-label="Select ${escapeHtml(node.value)}">${builderDraftItems.has(node.value) ? '<span class="builder-membership">In creation</span>' : selectedBundleIncludes(node.value) ? '<span class="builder-membership">In source bundle</span>' : ''}${hasItemColumn ? '' : (hasRateLayer ? itemContent : `<span class="builder-leaf-label">${escapeHtml(node.label)}</span>`)}`
        : `<input type="checkbox" data-builder-branch-select="${encodeURIComponent(nodePath.join('/'))}" ${branchChecked ? 'checked' : ''} ${branchPartial ? 'aria-checked="mixed"' : ''} aria-label="Select ${escapeHtml(node.label)} and its ${descendantValues.length} visible items">${hasItemColumn ? '' : itemContent}`;
    const dataCells = columns.map((column, columnIndex) => {
      const value = node.leaf
        ? (column.id === 'item' ? (hasRateLayer ? itemContent : node.label) : builderColumnValue(node.value, column.id))
        : (column.id === 'item' ? itemContent : '—');
      const cellColor = drillTextColor(displayHue, lightness, depth, columnIndex + 1);
      return `<td style="--cell-text-color:${cellColor}">${column.id === 'item' && (hasRateLayer || !node.leaf) ? value : escapeHtml(value || '—')}</td>`;
    }).join('');
    const childContent = hasRateLayer
      ? `<div class="builder-rate-layer-wrap">${renderBuilderItemRates(node.value, node.frequencies)}</div>`
      : `<table class="nested-table"><tbody>${renderBuilderDrillRows(node.children, columns, nodePath, depth + 1, displayHue, creationMode)}</tbody></table>`;
    const childRows = expandable
      ? `<tr class="child-row" data-parent="${key}" id="children-${key}" ${expanded ? '' : 'hidden'}><td colspan="${columns.length + 1}" class="nested-cell">${childContent}</td></tr>`
      : '';
    return `<tr class="${node.loadedBundleRoot ? 'builder-loaded-bundle-row' : ''}" data-drill-row data-depth="${depth}" style="--row-hue:${displayHue};--row-saturation:${saturation}%;--row-lightness:${lightness}%"><td>${selectionCell}</td>${dataCells}</tr>${childRows}`;
  }).join('');
}

function renderBuilderCatalog() {
  const rows = builderCatalogRows();
  const tree = builderCatalogTree(rows, true);
  const columns = builderColumns.map((id) => BUILDER_COLUMNS.find((column) => column.id === id)).filter(Boolean);
  const hasItemColumn = columns.some((column) => column.id === 'item');
  return `
    <div class="drill-table-wrap">
      <table class="drill-table rainbow-mode builder-catalog-table ${hasItemColumn ? '' : 'builder-hierarchy-in-select'}" data-builder-catalog-table>
        <thead><tr><th scope="col">Select / list status</th>${columns.map((column) => `
          <th scope="col" draggable="true" data-builder-column="${column.id}">
            <button type="button" class="builder-sort-button" data-builder-sort="${column.id}">
              ${column.label} ${builderSort.column === column.id ? (builderSort.direction === 'asc' ? '↑' : '↓') : '↕'}
            </button>
          </th>
        `).join('')}</tr></thead>
        <tbody>${tree.length ? renderBuilderDrillRows(tree, columns) : `<tr><td colspan="${columns.length + 1}" class="empty-state">${sourceAccessEnabled(builderSource, 'recorder') ? 'No source items match these filters.' : 'Recorder access is off for this source. Enable it in Source Controller to build recording lists.'}</td></tr>`}</tbody>
      </table>
    </div>
    ${renderBuilderColumnDialog()}
    ${renderBuilderFilterDialog()}
  `;
}

function renderBuilderTableTools() {
  return `
    <div class="builder-table-tools">
      <label class="builder-search creation-table-search">LIST SEARCH
        <input id="builder-tag-search" class="builder-input" type="search" value="${escapeHtml(builderTagQuery)}" placeholder="Search item names, tickers, or tags">
      </label>
      <div class="builder-table-actions">
        <button type="button" class="secondary-action" data-open-builder-filter>Filters</button>
        <button type="button" class="secondary-action" data-open-builder-columns>Columns</button>
      </div>
    </div>
    <small class="builder-search-help">Search text, use # and !# tags, or quote exact phrases.</small>
    <div class="filter-chip-row">${renderBuilderFilterChips()}</div>
  `;
}

function renderBuilderDraft() {
  const items = [...builderDraftItems];
  const tree = builderCatalogTree(items);
  const selectedCount = items.filter((item) => builderDraftSelections.has(item)).length;
  const allSelected = items.length > 0 && selectedCount === items.length;
  const partiallySelected = selectedCount > 0 && !allSelected;
  return `
    <section class="builder-draft" aria-label="Recording creation table">
      <div class="panel-heading"><div><h4>Recording creation table</h4><p>${items.length} item${items.length === 1 ? '' : 's'} in this ${builderCategory === 'instrument' ? 'Instrument' : 'Reference'} · ${escapeHtml(dataSourcesFor(builderCategory).find((source) => source.id === builderSource)?.label || builderSource)} bundle. Check members to remove them in batches.</p></div></div>
      <div class="builder-draft-selection-bar">
        <label><input type="checkbox" data-builder-draft-select-all ${allSelected ? 'checked' : ''} ${partiallySelected ? 'aria-checked="mixed"' : ''} ${items.length ? '' : 'disabled'}> Select all in creation table</label>
        <span>${selectedCount} selected</span>
        <button type="button" class="secondary-action" data-remove-selected-draft-members ${selectedCount ? '' : 'disabled'}>− Remove checked</button>
        <div class="builder-draft-save-group">
          <div class="source-bundle-save-row">
            <label class="builder-field">NEW SOURCE BUNDLE<input id="list-name" class="builder-input" maxlength="48" value="${escapeHtml(builderListName)}" placeholder="Enter a source bundle name" aria-describedby="source-bundle-overwrite-help" required></label>
            <button type="submit" class="builder-action" ${builderDraftItems.size === 0 || !sourceAccessEnabled(builderSource, 'recorder') ? 'disabled' : ''}>Save source bundle</button>
          </div>
          <small id="source-bundle-overwrite-help" class="form-help">Saving with an existing name asks you to confirm before replacing that bundle.</small>
        </div>
      </div>
      ${items.length ? `<div class="drill-table-wrap"><table class="drill-table rainbow-mode builder-catalog-table creation-table recording-creation-table"><thead><tr><th scope="col">Creation table · Select to remove</th><th scope="col">Item</th></tr></thead><tbody>${renderBuilderDrillRows(tree, [{ id: 'item', label: 'Item' }], [], 0, null, true)}</tbody></table></div>` : '<p class="empty-state list-empty">Select catalog rows and add them to the recording creation table.</p>'}
    </section>
  `;
}

function renderRecorderControllerViews() {
  return `
    <div class="section-tabs recorder-controller-tabs" role="tablist" aria-label="Recorder controller views">
      <button class="section-tab ${recorderControllerView === 'builder' ? 'is-active' : ''}" type="button" role="tab" aria-selected="${recorderControllerView === 'builder'}" data-recorder-controller-view="builder">Recorder controls &amp; Source Bundle Maker</button>
      <button class="section-tab ${recorderControllerView === 'registry' ? 'is-active' : ''}" type="button" role="tab" aria-selected="${recorderControllerView === 'registry'}" data-recorder-controller-view="registry">Recorder Registry</button>
    </div>
  `;
}

function renderRecorderRegistry() {
  const listTree = (list) => {
    const category = list.category;
    const catalogRows = category === 'instrument'
      ? collectInstrumentRows(category, list.sourceId)
      : collectReferenceRows(category, list.sourceId);
    const rows = withWarehouseDateRanges(filterRegistryTree(catalogRows, list, category));
    return {
      label: category === 'instrument' ? 'Instrument' : 'Reference',
      source: list.source,
      count: countVisibleItems(rows),
      children: rows.length ? rows : [{
        label: 'No matching catalog items',
        source: list.source,
        contents: 'The saved list items are not available in the current source catalog.',
        leaf: true,
      }],
    };
  };
  const listNode = (list) => ({
    label: list.name,
    source: list.source,
    format: list.frequencies?.length ? list.frequencies.join(', ') : '—',
    count: list.items.length,
    contents: list.premade ? 'Premade source bundle' : 'Saved source bundle',
    children: [listTree(list)],
  });
  const listsBySource = sourceList().map(({ id: sourceId, label: source }) => ({
    sourceId,
    source,
    lists: builtLists.filter((list) => list.sourceId === sourceId),
  })).filter(({ lists }) => lists.length);
  const sourceRoots = listsBySource.map(({ source, lists }) => ({
    label: source,
    source,
    count: lists.reduce((total, list) => total + list.items.length, 0),
    children: [...new Set(lists.map((list) => list.category))].map((category) => {
      const categoryLists = lists.filter((list) => list.category === category);
      const mergedList = {
        ...categoryLists[0],
        items: categoryLists.flatMap((list) => list.items)
          .filter((item, index, items) => items.findIndex((entry) => entry.label === item.label) === index),
      };
      return listTree(mergedList);
    }),
  }));
  const listRoots = builtLists.map(listNode);
  const rows = recorderRegistryView === 'lists' ? listRoots : sourceRoots;
  const headers = recorderRegistryView === 'lists'
    ? 'Recorder list · Category · Data'
    : 'Source · Recorder list · Category · Data';
  return `
    ${builtLists.length ? `
      <div class="section-tabs recorder-registry-tabs" role="tablist" aria-label="Recorder Registry views">
        <button class="section-tab ${recorderRegistryView === 'sources' ? 'is-active' : ''}" type="button" role="tab" aria-selected="${recorderRegistryView === 'sources'}" data-recorder-registry-view="sources">Sources first</button>
        <button class="section-tab ${recorderRegistryView === 'lists' ? 'is-active' : ''}" type="button" role="tab" aria-selected="${recorderRegistryView === 'lists'}" data-recorder-registry-view="lists">Lists first</button>
      </div>
      <div class="drill-table-wrap">
        <table class="drill-table recorder-registry-table ${rainbowDrillColors ? 'rainbow-mode' : ''}">
          <thead><tr><th scope="col">${headers}</th><th scope="col">Source</th><th scope="col">Data rates</th><th scope="col">Contents / Status</th></tr></thead>
          <tbody>${renderDrillRows(rows, `registry-${recorderRegistryView}`, 0, null, 'registry')}</tbody>
        </table>
      </div>
    ` : '<p class="empty-state">The Recorder Registry is empty. Save a list from the builder to add it here.</p>'}
  `;
}

function isRegistryListMember(row, path, list, category) {
  const members = list.items.map((item) => item.label);
  if (category === 'reference') {
  const [structure, group] = path;
  return members.includes(`${structure} / ${group} / ${row.label}`);
  }
  const [assetType, form, underlying, expiration] = path;
  if (form !== 'Option') return members.includes(`${assetType} / ${form} / ${row.label}`);
  const strike = row.label.match(/Strike\s+(\$[\d.]+)/)?.[1];
  if (!strike) return false;
  const monthYear = expiration;
  return members.some((member) => {
  const prefix = `${assetType} / ${form} / ${underlying} `;
  if (!member.startsWith(prefix)) return false;
  const [, contractDate, contractStrike] = member.match(/(\d{4}-\d{2}-\d{2})\s+([\d.]+[CP])/i) || [];
  if (!contractDate || !contractStrike || Number(contractStrike.slice(0, -1)) !== Number(strike.slice(1))) return false;
  const date = new Date(`${contractDate}T00:00:00Z`);
  const contractMonthYear = `${date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${date.getUTCFullYear()}`;
  return contractMonthYear === monthYear;
  });
}

function filterRegistryTree(rows, list, category, path = []) {
  return rows.flatMap((row) => {
  const nextPath = [...path, row.label];
  if (row.children?.length) {
    const children = filterRegistryTree(row.children, list, category, nextPath);
    if (!children.length) return [];
    return [{
      ...row,
      children,
      count: children.reduce((total, child) => total + (child.count ?? (child.leaf ? 1 : 0)), 0),
    }];
  }
  return isRegistryListMember(row, path, list, category) ? [{ ...row }] : [];
  });
}

function renderRecorderListBuilder() {
  const sources = dataSourcesForChannel(builderCategory, 'recorder');
  const rows = builderCatalogRows();
  return `
    <form id="recorder-list-builder-form" class="recording-list-builder" aria-label="Source Bundle Maker">
      <div class="list-builder-heading"><div><h4>Source Bundle Maker</h4><p>Create a source bundle from this catalog for Recorder use and model training.</p></div></div>
      <div class="source-bundle-tool-row" aria-label="Source bundle and catalog search controls">
        <div class="source-bundle-controls" role="group" aria-label="Load bundle and choose catalog">
          <label class="builder-field registry-list-picker">SOURCE BUNDLE
            <select id="registry-list-select" class="builder-input">
              <option value="">New source bundle</option>
              ${builtLists.map((list) => `<option value="${escapeHtml(list.name)}" ${list.name === selectedRegistryListName ? 'selected' : ''}>${escapeHtml(list.name)} · ${escapeHtml(list.source)} · ${list.items.length} items</option>`).join('')}
            </select>
          </label>
          <label class="builder-field">CATEGORY<select id="builder-category" class="builder-input"><option value="instrument" ${builderCategory === 'instrument' ? 'selected' : ''}>Instrument</option><option value="reference" ${builderCategory === 'reference' ? 'selected' : ''}>Reference</option></select></label>
          <label class="builder-field">SOURCE<select id="builder-source" class="builder-input">${sources.map((source) => `<option value="${source.id}" ${source.id === builderSource ? 'selected' : ''}>${escapeHtml(source.label)}</option>`).join('')}</select></label>
        </div>
        ${renderBuilderTableTools()}
      </div>
      <div class="builder-selection-bar">
        <label class="select-all-control"><input type="checkbox" data-builder-select-all ${rows.length > 0 && rows.every((label) => builderSelections.has(label)) ? 'checked' : ''}> Select all visible</label>
        <span>${builderSelections.size} selected</span>
        <button type="button" class="builder-action" data-stage-builder-selection ${builderSelections.size === 0 ? 'disabled' : ''}>＋ Add selected to creation table</button>
        <button type="button" class="secondary-action" data-remove-selected-from-draft ${hasSelectedBuilderDraftItems() ? '' : 'disabled'}>− Remove selected from creation table</button>
      </div>
      ${renderBuilderCatalog()}
      ${renderBuilderDraft()}
      <p id="builder-status" class="controller-status" role="status" aria-live="polite">${escapeHtml(builderStatusMessage)}</p>
    </form>
  `;
}

function renderController() {
  if (activeSection === 'recorder') {
    if (recorderControllerView === 'registry') {
      return `
        ${sectionTabs()}
        <section class="panel" aria-label="Recorder controller">
          <div class="panel-heading"><div><h3>Recorder Controller</h3><p>Inspect saved recording lists in the Recorder Registry.</p></div></div>
          ${renderRecorderControllerViews()}
          <section class="recorder-registry-view" aria-label="Recorder Registry">
            <div class="list-builder-heading"><div><h4>Recorder Registry</h4><p>Saved lists available to Recorder, including premade lists and lists created from the catalog.</p></div></div>
            ${renderRecorderRegistry()}
          </section>
        </section>
      `;
    }
    return `
      ${sectionTabs()}
      <section class="panel" aria-label="Recorder controller">
        <div class="panel-heading"><div><h3>Recorder Controller</h3><p>Control recording and create source bundles for model training and catalog organization.</p></div></div>
        ${renderRecorderControllerViews()}
        <div class="controller-grid">
          ${controllerCard('Recorder', 'Start or pause recording incoming data.', recorderEnabled, 'recorder')}
        </div>
        ${renderRecorderListBuilder()}
        <p id="controller-status" class="controller-status">Recorder is ${recorderEnabled ? 'running' : 'paused'}.</p>
      </section>
    `;
  }

  if (activeSection === 'sources') {
    const sources = sourceList();
    return `
      ${sectionTabs()}
      <section class="panel" aria-label="Source controller">
        <div class="panel-heading"><div><h3>Source Controller</h3><p>Control which source endpoints may feed Recorder and Warehouse. Master controls switch all sources; individual switches can then be adjusted separately.</p></div></div>
        <div class="source-master-grid" aria-label="Master source access">
          ${['recorder', 'warehouse'].map((channel) => `
            <div class="source-master-card">
              <span><strong>${channel === 'recorder' ? 'All Recorder access' : 'All Warehouse access'}</strong><small>Turn this endpoint access on/off for every source</small></span>
              <button class="switch" type="button" role="switch" aria-checked="${sources.every((source) => sourceAccessEnabled(source.id, channel))}" aria-label="Master ${channel} access" data-source-master="${channel}"></button>
            </div>
          `).join('')}
        </div>
        <div class="source-list-heading"><div><h4>Available source endpoints</h4><p>Change an individual endpoint independently after using a master control.</p></div><span>${sources.length} endpoints</span></div>
        <div class="source-endpoint-list" role="table" aria-label="Source endpoint access">
          <div class="source-endpoint-row source-endpoint-header" role="row">
            <span role="columnheader">Source endpoint</span><span role="columnheader">Recorder</span><span role="columnheader">Warehouse</span><span role="columnheader">Both</span>
          </div>
          ${sources.map((source) => {
    const recorderAccess = sourceAccessEnabled(source.id, 'recorder');
    const warehouseAccess = sourceAccessEnabled(source.id, 'warehouse');
    const accessButton = (channel, enabled) => `<button class="source-access-switch" type="button" role="switch" aria-checked="${enabled}" aria-label="${source.label} ${channel} access" data-source-access="${source.id}" data-access-channel="${channel}">${enabled ? 'On' : 'Off'}</button>`;
    return `<div class="source-endpoint-row" role="row">
              <span class="source-endpoint-name" role="cell"><strong>${escapeHtml(source.label)}</strong><small>${escapeHtml(source.id)} · provider endpoint</small></span>
              <span role="cell">${accessButton('recorder', recorderAccess)}</span>
              <span role="cell">${accessButton('warehouse', warehouseAccess)}</span>
              <span class="source-row-actions" role="cell"><button type="button" class="secondary-action source-both-button" data-source-both="${source.id}">${recorderAccess && warehouseAccess ? 'Turn both off' : 'Turn both on'}</button></span>
            </div>`;
  }).join('')}
        </div>
        <section class="agent-terminal" aria-label="Source mapping agent terminal">
          <div class="panel-heading"><div><h4>Source Map Builder</h4><p>Draft source data endpoints, map fields to Instrument/Reference categories, and apply descriptive tags.</p></div><span class="terminal-badge">Local demo</span></div>
          <div class="terminal-policy"><strong>Map-only configuration</strong>          <p>API Tools and credentials belong in the account area; they are not implemented in this demo. This map builder only describes endpoints, response keys, destination columns, categories, and tags.</p></div>
          <label class="source-map-provider">SOURCE MAP<select id="source-provider">${sources.map((source) => `<option value="${source.id}" ${source.id === sourceFormProvider ? 'selected' : ''}>${escapeHtml(source.label)}</option>`).join('')}</select></label>
          <div class="terminal-output" role="log" aria-live="polite">
            <div class="terminal-system">Mapping assistant ready for ${escapeHtml(sourceFormProvider.toUpperCase())}. Suggestions are local examples and require review.</div>
            ${sourceTerminalHistory.map((entry) => `<div class="terminal-entry"><span>&gt; ${escapeHtml(entry.prompt)}</span><small>${escapeHtml(entry.result)}</small></div>`).join('')}
            ${pendingSourceMapping ? `<div class="mapping-suggestion"><strong>Review mapping suggestion</strong><span>${escapeHtml(pendingSourceMapping.method)} ${escapeHtml(pendingSourceMapping.request)} · ${escapeHtml(pendingSourceMapping.key)} → ${escapeHtml(pendingSourceMapping.category)} / ${escapeHtml(pendingSourceMapping.group)}${pendingSourceMapping.form ? ` / ${escapeHtml(pendingSourceMapping.form)}` : ''} · ${escapeHtml(pendingSourceMapping.format)} · #${escapeHtml(pendingSourceMapping.tags || 'untagged')}</span><button type="button" class="builder-action" data-save-source-mapping>Save to ${escapeHtml(sourceFormProvider.toUpperCase())} source map</button></div>` : ''}
          </div>
          <form id="source-agent-form" class="terminal-input-row">
            <label class="sr-only" for="source-agent-request">Describe a source request mapping</label>
            <textarea id="source-agent-request" rows="3" placeholder='Describe request mapping or use fields: key="quote.symbol" request="/v1/quotes" category=Instrument group=Stock form=Spot format=Structured column="instrument.symbol" tags="stock,technology"' required></textarea>
            <span class="source-category-control"><label for="source-agent-category">CATEGORY</label><select id="source-agent-category"><option>Instrument</option><option>Reference</option></select><button class="builder-action" type="submit">Draft mapping</button></span>
          </form>
          <p class="terminal-help">Use key=, request=, category=, group=, optional form=, format=, column=, and tags=. Add all applicable source, item, group, type, and field tags as a quoted comma-separated value.</p>
        </section>
        <div class="mapping-section">
          <div class="panel-heading"><div><h4>Saved ${escapeHtml(sourceFormProvider.toUpperCase())} source map</h4><p>Expand category and group rows to inspect mapped endpoints, destination fields, format, and tags.</p></div></div>
          ${renderSourceMappings()}
        </div>
        <p id="controller-status" class="controller-status" role="status" aria-live="polite">${sources.filter((source) => sourceAccessEnabled(source.id, 'recorder') || sourceAccessEnabled(source.id, 'warehouse')).length} sources currently allow Recorder or Warehouse access.</p>
      </section>
    `;
  }

  return `
    ${sectionTabs()}
    <section class="panel" aria-label="Warehouse controller">
      <div class="panel-heading"><div><h3>Warehouse Controller</h3><p>Use the ingester agent terminal to inspect and configure warehouse ingestion tasks.</p></div></div>
      <section class="agent-terminal" aria-label="Warehouse ingester agent terminal">
        <div class="panel-heading"><div><h4>Ingester Agent Terminal</h4><p>Describe a warehouse ingestion or validation task.</p></div><span class="terminal-badge">Local demo · not connected</span></div>
        <div class="terminal-policy"><strong>Ingester scope</strong><p>Prepare ingestion plans, validate source mappings, and report warehouse readiness. This local demo does not connect to a source or modify warehouse data.</p></div>
        <div class="terminal-output" role="log" aria-live="polite">
          <div class="terminal-system">Ingester assistant ready. No ingestion is running.</div>
          ${ingesterTerminalHistory.map((entry) => `<div class="terminal-entry"><span>&gt; ${escapeHtml(entry.prompt)}</span><small>${escapeHtml(entry.result)}</small></div>`).join('')}
        </div>
        <form id="ingester-agent-form" class="terminal-input-row">
          <label class="sr-only" for="ingester-agent-request">Describe an ingestion task</label>
          <textarea id="ingester-agent-request" rows="3" placeholder="For example: validate the saved source mappings and prepare an ingestion plan" required></textarea>
          <button class="builder-action" type="submit">Send to ingester</button>
        </form>
        <p id="controller-status" class="controller-status" role="status" aria-live="polite">${ingesterTerminalHistory.length ? 'Task received by the local demo. No warehouse changes have been made.' : 'Ready for an ingester task. No warehouse changes have been made.'}</p>
      </section>
    </section>
  `;
}

function updateNavigation() {
  navigation.querySelectorAll('[data-section]').forEach((button) => {
    const selected = button.dataset.section === activeSection;
    button.classList.toggle('is-active', selected);
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function render() {
  const nextDrillStateContext = [activeSection, activePanel, activeCategory, activeSource, warehouseTagQuery, sourceFormProvider].join(':');
  if (nextDrillStateContext === drillStateContext) {
    expandedDrillKeys = new Set([...view.querySelectorAll('[data-drill-key][aria-expanded="true"]')]
      .map((button) => button.dataset.drillKey)
      .filter((key) => !key.startsWith('builder-')));
  } else {
    expandedDrillKeys = new Set();
  }
  drillStateContext = nextDrillStateContext;
  updateNavigation();
  if (activeSection === 'home') view.innerHTML = renderHome();
  else {
    view.innerHTML = `
      ${renderHeading(sectionDetails(activeSection))}
      ${activePanel === 'summary' ? renderSummary() : renderController()}
    `;
  }
  for (const key of expandedDrillKeys) {
    const drillButton = [...view.querySelectorAll('[data-drill-key]')].find((button) => button.dataset.drillKey === key);
    if (!drillButton) continue;
    drillButton.setAttribute('aria-expanded', 'true');
    const childRow = drillButton.closest('tr')?.nextElementSibling;
    if (childRow?.classList.contains('child-row')) childRow.hidden = false;
  }
  const rateMaster = view.querySelector('[data-frequency-master]');
  if (rateMaster) rateMaster.indeterminate = recordingFrequencies.length > 0 && recordingFrequencies.length < RECORDING_FREQUENCIES.length;
  const selectAll = view.querySelector('[data-select-all]');
  if (selectAll) {
    const rows = visibleSummaryRows();
    const allSelected = rows.length > 0 && rows.every((row, index) => branchIsFullySelected(row, selectionKey('root', index)));
    const someSelected = rows.some((row, index) => branchHasSelection(row, selectionKey('root', index)));
    selectAll.indeterminate = someSelected && !allSelected;
  }
  const builderSelectAll = view.querySelector('[data-builder-select-all]');
  if (builderSelectAll) {
    const labels = builderCatalogRows();
    const allSelected = labels.length > 0 && labels.every((label) => builderSelections.has(label));
    const someSelected = labels.some((label) => builderSelections.has(label));
    builderSelectAll.indeterminate = someSelected && !allSelected;
  }
  view.querySelectorAll('[data-builder-branch-select][aria-checked="mixed"]').forEach((checkbox) => {
    checkbox.indeterminate = true;
  });
  view.querySelectorAll('[data-record-key][aria-checked="mixed"]').forEach((checkbox) => {
    checkbox.indeterminate = true;
  });
  const rateDialog = view.querySelector('[data-rate-picker-dialog]');
  if (rateDialog) {
    rateDialog.addEventListener('close', () => {
      if (view.contains(rateDialog)) activeRatePickerKey = null;
    }, { once: true });
    rateDialog.showModal();
  } else if (activeSection !== 'recorder' && activeSection !== 'warehouse') {
    activeRatePickerKey = null;
  }
  if (activeSection === 'recorder' && activePanel === 'controller') populateBuilderSources();
}

function populateBuilderSources() {
  const sourceSelect = document.querySelector('#builder-source');
  if (!sourceSelect) return;
  const sources = dataSourcesForChannel(builderCategory, 'recorder');
  if (!sources.some((source) => source.id === builderSource)) builderSource = sources[0]?.id || '';
  sourceSelect.innerHTML = sources.length
    ? sources.map((source) => `<option value="${source.id}">${source.label}</option>`).join('')
    : '<option value="">No Recorder sources enabled</option>';
  sourceSelect.value = builderSource;
}

navigation.addEventListener('click', (event) => {
  const button = event.target.closest('[data-section]');
  if (!button) return;
  activeSection = button.dataset.section;
  activePanel = 'summary';
  render();
});

view.addEventListener('click', (event) => {
  if (event.target.matches('[data-record-key], [data-select-all], [data-frequency], [data-instrument-frequency]')) return;

  const ratePickerButton = event.target.closest('[data-rate-picker]');
  if (ratePickerButton) {
    activeRatePickerKey = ratePickerButton.dataset.ratePicker;
    render();
    return;
  }

  const closeRatePicker = event.target.closest('[data-close-rate-picker]');
  if (closeRatePicker) {
    activeRatePickerKey = null;
    view.querySelector('[data-rate-picker-dialog]')?.close();
    return;
  }

  if (event.target.closest('[data-open-builder-filter]')) {
    view.querySelector('#builder-filter-dialog')?.showModal();
    return;
  }

  if (event.target.closest('[data-open-builder-columns]')) {
    view.querySelector('#builder-columns-dialog')?.showModal();
    return;
  }

  const closeBuilderDialog = event.target.closest('[data-close-builder-dialog]');
  if (closeBuilderDialog) {
    closeBuilderDialog.closest('dialog')?.close();
    return;
  }

  if (event.target.closest('[data-apply-builder-filters]')) {
    const dialog = view.querySelector('#builder-filter-dialog');
    const tokens = (name) => (dialog.querySelector(`[name="${name}"]`).value.match(/[a-z0-9_-]+/gi) || [])
      .map((tag) => tag.toLowerCase());
    builderFilters = { include: new Set(tokens('include')), exclude: new Set(tokens('exclude')) };
    dialog.close();
    render();
    return;
  }

  if (event.target.closest('[data-clear-builder-filters]')) {
    builderFilters = { include: new Set(), exclude: new Set() };
    view.querySelector('#builder-filter-dialog')?.close();
    render();
    return;
  }

  const removeBuilderFilter = event.target.closest('[data-builder-remove-filter]');
  if (removeBuilderFilter) {
    const [type, tag] = removeBuilderFilter.dataset.builderRemoveFilter.split(':');
    builderFilters[type].delete(tag);
    render();
    return;
  }

  const builderSortButton = event.target.closest('[data-builder-sort]');
  if (builderSortButton) {
    const column = builderSortButton.dataset.builderSort;
    builderSort = {
      column,
      direction: builderSort.column === column && builderSort.direction === 'asc' ? 'desc' : 'asc',
    };
    render();
    return;
  }

  if (event.target.closest('[data-add-builder-columns]')) {
    for (const column of selectedBuilderAvailableColumns) {
      if (!builderColumns.includes(column)) builderColumns.push(column);
    }
    selectedBuilderAvailableColumns.clear();
    view.querySelector('#builder-columns-dialog')?.close();
    render();
    return;
  }

  if (event.target.closest('[data-remove-builder-columns]')) {
    builderColumns = builderColumns.filter((column) => !selectedBuilderActiveColumns.has(column));
    selectedBuilderActiveColumns.clear();
    view.querySelector('#builder-columns-dialog')?.close();
    render();
    return;
  }

  const openButton = event.target.closest('[data-open-section]');
  if (openButton) {
    activeSection = openButton.dataset.openSection;
    activePanel = 'summary';
    render();
    return;
  }

  const panelButton = event.target.closest('[data-panel]');
  if (panelButton) {
    activePanel = panelButton.dataset.panel;
    render();
    return;
  }

  const recorderViewButton = event.target.closest('[data-recorder-controller-view]');
  if (recorderViewButton) {
    recorderControllerView = recorderViewButton.dataset.recorderControllerView;
    render();
    return;
  }

  const registryViewButton = event.target.closest('[data-recorder-registry-view]');
  if (registryViewButton) {
    recorderRegistryView = registryViewButton.dataset.recorderRegistryView;
    render();
    return;
  }

  const drillButton = event.target.closest('[data-drill-key]');
  if (drillButton) {
    const expanded = drillButton.getAttribute('aria-expanded') === 'true';
    const drillKey = drillButton.dataset.drillKey;
    if (drillKey.startsWith('builder-')) {
      if (expanded) builderExpandedDrillKeys.delete(drillKey);
      else builderExpandedDrillKeys.add(drillKey);
    }
    drillButton.setAttribute('aria-expanded', String(!expanded));
    const childRow = drillButton.closest('tr')?.nextElementSibling;
    if (childRow?.classList.contains('child-row')) childRow.hidden = expanded;
    return;
  }

  const switchButton = event.target.closest('[data-switch]');
  if (switchButton) {
    const enabled = switchButton.getAttribute('aria-checked') !== 'true';
    const id = switchButton.dataset.switch;
    if (id === 'recorder') recorderEnabled = enabled;
    render();
    return;
  }

  const sourceMasterButton = event.target.closest('[data-source-master]');
  if (sourceMasterButton) {
    const channel = sourceMasterButton.dataset.sourceMaster;
    const enabled = sourceMasterButton.getAttribute('aria-checked') !== 'true';
    sourceList().forEach((source) => {
      sourceAccess[source.id][channel] = enabled;
    });
    render();
    return;
  }

  const sourceAccessButton = event.target.closest('[data-source-access]');
  if (sourceAccessButton) {
    const sourceId = sourceAccessButton.dataset.sourceAccess;
    const accessChannel = sourceAccessButton.dataset.accessChannel;
    sourceAccess[sourceId][accessChannel] = sourceAccessButton.getAttribute('aria-checked') !== 'true';
    render();
    return;
  }

  const sourceBothButton = event.target.closest('[data-source-both]');
  if (sourceBothButton) {
    const sourceId = sourceBothButton.dataset.sourceBoth;
    const turnOn = !(sourceAccessEnabled(sourceId, 'recorder') && sourceAccessEnabled(sourceId, 'warehouse'));
    sourceAccess[sourceId].recorder = turnOn;
    sourceAccess[sourceId].warehouse = turnOn;
    render();
    return;
  }

  if (event.target.closest('[data-stage-builder-selection]')) {
    let added = 0;
    builderSelections.forEach((label) => {
      if (!builderDraftItems.has(label)) {
        builderDraftItems.add(label);
        added += 1;
      }
    });
    builderSelections.clear();
    builderStatusMessage = `Added ${added} item${added === 1 ? '' : 's'} to the recording creation table.`;
    render();
    return;
  }

  if (event.target.closest('[data-remove-selected-from-draft]')) {
    let removed = 0;
    builderSelections.forEach((label) => {
      if (builderDraftItems.delete(label)) {
        builderDraftSelections.delete(label);
        removed += 1;
      }
    });
    builderSelections.clear();
    builderStatusMessage = removed
      ? `Removed ${removed} item${removed === 1 ? '' : 's'} from the recording creation table.`
      : 'The selected catalog items are not in the recording creation table.';
    render();
    return;
  }

  if (event.target.closest('[data-remove-selected-draft-members]')) {
    let removed = 0;
    builderDraftSelections.forEach((label) => {
      if (builderDraftItems.delete(label)) removed += 1;
    });
    builderDraftSelections.clear();
    builderStatusMessage = `Removed ${removed} item${removed === 1 ? '' : 's'} from the recording creation table.`;
    render();
    return;
  }

  const removeMappingButton = event.target.closest('[data-remove-mapping]');
  if (removeMappingButton) {
    sourceObjects[sourceFormProvider].mappings.splice(Number(removeMappingButton.dataset.removeMapping), 1);
    render();
    return;
  }

  const editSourceButton = event.target.closest('[data-edit-source]');
  if (editSourceButton) {
    sourceFormProvider = editSourceButton.dataset.editSource;
    activePanel = 'controller';
    render();
    return;
  }

  if (event.target.closest('[data-save-source-mapping]')) {
    if (!pendingSourceMapping) return;
    sourceObjects[sourceFormProvider].mappings.push(pendingSourceMapping);
    sourceTerminalHistory.push({
      prompt: 'Approve mapping suggestion',
      result: `Saved ${pendingSourceMapping.key} to the local ${sourceFormProvider.toUpperCase()} demo map. Provider requests and automatic Recorder collection are not connected.`,
    });
    pendingSourceMapping = null;
    render();
    return;
  }

});

view.addEventListener('change', (event) => {
  if (event.target.id === 'category-filter') {
    activeCategory = event.target.value;
    activeSource = 'all';
    render();
  } else if (event.target.id === 'source-filter') {
    activeSource = event.target.value;
    render();
  } else if (event.target.hasAttribute('data-select-all')) {
    const rows = visibleSummaryRows();
    rows.forEach((row, index) => {
      setBranchSelection(rows, selectionKey('root', index), event.target.checked);
    });
    render();
  } else if (event.target.hasAttribute('data-record-key')) {
    const rows = visibleSummaryRows();
    setBranchSelection(rows, event.target.dataset.recordKey, event.target.checked);
    render();
  } else if (event.target.hasAttribute('data-rainbow-drill')) {
    rainbowDrillColors = event.target.checked;
    render();
  } else if (event.target.hasAttribute('data-frequency')) {
    const frequency = event.target.dataset.frequency;
    if (event.target.checked && !recordingFrequencies.includes(frequency)) recordingFrequencies.push(frequency);
    if (!event.target.checked) recordingFrequencies = recordingFrequencies.filter((item) => item !== frequency);
    render();
  } else if (event.target.hasAttribute('data-frequency-master')) {
    recordingFrequencies = event.target.checked ? [...RECORDING_FREQUENCIES] : [];
    recordingRateOverrides.clear();
    render();
  } else if (event.target.hasAttribute('data-instrument-frequency')) {
    const key = event.target.dataset.instrumentRateKey;
    const rows = visibleSummaryRows();
    const row = findRowBySelectionKey(rows, key);
    if (!row?.frequencies) return;
    const selected = new Set(selectedRatesForRow(key, row));
    if (event.target.checked) selected.add(event.target.dataset.instrumentFrequency);
    else selected.delete(event.target.dataset.instrumentFrequency);
    if (selected.size === row.frequencies.length
      && row.frequencies.every((frequency) => recordingFrequencies.includes(frequency))) recordingRateOverrides.delete(key);
    else recordingRateOverrides.set(key, selected);
    if (selected.size) recordingSelections.add(key);
    else recordingSelections.delete(key);
    render();
  } else if (event.target.hasAttribute('data-builder-item-frequency')) {
    const label = event.target.dataset.builderItemKey;
    const frequencies = builderItemFrequencies(label);
    const selected = new Set(selectedBuilderItemRates(label, frequencies));
    const frequency = event.target.dataset.builderItemFrequency;
    if (event.target.checked) selected.add(frequency);
    else selected.delete(frequency);
    builderItemRateOverrides.set(label, selected);
    render();
  } else if (event.target.hasAttribute('data-builder-draft-select-all')) {
    builderDraftSelections.clear();
    if (event.target.checked) builderDraftItems.forEach((label) => builderDraftSelections.add(label));
    render();
  } else if (event.target.hasAttribute('data-builder-draft-branch-select')) {
    const path = decodeURIComponent(event.target.dataset.builderDraftBranchSelect);
    const node = findBuilderNode(builderCatalogTree([...builderDraftItems]), path);
    if (node) {
      builderNodeSelectionValues(node).forEach((label) => {
        if (event.target.checked) builderDraftSelections.add(label);
        else builderDraftSelections.delete(label);
      });
    }
    render();
  } else if (event.target.hasAttribute('data-builder-draft-select')) {
    const label = event.target.dataset.builderDraftSelect;
    if (event.target.checked) builderDraftSelections.add(label);
    else builderDraftSelections.delete(label);
    render();
  } else if (event.target.hasAttribute('data-builder-select-all')) {
    const visibleLabels = builderCatalogRows();
    if (event.target.checked) visibleLabels.forEach((label) => builderSelections.add(label));
    else visibleLabels.forEach((label) => builderSelections.delete(label));
    render();
  } else if (event.target.hasAttribute('data-builder-branch-select')) {
    const path = decodeURIComponent(event.target.dataset.builderBranchSelect);
    const node = findBuilderNode(builderCatalogTree(builderCatalogRows(), true), path);
    if (node) {
      builderNodeSelectionValues(node).forEach((label) => {
        if (event.target.checked) builderSelections.add(label);
        else builderSelections.delete(label);
      });
    }
    render();
  } else if (event.target.hasAttribute('data-builder-select')) {
    if (event.target.checked) builderSelections.add(event.target.dataset.builderSelect);
    else builderSelections.delete(event.target.dataset.builderSelect);
    render();
  } else if (event.target.hasAttribute('data-builder-available-column')) {
    const column = event.target.dataset.builderAvailableColumn;
    if (event.target.checked) selectedBuilderAvailableColumns.add(column);
    else selectedBuilderAvailableColumns.delete(column);
    const dialog = view.querySelector('#builder-columns-dialog');
    dialog.innerHTML = renderBuilderColumnDialogContent();
  } else if (event.target.hasAttribute('data-builder-active-column')) {
    const column = event.target.dataset.builderActiveColumn;
    if (event.target.checked) selectedBuilderActiveColumns.add(column);
    else selectedBuilderActiveColumns.delete(column);
    const dialog = view.querySelector('#builder-columns-dialog');
    dialog.innerHTML = renderBuilderColumnDialogContent();
  } else if (event.target.hasAttribute('data-builder-select-all-columns')) {
    const scope = event.target.dataset.builderSelectAllColumns;
    const columns = scope === 'available'
      ? BUILDER_COLUMNS.filter((column) => !builderColumns.includes(column.id)).map((column) => column.id)
      : builderColumns;
    const selected = scope === 'available' ? selectedBuilderAvailableColumns : selectedBuilderActiveColumns;
    selected.clear();
    if (event.target.checked) columns.forEach((column) => selected.add(column));
    const dialog = view.querySelector('#builder-columns-dialog');
    dialog.innerHTML = renderBuilderColumnDialogContent();
  } else if (event.target.id === 'registry-list-select') {
    selectedRegistryListName = event.target.value;
    builderItemRateOverrides.clear();
    const list = builtLists.find((item) => item.name === selectedRegistryListName);
    if (list) {
      builderCategory = list.category;
      builderSource = list.sourceId;
      builderListName = list.name;
      builderDraftItems.clear();
      builderDraftSelections.clear();
      const listItems = new Set(list.items.map((item) => item.label));
      builderSelections = new Set(builderCatalogRows().filter((label) => listItems.has(label)));
    } else {
      builderListName = '';
      builderDraftItems.clear();
      builderDraftSelections.clear();
      builderSelections.clear();
    }
    builderStatusMessage = list
      ? `Loaded "${list.name}" in the search table. Add selected items to the creation table to stage them.`
      : '';
    render();
  } else if (event.target.id === 'builder-category') {
    builderItemRateOverrides.clear();
    builderCategory = event.target.value;
    builderSource = dataSourcesForChannel(builderCategory, 'recorder')[0]?.id || '';
    selectedRegistryListName = '';
    builderListName = '';
    builderSelections.clear();
    builderDraftItems.clear();
    builderDraftSelections.clear();
    builderStatusMessage = '';
    render();
  } else if (event.target.id === 'builder-source') {
    builderItemRateOverrides.clear();
    builderSource = event.target.value;
    selectedRegistryListName = '';
    builderListName = '';
    builderSelections.clear();
    builderDraftItems.clear();
    builderDraftSelections.clear();
    builderStatusMessage = '';
    render();
  } else if (event.target.id === 'source-provider') {
    sourceFormProvider = event.target.value;
    pendingSourceMapping = null;
    render();
  }
});

view.addEventListener('dragstart', (event) => {
  const header = event.target.closest('[data-builder-column]');
  if (!header) return;
  draggedBuilderColumn = header.dataset.builderColumn;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', draggedBuilderColumn);
});

view.addEventListener('dragover', (event) => {
  if (event.target.closest('[data-builder-column]') && draggedBuilderColumn) event.preventDefault();
});

view.addEventListener('drop', (event) => {
  const target = event.target.closest('[data-builder-column]');
  if (!target || !draggedBuilderColumn) return;
  event.preventDefault();
  const from = builderColumns.indexOf(draggedBuilderColumn);
  const to = builderColumns.indexOf(target.dataset.builderColumn);
  if (from >= 0 && to >= 0 && from !== to) {
    builderColumns.splice(to, 0, builderColumns.splice(from, 1)[0]);
    render();
  }
  draggedBuilderColumn = null;
});

view.addEventListener('submit', (event) => {
  if (event.target.matches('#recorder-list-builder-form')) {
    event.preventDefault();
    const nameInput = document.querySelector('#list-name');
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.setCustomValidity('Enter a list name.');
      nameInput.reportValidity();
      return;
    }
    if (!sourceAccessEnabled(builderSource, 'recorder') || !dataSourcesForChannel(builderCategory, 'recorder').some((source) => source.id === builderSource)) {
      document.querySelector('#builder-status').textContent = 'Recorder access is off for this source. Enable it in Source Controller before saving the list.';
      return;
    }
    if (builderDraftItems.size === 0) {
      document.querySelector('#builder-status').textContent = 'Add catalog items to the recording creation table before saving.';
      return;
    }
    const category = builderCategory;
    const sourceId = builderSource;
    const source = dataSourcesFor(category).find((item) => item.id === sourceId);
    const savedItems = [...builderDraftItems].map((label) => {
      const frequencies = builderItemFrequencies(label);
      return {
        label,
        tags: tagsFromText(label, sourceId),
        ...(frequencies.length ? { frequencies: selectedBuilderItemRates(label, frequencies) } : {}),
      };
    });
    const bundleFrequencies = [...new Set(savedItems.flatMap((item) => item.frequencies || []))]
      .filter((frequency) => RECORDING_FREQUENCIES.includes(frequency));
    const existingList = builtLists.find((list) => list.name.toLowerCase() === name.toLowerCase());
    if (existingList && !window.confirm(`A source bundle named "${existingList.name}" already exists. Overwrite it?`)) return;
    if (existingList) {
      existingList.name = name;
      existingList.category = category;
      existingList.sourceId = sourceId;
      existingList.source = source?.label || sourceId;
      existingList.items = savedItems;
      existingList.frequencies = bundleFrequencies;
      selectedRegistryListName = name;
      builderStatusMessage = `Updated source bundle "${name}".`;
    } else {
      builtLists.push({
        name,
        category,
        sourceId,
        source: source?.label || sourceId,
        items: savedItems,
        frequencies: bundleFrequencies,
      });
      selectedRegistryListName = name;
      builderStatusMessage = `Saved source bundle "${name}" to the Recorder Registry.`;
    }
    builderListName = name;
    builderSelections.clear();
    builderDraftSelections.clear();
    render();
    return;
  }

  if (event.target.id === 'source-agent-form') {
    event.preventDefault();
    const prompt = document.querySelector('#source-agent-request').value.trim();
    const selectedCategory = document.querySelector('#source-agent-category').value;
    const fields = {};
    for (const match of prompt.matchAll(/([a-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/gi)) {
      fields[match[1].toLowerCase()] = (match[2] || match[3] || match[4] || '').trim();
    }
    const categoryValue = (fields.category || selectedCategory).toLowerCase();
    const formatValue = (fields.format || '').toLowerCase();
    if (!fields.key || !fields.request || !fields.group || !fields.column
      || !['instrument', 'reference'].includes(categoryValue)
      || !['structured', 'unstructured', 'time series', 'formatted', 'unformatted'].includes(formatValue)) {
      sourceTerminalHistory.push({
        prompt,
        result: 'Cannot draft yet. Specify key, request, category, group, column, and format in the documented format.',
      });
      render();
      return;
    }
    pendingSourceMapping = {
      method: 'GET',
      request: fields.request,
      key: fields.key,
      category: categoryValue === 'instrument' ? 'Instrument' : 'Reference',
      group: fields.group,
      form: fields.form || '',
      column: fields.column,
      format: formatValue === 'formatted' ? 'Structured' : formatValue === 'unformatted' ? 'Unstructured' : fields.format,
      tags: fields.tags || '',
    };
    sourceTerminalHistory.push({
      prompt,
      result: `Drafted a ${pendingSourceMapping.format} ${pendingSourceMapping.category} mapping for ${pendingSourceMapping.group}. Review before saving.`,
    });
    render();
    return;
  }

  if (event.target.id === 'ingester-agent-form') {
    event.preventDefault();
    const prompt = document.querySelector('#ingester-agent-request').value.trim();
    if (!prompt) return;
    ingesterTerminalHistory.push({
      prompt,
      result: 'Task received in the local demo. The ingester is not connected, so no source was queried and no warehouse data was changed.',
    });
    render();
  }
});

view.addEventListener('input', (event) => {
  if (event.target.id === 'list-name') {
    builderListName = event.target.value;
    event.target.setCustomValidity('');
  }
  if (event.target.id === 'builder-tag-search') {
    builderTagQuery = event.target.value;
    const selectionStart = event.target.selectionStart;
    render();
    const search = document.querySelector('#builder-tag-search');
    search.focus();
    search.setSelectionRange(selectionStart, selectionStart);
  }
  if (event.target.id === 'warehouse-tag-search') {
    const selectionStart = event.target.selectionStart;
    warehouseTagQuery = event.target.value;
    render();
    const search = document.querySelector('#warehouse-tag-search');
    search.focus();
    search.setSelectionRange(selectionStart, selectionStart);
  }
});

render();
