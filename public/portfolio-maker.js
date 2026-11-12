const CATALOG = [
  { symbol: 'AAPL', name: 'Apple Inc.', source: 'yahoo', assetClass: 'Stock', kind: 'stock', tags: ['stock', 'spot', 'technology'], form: 'Spot' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', source: 'yahoo', assetClass: 'Stock', kind: 'stock', tags: ['stock', 'spot', 'technology'], form: 'Spot' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', source: 'yahoo', assetClass: 'Stock', kind: 'stock', tags: ['stock', 'spot', 'technology'], form: 'Spot' },
  { symbol: 'AAPL 2026-12-18 250C', name: 'AAPL 2026-12-18 250C', source: 'yahoo', assetClass: 'Stock', kind: 'option', tags: ['stock', 'option', 'technology'], form: 'Option', expiration: '2026-12-18', strike: 250, optionType: 'Call', frequencies: ['1m', '5m', '1h'], dateRanges: ['May 12 – Aug 29, 2025', 'Oct 1, 2025 – Nov 10, 2026'] },
  { symbol: 'MSFT 2027-01-15 500C', name: 'MSFT 2027-01-15 500C', source: 'yahoo', assetClass: 'Stock', kind: 'option', tags: ['stock', 'option', 'technology'], form: 'Option', expiration: '2027-01-15', strike: 500, optionType: 'Call', frequencies: ['1m', '5m'], dateRanges: ['Jan 3 – Mar 31, 2025', 'Oct 1, 2025 – Nov 10, 2026'] },
  { symbol: 'AAPL', name: 'Apple Inc.', source: 'webull', assetClass: 'Stock', kind: 'stock', tags: ['stock', 'spot', 'technology'], form: 'Spot' },
  { symbol: 'TSLA', name: 'Tesla Inc.', source: 'webull', assetClass: 'Stock', kind: 'stock', tags: ['stock', 'spot', 'technology'], form: 'Spot' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', source: 'webull', assetClass: 'Stock', kind: 'stock', tags: ['stock', 'spot', 'technology'], form: 'Spot' },
  { symbol: 'TSLA 2026-12-18 400C', name: 'TSLA 2026-12-18 400C', source: 'webull', assetClass: 'Stock', kind: 'option', tags: ['stock', 'option', 'technology'], form: 'Option', expiration: '2026-12-18', strike: 400, optionType: 'Call', frequencies: ['1m', '5m', '1h'], dateRanges: ['May 12 – Aug 29, 2025', 'Oct 1, 2025 – Nov 10, 2026'] },
  { symbol: 'AMZN 2027-01-15 250C', name: 'AMZN 2027-01-15 250C', source: 'webull', assetClass: 'Stock', kind: 'option', tags: ['stock', 'option', 'technology'], form: 'Option', expiration: '2027-01-15', strike: 250, optionType: 'Call', frequencies: ['1m', '1h'], dateRanges: ['Jan 3 – Mar 31, 2025', 'Oct 1, 2025 – Nov 10, 2026'] },
  { symbol: 'GCZ6 — Gold Dec 2026', name: 'GCZ6 — Gold Dec 2026', source: 'webull', assetClass: 'Commodity', kind: 'future', tags: ['commodity', 'future'], form: 'Future', expiration: 'Dec 2026' },
  { symbol: 'CLZ6 — WTI Crude Dec 2026', name: 'CLZ6 — WTI Crude Dec 2026', source: 'webull', assetClass: 'Commodity', kind: 'future', tags: ['commodity', 'future'], form: 'Future', expiration: 'Dec 2026' },
];

const COLUMN_DEFINITIONS = ['symbol', 'name', 'source', 'tags', 'form', 'expiration', 'strike', 'optionType'];
const NUMERIC_COLUMNS = new Set(['strike']);
const DRILL_HUES = [8, 205, 132, 278, 42, 185, 322, 92, 238, 58];
const DRILL_DARK_TEXT_LUMINANCE = [52, 64, 51].map((value) => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
});
const DRILL_DARK_TEXT_LUMA = 0.2126 * DRILL_DARK_TEXT_LUMINANCE[0]
  + 0.7152 * DRILL_DARK_TEXT_LUMINANCE[1] + 0.0722 * DRILL_DARK_TEXT_LUMINANCE[2];
const LABELS = {
  symbol: 'Instrument', name: 'Name', source: 'Source', tags: 'Tags', form: 'Form',
  expiration: 'Expiration', strike: 'Strike', optionType: 'Option type',
};
const elements = {
  source: document.querySelector('#source-select'),
  portfolioView: document.querySelector('#portfolio-view'),
  search: document.querySelector('#instrument-search'),
  table: document.querySelector('#instrument-table'),
  tableHead: document.querySelector('#instrument-table thead'),
  tableBody: document.querySelector('#instrument-table tbody'),
  status: document.querySelector('#status'),
  all: document.querySelector('#select-all'),
  count: document.querySelector('#selection-count'),
  removePortfolioOptions: document.querySelector('#remove-portfolio-options'),
  mergePortfolioSource: document.querySelector('#portfolio-merge-source'),
  builderItems: document.querySelector('#builder-list-items'),
  builderCount: document.querySelector('#builder-list-count'),
  builderName: document.querySelector('#builder-portfolio-name'),
  cards: document.querySelector('#portfolio-cards'),
  filterChips: document.querySelector('#filter-chips'),
  filterDialog: document.querySelector('#filter-dialog'),
  columnDialog: document.querySelector('#columns-dialog'),
  undo: document.querySelector('#undo-view'),
};
let selectedSymbols = new Set();
const builderSymbols = new Set();
const selectedBuilderSymbols = new Set();
let columnsByClass = {
  all: ['symbol', 'name', 'source', 'form', 'tags'],
};
let columnBounds = {};
let filters = { include: new Set(), exclude: new Set() };
let sort = { column: 'symbol', direction: 'asc' };
let draggedColumn = null;
const portfolios = new Map();
let activePortfolioView = 'new';
const removePortfolioNames = new Set();
const expandedRows = new Set();
const selectedGroupRows = new Set();
const selectedAvailableColumns = new Set();
const selectedActiveColumns = new Set();
let undoViewSnapshot = null;
let lastRenderedViewSnapshot = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function instrumentId(item) {
  return `${item.source}:${item.symbol}`;
}

function parseSearch() {
  const parsed = { include: new Set(filters.include), exclude: new Set(filters.exclude), text: [] };
  let mode = '';
  const tokens = elements.search.value.match(/!#|#|"(?:\\.|[^"\\])*"|[^\s,]+/g) || [];
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
      if (phrase) parsed.text.push(phrase);
      continue;
    }
    if (rawToken.startsWith('!#')) {
      mode = 'exclude';
      if (rawToken.length > 2) parsed.exclude.add(rawToken.slice(2).toLowerCase());
    } else if (rawToken.startsWith('#')) {
      mode = 'include';
      if (rawToken.length > 1) parsed.include.add(rawToken.slice(1).toLowerCase());
    } else if (mode) {
      parsed[mode].add(rawToken.toLowerCase());
    } else {
      parsed.text.push(rawToken.toLowerCase());
    }
  }
  return parsed;
}

function visibleItems() {
  const query = parseSearch();
  return CATALOG.filter((item) => {
    if (activePortfolioView !== 'new' && !portfolios.get(activePortfolioView)?.has(instrumentId(item))) return false;
    if (elements.source.value !== 'all' && item.source !== elements.source.value) return false;
    const tags = new Set([...item.tags, item.kind].map((tag) => tag.toLowerCase()));
    if (![...query.include].every((tag) => tags.has(tag))) return false;
    if ([...query.exclude].some((tag) => tags.has(tag))) return false;
    if (!query.text.every((term) => `${item.symbol} ${item.name} ${item.source} ${item.assetClass} ${item.form} ${item.tags.join(' ')}`.toLowerCase().includes(term))) return false;
    for (const column of columnsByClass.all) {
      const bounds = columnBounds[column];
      if (!bounds || !Number.isFinite(item[column])) continue;
      if (bounds.min !== '' && item[column] < Number(bounds.min)) return false;
      if (bounds.max !== '' && item[column] > Number(bounds.max)) return false;
    }
    return true;
  }).sort((left, right) => {
    const a = left[sort.column] ?? left.symbol;
    const b = right[sort.column] ?? right.symbol;
    const comparison = typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

function displayValue(item, column) {
  const value = item[column];
  if (value === undefined || value === null || value === '') return 'NaN';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return String(value);
}

function buildTree(items) {
  const classes = new Map();
  items.forEach((item) => {
    if (!classes.has(item.assetClass)) classes.set(item.assetClass, new Map());
    const forms = classes.get(item.assetClass);
    if (!forms.has(item.form)) forms.set(item.form, []);
    if (item.form === 'Option') return;
    forms.get(item.form).push(item);
  });
  return [...classes].map(([assetClass, forms]) => ({
    key: `asset:${assetClass}`,
    label: assetClass,
    children: [...forms].map(([form, instruments]) => ({
      key: `form:${assetClass}:${form}`,
      label: form,
      children: form === 'Option'
        ? buildOptionTree(items.filter((item) => item.assetClass === assetClass && item.form === 'Option'), assetClass)
        : instruments.map((item) => ({ key: instrumentId(item), item })),
    })),
  }));
}

function buildOptionTree(items, assetClass) {
  const underlyings = new Map();
  for (const item of items) {
    const underlying = item.symbol.split(/\s+/)[0];
    if (!underlyings.has(underlying)) underlyings.set(underlying, new Map());
    const expirations = underlyings.get(underlying);
    if (!expirations.has(item.expiration)) expirations.set(item.expiration, []);
    expirations.get(item.expiration).push(item);
  }
  return [...underlyings].map(([underlying, expirations]) => ({
    key: `option-underlying:${assetClass}:${underlying}`,
    label: underlying,
    children: [...expirations].map(([expiration, contracts]) => ({
      key: `option-expiration:${assetClass}:${underlying}:${expiration}`,
      label: new Date(`${expiration}T00:00:00Z`).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      children: contracts.map((item) => ({
        key: `option-strike:${assetClass}:${underlying}:${expiration}:${item.strike}`,
        label: `Strike $${item.strike}`,
        children: [{
          key: instrumentId(item),
          label: 'Available data',
          item,
        }],
      })),
    })),
  }));
}

function nodeItems(node) {
  if (node.item) return [node.item];
  return node.children.flatMap(nodeItems);
}

function drillLightness(depth) {
  return depth === 0 ? 18 : Math.min(93, 72 + (depth - 1) * 9);
}

function drillSaturation(depth) {
  return depth === 0 ? 52 : Math.max(12, 30 - (depth - 1) * 8);
}

function drillTextColor(hue, lightness, depth, columnIndex) {
  const saturation = drillSaturation(depth);
  const columnSaturation = columnIndex === 0 || columnIndex > 8
    ? saturation : Math.max(0, saturation - columnIndex * 2);
  const columnLightness = Math.min(93, lightness + (columnIndex === 0 || columnIndex > 8 ? 0 : columnIndex * 2));
  const h = hue / 60;
  const chroma = (1 - Math.abs(2 * columnLightness / 100 - 1)) * columnSaturation / 100;
  const x = chroma * (1 - Math.abs(h % 2 - 1));
  const match = columnLightness / 100 - chroma / 2;
  const rgb = h < 1 ? [chroma, x, 0] : h < 2 ? [x, chroma, 0]
    : h < 3 ? [0, chroma, x] : h < 4 ? [0, x, chroma]
      : h < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const linear = rgb.map((value) => {
    const channel = value + match;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const rowLuminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const whiteContrast = 1.05 / (rowLuminance + 0.05);
  const darkContrast = (rowLuminance + 0.05) / (DRILL_DARK_TEXT_LUMA + 0.05);
  return whiteContrast >= darkContrast ? '#fff' : '#344033';
}

function renderNode(node, columns, depth = 0, index = 0, parentHue = null) {
  const items = nodeItems(node);
  const isGroup = !node.item;
  const checked = isGroup
    ? selectedGroupRows.has(node.key) && items.every((item) => selectedSymbols.has(instrumentId(item)))
    : selectedSymbols.has(instrumentId(node.item));
  const values = node.item
    ? columns.map((column) => column === 'symbol' && node.item.form === 'Option'
      ? node.label
      : displayValue(node.item, column))
    : columns.map((column) => {
      if (column === 'symbol' || column === 'form') return node.label;
      if (column === 'name') return `${items.length} item${items.length === 1 ? '' : 's'}`;
      if (column === 'source') return [...new Set(items.map((item) => item.source))].join(', ');
      return 'NaN';
    });
  const expanded = isGroup && expandedRows.has(node.key);
  const hue = parentHue === null ? DRILL_HUES[index % DRILL_HUES.length] : parentHue;
  const lightness = drillLightness(depth);
  const saturation = drillSaturation(depth);
  const yellowShift = Math.max(0, depth - 4) / 3;
  const displayHue = (hue + ((52 - hue + 360) % 360) * yellowShift) % 360;
  const row = `<tr class="${isGroup ? 'group-row' : 'instrument-row'} ${node.item ? '' : `depth-${node.key.startsWith('asset:') ? 0 : 1}`}" data-rainbow-row data-depth="${depth}" style="--row-hue:${displayHue};--row-saturation:${saturation}%;--row-lightness:${lightness}%">
    <td class="tree-pick" style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, 0)}">
      ${isGroup
    ? `<button type="button" class="tree-toggle" data-toggle-node="${escapeHtml(node.key)}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${escapeHtml(node.label)}" aria-expanded="${expanded}"><span aria-hidden="true">›</span></button>`
    : '<span class="tree-toggle-spacer" aria-hidden="true"></span>'}
      <input class="instrument-select" type="checkbox" data-node-id="${escapeHtml(node.key)}" ${checked ? 'checked' : ''} aria-label="Select ${escapeHtml(node.label || node.item.symbol)}">
    </td>
    ${values.map((value, index) => `<td class="${index === 0 && isGroup ? 'tree-label' : ''}" style="--cell-text-color:${drillTextColor(displayHue, lightness, depth, index + 1)}">${escapeHtml(value)}${node.item?.form === 'Option' && index === 0
      ? `<small class="option-availability">Frequencies: ${escapeHtml(node.item.frequencies.join(', '))}<br>Date ranges: ${escapeHtml(node.item.dateRanges.join('; '))}</small>`
      : ''}</td>`).join('')}
  </tr>`;
  if (!expanded) return row;
  return `${row}<tr class="drill-child"><td colspan="${columns.length + 1}"><table class="nested-table"><tbody>${node.children.map((child, childIndex) => renderNode(child, columns, depth + 1, childIndex, displayHue)).join('')}</tbody></table></td></tr>`;
}

function renderTable() {
  const items = visibleItems();
  const columns = columnsByClass.all;
  const tree = buildTree(items);
  elements.table.classList.toggle('rainbow-mode', document.querySelector('#rainbow-drill-toggle').checked);
  elements.tableHead.innerHTML = `<tr><th>Select</th>${columns.map((column) => `
    <th draggable="true" class="column-drag" data-column="${column}">
      <button class="sort-button" type="button" data-sort="${column}">${escapeHtml(LABELS[column])} ${sort.column === column ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</button>
    </th>`).join('')}</tr>`;
  elements.tableBody.innerHTML = tree.length
    ? tree.map((node, index) => renderNode(node, columns, 0, index)).join('')
    : `<tr><td colspan="${columns.length + 1}" class="empty-row">No instruments match. Try another source or filter.</td></tr>`;
  elements.count.textContent = `${selectedSymbols.size} selected`;
  elements.all.checked = items.length > 0 && items.every((item) => selectedSymbols.has(instrumentId(item)));
  elements.all.indeterminate = !elements.all.checked && items.some((item) => selectedSymbols.has(instrumentId(item)));
  renderColumnsDialog();
  lastRenderedViewSnapshot = captureViewSnapshot();
  elements.undo.disabled = !undoViewSnapshot;
}

function findTreeNode(nodes, key) {
  for (const node of nodes) {
    if (node.key === key) return node;
    if (node.children) {
      const found = findTreeNode(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

function setNodeSelection(node, checked) {
  if (node.item) {
    if (checked) selectedSymbols.add(instrumentId(node.item));
    else selectedSymbols.delete(instrumentId(node.item));
    return;
  }
  if (checked) selectedGroupRows.add(node.key);
  else selectedGroupRows.delete(node.key);
  node.children.forEach((child) => setNodeSelection(child, checked));
}

function captureViewSnapshot() {
  return {
    source: elements.source.value,
    portfolioView: activePortfolioView,
    search: elements.search.value,
    include: new Set(filters.include),
    exclude: new Set(filters.exclude),
    expandedRows: new Set(expandedRows),
    selectedSymbols: new Set(selectedSymbols),
    selectedGroupRows: new Set(selectedGroupRows),
    builderSymbols: new Set(builderSymbols),
    sort: { ...sort },
    columns: [...columnsByClass.all],
    columnBounds: structuredClone(columnBounds),
  };
}

function recordViewChange() {
  undoViewSnapshot = lastRenderedViewSnapshot;
}

function restorePreviousView() {
  if (!undoViewSnapshot) return;
  const snapshot = undoViewSnapshot;
  undoViewSnapshot = null;
  elements.source.value = snapshot.source;
  activePortfolioView = snapshot.portfolioView;
  elements.search.value = snapshot.search;
  filters = { include: new Set(snapshot.include), exclude: new Set(snapshot.exclude) };
  expandedRows.clear();
  snapshot.expandedRows.forEach((key) => expandedRows.add(key));
  selectedSymbols = new Set(snapshot.selectedSymbols);
  selectedGroupRows.clear();
  snapshot.selectedGroupRows.forEach((key) => selectedGroupRows.add(key));
  builderSymbols.clear();
  snapshot.builderSymbols.forEach((key) => builderSymbols.add(key));
  sort = { ...snapshot.sort };
  columnsByClass.all = [...snapshot.columns];
  columnBounds = structuredClone(snapshot.columnBounds);
  render();
}

function renderPortfolioChoices() {
    const options = [...portfolios.keys()];
    const selectedMergeSource = elements.mergePortfolioSource.value;
    elements.portfolioView.innerHTML = `<option value="new">New</option>${options.map((name) => `
      <option value="${escapeHtml(name)}">${escapeHtml(name)}</option>
    `).join('')}`;
    if (activePortfolioView !== 'new' && !portfolios.has(activePortfolioView)) activePortfolioView = 'new';
    elements.portfolioView.value = activePortfolioView;
    elements.removePortfolioOptions.innerHTML = options.length ? options.map((name) => `
      <label><input type="checkbox" data-portfolio-target="remove" value="${escapeHtml(name)}" ${removePortfolioNames.has(name) ? 'checked' : ''}> ${escapeHtml(name)}</label>
    `).join('') : '<span class="no-portfolios">No portfolios yet</span>';
    const mergeOptions = options.filter((name) => name !== activePortfolioView);
    elements.mergePortfolioSource.innerHTML = `<option value="">Choose portfolio</option>${mergeOptions.map((name) => `
      <option value="${escapeHtml(name)}">${escapeHtml(name)}</option>
    `).join('')}`;
    elements.mergePortfolioSource.value = mergeOptions.includes(selectedMergeSource) ? selectedMergeSource : '';
    elements.cards.innerHTML = options.map((name) => {
    const members = [...portfolios.get(name)];
    const memberLabels = members.map((id) => {
      const item = CATALOG.find((catalogItem) => instrumentId(catalogItem) === id);
      return item ? `${item.source.toUpperCase()} ${item.symbol}` : id;
    });
    return `<article class="portfolio-card"><h3>${escapeHtml(name)}</h3><p>${members.length} instruments${members.length ? ` · ${memberLabels.slice(0, 5).map(escapeHtml).join(', ')}` : ''}</p></article>`;
  }).join('') || '<p class="help">No portfolios yet. Select instruments and enter a new name to create one.</p>';
}

function renderPortfolioBuilder() {
  const items = [...builderSymbols].map((id) => CATALOG.find((item) => instrumentId(item) === id)).filter(Boolean);
  items.sort((left, right) => {
    const a = left[sort.column] ?? left.symbol;
    const b = right[sort.column] ?? right.symbol;
    const comparison = typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
    return sort.direction === 'asc' ? comparison : -comparison;
  });
  elements.builderCount.textContent = `${items.length} instrument${items.length === 1 ? '' : 's'} staged`;
  elements.builderItems.innerHTML = `
    <div class="builder-list-actions">
      <label class="select-all"><input id="builder-select-all" type="checkbox" ${items.length > 0 && items.every((item) => selectedBuilderSymbols.has(instrumentId(item))) ? 'checked' : ''}> Select all staged</label>
      <button id="remove-selected-from-builder" type="button" class="button secondary" ${selectedBuilderSymbols.size ? '' : 'disabled'}>− Remove selected</button>
    </div>
    <div class="table-wrap creation-table-wrap">
      <table class="creation-table" aria-label="Portfolio creation table">
        <thead><tr><th>Select</th>${columnsByClass.all.map((column) => `
          <th draggable="true" class="column-drag" data-column="${column}">
            <button class="sort-button" type="button" data-sort="${column}">${escapeHtml(LABELS[column])} ${sort.column === column ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</button>
          </th>`).join('')}<th>Action</th></tr></thead>
        <tbody>${items.length ? items.map((item) => `
          <tr>
            <td><input type="checkbox" data-builder-symbol="${escapeHtml(instrumentId(item))}" ${selectedBuilderSymbols.has(instrumentId(item)) ? 'checked' : ''} aria-label="Select ${escapeHtml(item.symbol)} in creation table"></td>
            ${columnsByClass.all.map((column) => `<td>${escapeHtml(displayValue(item, column))}</td>`).join('')}
            <td><button type="button" class="button secondary creation-remove" data-remove-builder-item="${escapeHtml(instrumentId(item))}" aria-label="Remove ${escapeHtml(item.symbol)} from creation table">Remove</button></td>
          </tr>
        `).join('') : `<tr><td class="empty-row" colspan="${columnsByClass.all.length + 2}">No instruments in this portfolio yet.</td></tr>`}</tbody>
      </table>
    </div>
  `;
  if (activePortfolioView !== 'new' && !elements.builderName.matches(':focus')) {
    elements.builderName.value = activePortfolioView;
  } else if (activePortfolioView === 'new' && !elements.builderName.matches(':focus') && portfolios.has(elements.builderName.value.trim())) {
    elements.builderName.value = '';
  }
}

function renderFilterChips() {
  const chips = [...filters.include].map((tag) => ({ tag, type: 'include', prefix: '#' }))
    .concat([...filters.exclude].map((tag) => ({ tag, type: 'exclude', prefix: '!#' })));
  elements.filterChips.innerHTML = chips.map(({ tag, type, prefix }) => `
    <span class="chip">${prefix}${escapeHtml(tag)}<button type="button" data-remove-filter="${type}:${escapeHtml(tag)}" aria-label="Remove ${prefix}${escapeHtml(tag)}">×</button></span>
  `).join('');
}

function renderTagFilters() {
  const tags = [...new Set(CATALOG.flatMap((item) => [...item.tags, item.kind].map((tag) => tag.toLowerCase())))].sort();
  document.querySelector('#catalog-tags').innerHTML = tags.map((tag) => `<option value="${escapeHtml(tag)}"></option>`).join('');
  for (const [type, set] of Object.entries({ include: filters.include, exclude: filters.exclude })) {
    const container = document.querySelector(`#${type}-tag-options`);
    const count = document.querySelector(`#${type}-tag-count`);
    count.textContent = String(set.size);
    container.innerHTML = set.size
      ? [...set].sort().map((tag) => `
        <div class="tag-filter-option"><span>${type === 'include' ? '#' : '!#'}${escapeHtml(tag)}</span>
          <button type="button" data-remove-filter="${type}" data-tag="${escapeHtml(tag)}" aria-label="Remove ${type} tag ${escapeHtml(tag)}">−</button>
        </div>`).join('')
      : '<p class="no-tag-filters">No tags added.</p>';
  }
}

function renderColumnsDialog() {
  const available = COLUMN_DEFINITIONS.filter((column) => !columnsByClass.all.includes(column));
  document.querySelector('#available-column-options').innerHTML = available.map((column) => `
    <label class="column-option"><input type="checkbox" data-available-column="${column}" ${selectedAvailableColumns.has(column) ? 'checked' : ''}> ${escapeHtml(LABELS[column])}</label>
  `).join('') || '<p class="no-tag-filters">All columns are active.</p>';
  document.querySelector('#active-column-options').innerHTML = columnsByClass.all.map((column) => `
    <label class="column-option"><input type="checkbox" data-active-column="${column}" ${selectedActiveColumns.has(column) ? 'checked' : ''}> ${escapeHtml(LABELS[column])}</label>
  `).join('') || '<p class="no-tag-filters">No display columns selected.</p>';
  document.querySelector('#select-all-available-columns').checked = available.length > 0 && available.every((column) => selectedAvailableColumns.has(column));
  document.querySelector('#select-all-active-columns').checked = columnsByClass.all.length > 0 && columnsByClass.all.every((column) => selectedActiveColumns.has(column));
  const activeColumns = columnsByClass.all.filter((column) => NUMERIC_COLUMNS.has(column));
  document.querySelector('#column-bounds').innerHTML = activeColumns.map((column) => `
    <div class="bound-row"><strong>${escapeHtml(LABELS[column])}</strong>
      <label>Min<input type="number" step="any" data-bound="${column}:min" value="${escapeHtml(columnBounds[column]?.min ?? '')}" placeholder="No min"></label>
      <label>Max<input type="number" step="any" data-bound="${column}:max" value="${escapeHtml(columnBounds[column]?.max ?? '')}" placeholder="No max"></label>
    </div>
  `).join('');
}

function render() {
  renderFilterChips();
  renderTagFilters();
  renderPortfolioChoices();
  renderPortfolioBuilder();
  renderTable();
}

elements.undo.addEventListener('click', restorePreviousView);
elements.source.addEventListener('change', () => {
  recordViewChange();
  render();
});
elements.portfolioView.addEventListener('change', () => {
  recordViewChange();
  const stagedForExistingPortfolio = activePortfolioView === 'new' && elements.portfolioView.value !== 'new'
    ? new Set(builderSymbols)
    : new Set();
  activePortfolioView = elements.portfolioView.value;
  selectedSymbols.clear();
  selectedGroupRows.clear();
  selectedBuilderSymbols.clear();
  builderSymbols.clear();
  portfolios.get(activePortfolioView)?.forEach((symbol) => builderSymbols.add(symbol));
  stagedForExistingPortfolio.forEach((symbol) => builderSymbols.add(symbol));
  elements.builderName.value = activePortfolioView === 'new' ? '' : activePortfolioView;
  renderPortfolioBuilder();
  renderTable();
});
elements.search.addEventListener('input', () => {
  recordViewChange();
  render();
});
elements.all.addEventListener('change', () => {
  const tree = buildTree(visibleItems());
  tree.forEach((node) => setNodeSelection(node, elements.all.checked));
  renderTable();
});
document.querySelector('#instrument-table tbody').addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-node-id]');
  if (!checkbox) return;
  const node = findTreeNode(buildTree(visibleItems()), checkbox.dataset.nodeId);
  if (!node) return;
  setNodeSelection(node, checkbox.checked);
  renderTable();
});
document.querySelector('#rainbow-drill-toggle').addEventListener('change', () => {
  elements.table.classList.toggle('rainbow-mode', document.querySelector('#rainbow-drill-toggle').checked);
});
document.querySelector('#instrument-table tbody').addEventListener('click', (event) => {
  const button = event.target.closest('[data-toggle-node]');
  if (!button) return;
  recordViewChange();
  const key = button.dataset.toggleNode;
  if (expandedRows.has(key)) expandedRows.delete(key);
  else expandedRows.add(key);
  renderTable();
});
document.querySelector('#instrument-table thead').addEventListener('click', (event) => {
  const button = event.target.closest('[data-sort]');
  if (!button) return;
  recordViewChange();
  const column = button.dataset.sort;
  sort = { column, direction: sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc' };
  renderTable();
});
document.querySelector('#instrument-table thead').addEventListener('dragstart', (event) => {
  const header = event.target.closest('[data-column]');
  if (!header || !header.draggable) return;
  draggedColumn = header.dataset.column;
  event.dataTransfer.setData('text/plain', draggedColumn);
});
document.querySelector('#instrument-table thead').addEventListener('dragover', (event) => {
  if (event.target.closest('[data-column]')) event.preventDefault();
});
document.querySelector('#instrument-table thead').addEventListener('drop', (event) => {
  const target = event.target.closest('[data-column]');
  if (!target || !draggedColumn) return;
  event.preventDefault();
  const columns = columnsByClass.all;
  const from = columns.indexOf(draggedColumn);
  const to = columns.indexOf(target.dataset.column);
  if (from >= 0 && to >= 0 && from !== to) {
    recordViewChange();
    columns.splice(to, 0, columns.splice(from, 1)[0]);
    renderTable();
  }
  draggedColumn = null;
});
document.querySelector('#add-filter').addEventListener('click', () => elements.filterDialog.showModal());
document.querySelector('#choose-columns').addEventListener('click', () => {
  renderColumnsDialog();
  elements.columnDialog.showModal();
});
function addTag(type) {
  const input = document.querySelector(`#${type}-tag-input`);
  const tag = input.value.trim().replace(/^#/, '').toLowerCase();
  if (!tag) {
    input.focus();
    return;
  }
  recordViewChange();
  filters[type].add(tag);
  input.value = '';
  render();
  input.focus();
}
document.querySelector('#add-include-tag').addEventListener('click', () => addTag('include'));
document.querySelector('#add-exclude-tag').addEventListener('click', () => addTag('exclude'));
elements.filterChips.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-filter]');
  if (!button) return;
  recordViewChange();
  const { type, tag } = button.dataset;
  filters[type].delete(tag);
  render();
});
document.querySelector('#filter-dialog').addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-filter]');
  if (!button) return;
  recordViewChange();
  filters[button.dataset.removeFilter].delete(button.dataset.tag);
  render();
});
document.querySelectorAll('#include-tag-input, #exclude-tag-input').forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTag(input.id === 'include-tag-input' ? 'include' : 'exclude');
  });
});
document.querySelector('#available-column-options').addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-available-column]');
  if (!checkbox) return;
  if (checkbox.checked) selectedAvailableColumns.add(checkbox.dataset.availableColumn);
  else selectedAvailableColumns.delete(checkbox.dataset.availableColumn);
  renderColumnsDialog();
});
document.querySelector('#active-column-options').addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-active-column]');
  if (!checkbox) return;
  if (checkbox.checked) selectedActiveColumns.add(checkbox.dataset.activeColumn);
  else selectedActiveColumns.delete(checkbox.dataset.activeColumn);
  renderColumnsDialog();
});
document.querySelector('#select-all-available-columns').addEventListener('change', (event) => {
  const available = COLUMN_DEFINITIONS.filter((column) => !columnsByClass.all.includes(column));
  selectedAvailableColumns.clear();
  if (event.target.checked) available.forEach((column) => selectedAvailableColumns.add(column));
  renderColumnsDialog();
});
document.querySelector('#select-all-active-columns').addEventListener('change', (event) => {
  selectedActiveColumns.clear();
  if (event.target.checked) columnsByClass.all.forEach((column) => selectedActiveColumns.add(column));
  renderColumnsDialog();
});
document.querySelector('#add-columns').addEventListener('click', () => {
  recordViewChange();
  for (const column of selectedAvailableColumns) {
    if (!columnsByClass.all.includes(column)) columnsByClass.all.push(column);
  }
  selectedAvailableColumns.clear();
  renderTable();
});
document.querySelector('#remove-columns').addEventListener('click', () => {
  recordViewChange();
  columnsByClass.all = columnsByClass.all.filter((column) => !selectedActiveColumns.has(column));
  selectedActiveColumns.clear();
  renderTable();
});
document.querySelector('#column-bounds').addEventListener('change', (event) => {
  const input = event.target.closest('[data-bound]');
  if (!input) return;
  recordViewChange();
  const [column, bound] = input.dataset.bound.split(':');
  columnBounds[column] ||= { min: '', max: '' };
  columnBounds[column][bound] = input.value;
  renderTable();
});
document.querySelector('.membership-actions').addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-portfolio-target]');
  if (!checkbox) return;
  if (checkbox.checked) removePortfolioNames.add(checkbox.value);
  else removePortfolioNames.delete(checkbox.value);
  renderPortfolioChoices();
});
document.querySelector('#add-selected-to-builder').addEventListener('click', () => {
  if (!selectedSymbols.size) {
    elements.status.textContent = 'Select instruments from the catalog before adding them to the builder list.';
    return;
  }
  selectedSymbols.forEach((symbol) => builderSymbols.add(symbol));
  const added = selectedSymbols.size;
  selectedSymbols.clear();
  selectedGroupRows.clear();
  selectedBuilderSymbols.clear();
  elements.status.textContent = `Added ${added} selected instrument${added === 1 ? '' : 's'} to the portfolio builder list.`;
  document.querySelector('#add-selected-to-builder').closest('.portfolio-action-picker').open = false;
  render();
});
elements.builderItems.addEventListener('click', (event) => {
  if (event.target.closest('#remove-selected-from-builder')) {
    selectedBuilderSymbols.forEach((symbol) => builderSymbols.delete(symbol));
    selectedBuilderSymbols.clear();
    render();
    return;
  }
  const button = event.target.closest('[data-remove-builder-item]');
  if (button) {
    builderSymbols.delete(button.dataset.removeBuilderItem);
    selectedBuilderSymbols.delete(button.dataset.removeBuilderItem);
    render();
    return;
  }
  const sortButton = event.target.closest('[data-sort]');
  if (!sortButton) return;
  recordViewChange();
  const column = sortButton.dataset.sort;
  sort = { column, direction: sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc' };
  render();
});
elements.builderItems.addEventListener('dragstart', (event) => {
  const header = event.target.closest('[data-column]');
  if (!header) return;
  draggedColumn = header.dataset.column;
  event.dataTransfer.setData('text/plain', draggedColumn);
});
elements.builderItems.addEventListener('dragover', (event) => {
  if (event.target.closest('[data-column]')) event.preventDefault();
});
elements.builderItems.addEventListener('drop', (event) => {
  const target = event.target.closest('[data-column]');
  if (!target || !draggedColumn) return;
  event.preventDefault();
  const columns = columnsByClass.all;
  const from = columns.indexOf(draggedColumn);
  const to = columns.indexOf(target.dataset.column);
  if (from >= 0 && to >= 0 && from !== to) {
    recordViewChange();
    columns.splice(to, 0, columns.splice(from, 1)[0]);
    render();
  }
  draggedColumn = null;
});
elements.builderItems.addEventListener('change', (event) => {
  if (event.target.id === 'builder-select-all') {
    selectedBuilderSymbols.clear();
    if (event.target.checked) builderSymbols.forEach((symbol) => selectedBuilderSymbols.add(symbol));
  } else if (event.target.hasAttribute('data-builder-symbol')) {
    const symbol = event.target.dataset.builderSymbol;
    if (event.target.checked) selectedBuilderSymbols.add(symbol);
    else selectedBuilderSymbols.delete(symbol);
  } else {
    return;
  }
  render();
});
document.querySelector('#clear-builder-list').addEventListener('click', () => {
  builderSymbols.clear();
  selectedBuilderSymbols.clear();
  render();
});
document.querySelector('#merge-portfolios').addEventListener('click', () => {
  const sourceName = elements.mergePortfolioSource.value;
  const source = portfolios.get(sourceName);
  if (!source || sourceName === activePortfolioView) {
    elements.status.textContent = 'Choose another saved portfolio before merging into the creation table.';
    return;
  }
  source.forEach((symbol) => builderSymbols.add(symbol));
  selectedBuilderSymbols.clear();
  elements.status.textContent = `Merged "${sourceName}" into the creation table. Save to keep the changes.`;
  render();
});
document.querySelector('#save-portfolio-builder').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = elements.builderName.value.trim();
  if (!name) {
    elements.status.textContent = 'Enter a portfolio name before saving the builder list.';
    elements.builderName.focus();
    return;
  }
  if (!builderSymbols.size) {
    elements.status.textContent = 'Add instruments to the builder list before saving.';
    return;
  }
  const editingCurrentPortfolio = activePortfolioView !== 'new' && name === activePortfolioView;
  if (portfolios.has(name) && !editingCurrentPortfolio) {
    elements.status.textContent = 'A portfolio with that name already exists. Select it to update it.';
    return;
  }
  portfolios.set(name, new Set(builderSymbols));
  activePortfolioView = name;
  selectedSymbols.clear();
  selectedGroupRows.clear();
  selectedBuilderSymbols.clear();
  elements.status.textContent = `Saved ${name} with ${builderSymbols.size} instrument${builderSymbols.size === 1 ? '' : 's'}.`;
  render();
});
document.querySelector('#remove-selected').addEventListener('click', () => {
  let removed = 0;
  removePortfolioNames.forEach((name) => selectedSymbols.forEach((symbol) => {
    if (portfolios.get(name)?.delete(symbol)) {
      removed += 1;
      if (activePortfolioView === name) builderSymbols.delete(symbol);
    }
  }));
  if (!removed) return;
  elements.status.textContent = `Removed ${removed} instrument${removed === 1 ? '' : 's'} from the selected portfolios.`;
  removePortfolioNames.clear();
  document.querySelector('#remove-selected').closest('.portfolio-action-picker').open = false;
  render();
});

render();
