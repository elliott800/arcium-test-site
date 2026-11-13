const MODEL_CATALOG = [
  { id: 'model_a', name: 'alpha', type: 'AlphaBag', silo: '', machines: ['Machine 01'], instruments: [], rates: [], inSampleStats: null, outSampleStats: null, currentSr: null, inSampleTestedAt: null, outSampleTestedAt: null, tags: ['model', 'alphabag', 'machine-01'] },
  { id: 'model_b', name: 'classifier', type: 'CLFBag', silo: '', machines: ['Machine 01'], instruments: [], rates: [], inSampleStats: null, outSampleStats: null, currentSr: null, inSampleTestedAt: null, outSampleTestedAt: null, tags: ['model', 'clfbag', 'machine-01'] },
  { id: 'model_c', name: 'model_c', type: 'Mix Models', silo: '', machines: ['Machine 01', 'Machine 02'], instruments: [], rates: [], inSampleStats: null, outSampleStats: null, currentSr: null, inSampleTestedAt: null, outSampleTestedAt: null, tags: ['model', 'mix', 'machine-01', 'machine-02'] },
  { id: 'model_d', name: 'model_d', type: 'Time Mix Models', silo: '', machines: ['Machine 02'], instruments: [], rates: [], inSampleStats: null, outSampleStats: null, currentSr: null, inSampleTestedAt: null, outSampleTestedAt: null, tags: ['model', 'time-mix', 'machine-02'] },
];
const MODEL_TYPE_ORDER = ['AlphaBag', 'CLFBag', 'Mix Models', 'Time Mix Models'];
const MODEL_COLUMNS = [
  { id: 'modelName', label: 'Model name' },
  { id: 'instruments', label: 'Instruments' },
  { id: 'rates', label: 'Data rates' },
  { id: 'inSampleStats', label: 'In-sample stats' },
  { id: 'outSampleStats', label: 'Out-of-sample stats' },
  { id: 'currentSr', label: 'Current SR' },
  { id: 'inSampleTestedAt', label: 'In-sample tested' },
  { id: 'outSampleTestedAt', label: 'Out-of-sample tested' },
];
const MODEL_LISTS_KEY = 'arcium-model-tracker-lists-v1';
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const elements = {
  silo: document.querySelector('#silo-filter'),
  search: document.querySelector('#model-search'),
  filterChips: document.querySelector('#model-filter-chips'),
  listSelect: document.querySelector('#model-list-select'),
  listName: document.querySelector('#model-list-name'),
  importSource: document.querySelector('#model-import-source'),
  status: document.querySelector('#model-tracker-status'),
  catalog: document.querySelector('#model-catalog-table'),
  list: document.querySelector('#model-list-table'),
  selectedCount: document.querySelector('#selected-model-count'),
  listCount: document.querySelector('#model-list-count'),
  selectAll: document.querySelector('#select-all-models'),
  selectAllMembers: document.querySelector('#select-all-list-members'),
  filterDialog: document.querySelector('#model-filter-dialog'),
  columnsDialog: document.querySelector('#model-columns-dialog'),
};

let lists = loadModelLists();
let activeListName = '';
let draftMembers = new Set();
let selectedCatalogModels = new Set();
let selectedListMembers = new Set();
let filters = { include: new Set(), exclude: new Set() };
let columns = MODEL_COLUMNS.map((column) => column.id);
let selectedAvailableColumns = new Set();
let selectedActiveColumns = new Set();
let sort = { column: 'modelName', direction: 'asc' };
let draggedColumn = null;
let searchQuery = '';
const expandedRows = new Set(['catalog', 'member'].flatMap((table) => MODEL_TYPE_ORDER.flatMap((type) => [
  `${table}:type:${type}`,
  ...[...new Set(MODEL_CATALOG.filter((model) => model.type === type).map((model) => model.silo || 'Not recorded'))]
    .map((silo) => `${table}:silo:${type}:${silo}`),
])));

function loadModelLists() {
  let raw;
  try {
    raw = localStorage.getItem(MODEL_LISTS_KEY);
  } catch {
    elements.status.textContent = 'Could not load Model Tracker lists from this browser. Check the browser storage settings.';
    return [];
  }
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    elements.status.textContent = 'Saved Model Tracker lists could not be read because the browser data is invalid.';
    return [];
  }
  if (!Array.isArray(parsed) || parsed.some((list) => !list || typeof list.name !== 'string'
    || !Array.isArray(list.items) || list.items.some((item) => typeof item !== 'string'))) {
    elements.status.textContent = 'Saved Model Tracker lists have an unexpected format; create a new list or clear invalid browser data.';
    return [];
  }
  return parsed.map((list) => ({
    name: list.name,
    items: [...new Set(list.items.filter((item) => MODEL_CATALOG.some((model) => model.id === item)))],
  }));
}

function persistModelLists() {
  try {
    localStorage.setItem(MODEL_LISTS_KEY, JSON.stringify(lists));
    return true;
  } catch {
    elements.status.textContent = 'Could not save Model Tracker lists in this browser. Check the browser storage settings.';
    return false;
  }
}

function parseSearch() {
  const result = { include: new Set(filters.include), exclude: new Set(filters.exclude), text: [] };
  let mode = '';
  const tokens = searchQuery.match(/!#|#|"(?:\\.|[^"\\])*"|[^\s,]+/g) || [];
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
      const phrase = rawToken.slice(1, -1).replace(/\\"/g, '"').toLowerCase();
      if (phrase) result.text.push(phrase);
      continue;
    }
    if (rawToken.startsWith('!#')) {
      mode = 'exclude';
      if (rawToken.length > 2) result.exclude.add(rawToken.slice(2).toLowerCase());
    } else if (rawToken.startsWith('#')) {
      mode = 'include';
      if (rawToken.length > 1) result.include.add(rawToken.slice(1).toLowerCase());
    } else if (mode) {
      result[mode].add(rawToken.toLowerCase());
    } else {
      result.text.push(rawToken.toLowerCase());
    }
  }
  return result;
}

function currentRows() {
  const query = parseSearch();
  return MODEL_CATALOG.filter((model) => {
    if (elements.silo.value !== 'all' && (model.silo || 'Not recorded') !== elements.silo.value) return false;
    const tags = new Set([...model.tags, model.type.toLowerCase().replace(/\s+/g, '-')]);
    if (![...query.include].every((tag) => tags.has(tag))) return false;
    if ([...query.exclude].some((tag) => tags.has(tag))) return false;
    const searchable = [
      model.id, model.name, model.type, model.silo, ...model.instruments, ...model.rates,
      ...model.machines, ...model.tags,
    ].join(' ').toLowerCase();
    return query.text.every((term) => searchable.includes(term));
  }).sort((left, right) => {
    const a = valueFor(left, sort.column);
    const b = valueFor(right, sort.column);
    const comparison = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

function valueFor(model, column) {
  if (column === 'modelName') return model.name;
  const value = model[column];
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not recorded';
  return value === null || value === undefined || value === '' ? 'Not recorded' : String(value);
}

function renderColumns() {
  const available = MODEL_COLUMNS.filter((column) => !columns.includes(column.id));
  const active = columns.map((id) => MODEL_COLUMNS.find((column) => column.id === id)).filter(Boolean);
  document.querySelector('#model-available-columns').innerHTML = available.map((column) => `
    <label class="column-option"><input type="checkbox" data-available-column="${column.id}" ${selectedAvailableColumns.has(column.id) ? 'checked' : ''}> ${column.label}</label>
  `).join('') || '<p class="no-tag-filters">All columns are active.</p>';
  document.querySelector('#model-active-columns').innerHTML = active.map((column) => `
    <label class="column-option"><input type="checkbox" data-active-column="${column.id}" ${selectedActiveColumns.has(column.id) ? 'checked' : ''}> ${column.label}</label>
  `).join('') || '<p class="no-tag-filters">No active columns.</p>';
  document.querySelector('#select-all-model-available').checked =
    available.length > 0 && available.every((column) => selectedAvailableColumns.has(column.id));
  document.querySelector('#select-all-model-active').checked =
    active.length > 0 && active.every((column) => selectedActiveColumns.has(column.id));
}

function renderListChoices() {
  const selectedList = lists.find((list) => list.name === activeListName);
  const selectedSilo = elements.silo.value;
  const silos = [...new Set(MODEL_CATALOG.map((model) => model.silo || 'Not recorded'))].sort();
  elements.silo.innerHTML = `<option value="all">All silos</option>${silos.map((silo) => `
    <option value="${escapeHtml(silo)}">${escapeHtml(silo)}</option>
  `).join('')}`;
  elements.silo.value = silos.includes(selectedSilo) ? selectedSilo : 'all';
  elements.listSelect.innerHTML = `<option value="">New</option>${lists.map((list) => `
    <option value="${escapeHtml(list.name)}" ${list.name === activeListName ? 'selected' : ''}>${escapeHtml(list.name)} (${list.items.length})</option>
  `).join('')}`;
  elements.importSource.innerHTML = `<option value="">Choose list</option>${lists
    .filter((list) => list.name !== activeListName)
    .map((list) => `<option value="${escapeHtml(list.name)}">${escapeHtml(list.name)} (${list.items.length})</option>`).join('')}`;
  if (selectedList && !elements.listName.matches(':focus')) elements.listName.value = selectedList.name;
  if (!activeListName && !elements.listName.matches(':focus')) elements.listName.value = '';
}

function renderFilters() {
  const tags = [...new Set(MODEL_CATALOG.flatMap((model) => [
    ...model.tags,
    model.type.toLowerCase().replace(/\s+/g, '-'),
  ]))].sort();
  document.querySelector('#model-tags').innerHTML = tags.map((tag) => `<option value="${escapeHtml(tag)}"></option>`).join('');
  elements.filterChips.innerHTML = [
    ...[...filters.include].map((tag) => ({ type: 'include', tag, prefix: '#' })),
    ...[...filters.exclude].map((tag) => ({ type: 'exclude', tag, prefix: '!#' })),
  ].map(({ type, tag, prefix }) => `
    <span class="chip">${prefix}${escapeHtml(tag)}
      <button type="button" data-remove-filter="${type}:${escapeHtml(tag)}" aria-label="Remove ${prefix}${escapeHtml(tag)}">×</button>
    </span>
  `).join('');
}

function modelTree(rows) {
  return MODEL_TYPE_ORDER.map((type) => {
    const models = rows.filter((model) => model.type === type);
    if (!models.length) return null;
    const silos = new Map();
    models.forEach((model) => {
      const silo = model.silo || 'Not recorded';
      if (!silos.has(silo)) silos.set(silo, []);
      silos.get(silo).push(model);
    });
    return {
      key: `type:${type}`,
      label: type,
      children: [...silos].sort(([left], [right]) => left.localeCompare(right)).map(([silo, siloModels]) => ({
        key: `silo:${type}:${silo}`,
        label: silo,
        children: siloModels.map((model) => ({ key: `model:${model.id}`, label: model.name, model })),
      })),
    };
  }).filter(Boolean);
}

function modelsInNode(node) {
  return node.model ? [node.model] : node.children.flatMap(modelsInNode);
}

function findModelNode(nodes, key) {
  for (const node of nodes) {
    if (node.key === key) return node;
    const found = findModelNode(node.children || [], key);
    if (found) return found;
  }
  return null;
}

function renderModelNode(node, columnsInUse, selected, type, depth = 0) {
  const models = modelsInNode(node);
  const isGroup = !node.model;
  const selectedCount = models.filter((model) => selected.has(model.id)).length;
  const checked = models.length > 0 && selectedCount === models.length;
  const partial = selectedCount > 0 && !checked;
  const rowKey = `${type}:${node.key}`;
  const expanded = isGroup && expandedRows.has(rowKey);
  const values = node.model
    ? columnsInUse.map((column) => valueFor(node.model, column.id))
    : columnsInUse.map((column, index) => {
      if (index === 0 || column.id === 'modelName') return node.label;
      if (index === 1 || column.id === 'instruments') return `${models.length} model${models.length === 1 ? '' : 's'}`;
      return '';
    });
  const rowClass = isGroup
    ? `group-row ${node.key.startsWith('type:') ? 'model-type-row' : 'model-silo-row'}`
    : 'model-data-row';
  const row = `<tr class="${rowClass}" data-depth="${depth}">
    <td class="tree-pick">
      ${isGroup
    ? `<button type="button" class="tree-toggle" data-toggle-model-node="${escapeHtml(rowKey)}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${escapeHtml(node.label)}" aria-expanded="${expanded}"><span aria-hidden="true">›</span></button>`
    : '<span class="tree-toggle-spacer" aria-hidden="true"></span>'}
      <input type="checkbox" ${isGroup
    ? `data-${type}-group="${escapeHtml(node.key)}" ${partial ? 'data-partial="true"' : ''}`
    : `data-${type}-model="${escapeHtml(node.model.id)}"`} ${checked ? 'checked' : ''} aria-label="Select ${escapeHtml(node.label)}">
    </td>
    ${values.map((value, index) => `<td class="${index === 0 && isGroup ? 'model-tree-label' : ''}">${escapeHtml(value)}</td>`).join('')}
  </tr>`;
  if (!expanded) return row;
  return `${row}<tr class="drill-child"><td colspan="${columnsInUse.length + 1}"><table class="nested-table"><tbody>${node.children
    .map((child) => renderModelNode(child, columnsInUse, selected, type, depth + 1)).join('')}</tbody></table></td></tr>`;
}

function renderTable(table, rows, selected, type) {
  const columnsInUse = columns.map((id) => MODEL_COLUMNS.find((column) => column.id === id)).filter(Boolean);
  table.querySelector('thead').innerHTML = `<tr><th>Select</th>${columnsInUse.map((column) => `
    <th draggable="true" data-column="${column.id}" data-sort-column="${column.id}">
      <button class="sort-button" type="button" data-sort="${column.id}">
        ${column.label} ${sort.column === column.id ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
      </button>
    </th>
  `).join('')}</tr>`;
  table.querySelector('tbody').innerHTML = rows.length
    ? modelTree(rows).map((node) => renderModelNode(node, columnsInUse, selected, type)).join('')
    : `<tr><td colspan="${columnsInUse.length + 1}" class="empty-row">${type === 'catalog' ? 'No catalog models match these filters.' : 'No models in this list yet.'}</td></tr>`;
  table.querySelectorAll('input[data-partial="true"]').forEach((checkbox) => { checkbox.indeterminate = true; });
}

function render() {
  renderListChoices();
  renderFilters();
  renderColumns();
  const available = currentRows();
  const members = [...draftMembers].map((id) => MODEL_CATALOG.find((model) => model.id === id)).filter(Boolean);
  renderTable(elements.catalog, available, selectedCatalogModels, 'catalog');
  renderTable(elements.list, members, selectedListMembers, 'member');
  elements.selectedCount.textContent = `${selectedCatalogModels.size} selected`;
  elements.listCount.textContent = `${activeListName || 'New list'} · ${members.length} model${members.length === 1 ? '' : 's'}`;
  elements.selectAll.checked = available.length > 0 && available.every((model) => selectedCatalogModels.has(model.id));
  elements.selectAll.indeterminate = !elements.selectAll.checked && available.some((model) => selectedCatalogModels.has(model.id));
  elements.selectAllMembers.checked = members.length > 0 && members.every((model) => selectedListMembers.has(model.id));
  elements.selectAllMembers.indeterminate = !elements.selectAllMembers.checked
    && members.some((model) => selectedListMembers.has(model.id));
}

elements.silo.addEventListener('change', render);
elements.search.addEventListener('input', () => {
  searchQuery = elements.search.value;
  render();
});
elements.listSelect.addEventListener('change', () => {
  activeListName = elements.listSelect.value;
  const selected = lists.find((list) => list.name === activeListName);
  draftMembers = new Set(selected?.items || []);
  selectedListMembers.clear();
  render();
});
elements.selectAll.addEventListener('change', () => {
  currentRows().forEach((model) => {
    if (elements.selectAll.checked) selectedCatalogModels.add(model.id);
    else selectedCatalogModels.delete(model.id);
  });
  render();
});
elements.selectAllMembers.addEventListener('change', () => {
  draftMembers.forEach((id) => {
    if (elements.selectAllMembers.checked) selectedListMembers.add(id);
    else selectedListMembers.delete(id);
  });
  render();
});
elements.catalog.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-catalog-model]');
  if (checkbox) {
    if (checkbox.checked) selectedCatalogModels.add(checkbox.dataset.catalogModel);
    else selectedCatalogModels.delete(checkbox.dataset.catalogModel);
    render();
    return;
  }
  const groupCheckbox = event.target.closest('[data-catalog-group]');
  if (!groupCheckbox) return;
  const node = findModelNode(modelTree(currentRows()), groupCheckbox.dataset.catalogGroup);
  if (!node) return;
  modelsInNode(node).forEach((model) => {
    if (groupCheckbox.checked) selectedCatalogModels.add(model.id);
    else selectedCatalogModels.delete(model.id);
  });
  render();
});
elements.list.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-member-model]');
  if (checkbox) {
    if (checkbox.checked) selectedListMembers.add(checkbox.dataset.memberModel);
    else selectedListMembers.delete(checkbox.dataset.memberModel);
    render();
    return;
  }
  const groupCheckbox = event.target.closest('[data-member-group]');
  if (!groupCheckbox) return;
  const memberModels = [...draftMembers].map((id) => MODEL_CATALOG.find((model) => model.id === id)).filter(Boolean);
  const node = findModelNode(modelTree(memberModels), groupCheckbox.dataset.memberGroup);
  if (!node) return;
  modelsInNode(node).forEach((model) => {
    if (groupCheckbox.checked) selectedListMembers.add(model.id);
    else selectedListMembers.delete(model.id);
  });
  render();
});
document.querySelector('#add-models').addEventListener('click', () => {
  selectedCatalogModels.forEach((id) => draftMembers.add(id));
  selectedCatalogModels.clear();
  elements.status.textContent = 'Added selected models to the open list. Save the list to keep these changes.';
  render();
});
document.querySelector('#remove-models').addEventListener('click', () => {
  selectedListMembers.forEach((id) => draftMembers.delete(id));
  selectedListMembers.clear();
  elements.status.textContent = 'Removed selected models from the open list. Save the list to keep these changes.';
  render();
});
document.querySelector('#save-model-list').addEventListener('click', () => {
  const name = elements.listName.value.trim();
  if (!name) {
    elements.status.textContent = 'Enter a name before saving this Model Tracker list.';
    elements.listName.focus();
    return;
  }
  const collision = lists.find((list) => list.name.toLowerCase() === name.toLowerCase() && list.name !== activeListName);
  if (collision) {
    elements.status.textContent = `A list named "${collision.name}" already exists. Load it to update its members.`;
    return;
  }
  const existing = lists.find((list) => list.name === activeListName);
  if (existing) {
    existing.name = name;
    existing.items = [...draftMembers];
  } else {
    lists.push({ name, items: [...draftMembers] });
  }
  activeListName = name;
  if (persistModelLists()) elements.status.textContent = `Saved "${name}" with ${draftMembers.size} model${draftMembers.size === 1 ? '' : 's'}.`;
  render();
});
document.querySelector('#import-model-list').addEventListener('click', () => {
  const source = lists.find((list) => list.name === elements.importSource.value);
  if (!source) {
    elements.status.textContent = 'Choose a saved Model Tracker list to merge.';
    return;
  }
  source.items.forEach((id) => draftMembers.add(id));
  elements.status.textContent = `Merged "${source.name}" into the open list. Save to keep the changes.`;
  render();
});

document.querySelector('#open-model-filters').addEventListener('click', () => elements.filterDialog.showModal());
document.querySelector('#open-model-columns').addEventListener('click', () => elements.columnsDialog.showModal());
document.querySelectorAll('[data-close-model-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
document.querySelector('#apply-model-filters').addEventListener('click', () => {
  const tags = (id) => new Set((document.querySelector(id).value.match(/[a-z0-9_-]+/gi) || [])
    .map((tag) => tag.toLowerCase()));
  filters = { include: tags('#include-model-tags'), exclude: tags('#exclude-model-tags') };
  elements.filterDialog.close();
  render();
});
document.querySelector('#clear-model-filters').addEventListener('click', () => {
  filters = { include: new Set(), exclude: new Set() };
  document.querySelector('#include-model-tags').value = '';
  document.querySelector('#exclude-model-tags').value = '';
  elements.filterDialog.close();
  render();
});
elements.filterChips.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-filter]');
  if (!button) return;
  const [type, tag] = button.dataset.removeFilter.split(':');
  filters[type].delete(tag);
  render();
});
document.querySelector('#model-filter-dialog').addEventListener('close', () => {
  document.querySelector('#include-model-tags').value = [...filters.include].join(', ');
  document.querySelector('#exclude-model-tags').value = [...filters.exclude].join(', ');
});
document.querySelector('#model-available-columns').addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-available-column]');
  if (!checkbox) return;
  if (checkbox.checked) selectedAvailableColumns.add(checkbox.dataset.availableColumn);
  else selectedAvailableColumns.delete(checkbox.dataset.availableColumn);
  renderColumns();
});
document.querySelector('#model-active-columns').addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-active-column]');
  if (!checkbox) return;
  if (checkbox.checked) selectedActiveColumns.add(checkbox.dataset.activeColumn);
  else selectedActiveColumns.delete(checkbox.dataset.activeColumn);
  renderColumns();
});
document.querySelector('#select-all-model-available').addEventListener('change', (event) => {
  selectedAvailableColumns.clear();
  if (event.target.checked) MODEL_COLUMNS.filter((column) => !columns.includes(column.id))
    .forEach((column) => selectedAvailableColumns.add(column.id));
  renderColumns();
});
document.querySelector('#select-all-model-active').addEventListener('change', (event) => {
  selectedActiveColumns.clear();
  if (event.target.checked) columns.forEach((column) => selectedActiveColumns.add(column));
  renderColumns();
});
document.querySelector('#add-model-columns').addEventListener('click', () => {
  selectedAvailableColumns.forEach((id) => { if (!columns.includes(id)) columns.push(id); });
  selectedAvailableColumns.clear();
  render();
});
document.querySelector('#remove-model-columns').addEventListener('click', () => {
  columns = columns.filter((id) => !selectedActiveColumns.has(id));
  selectedActiveColumns.clear();
  render();
});

[elements.catalog, elements.list].forEach((table) => {
  table.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-toggle-model-node]');
    if (toggle) {
      const key = toggle.dataset.toggleModelNode;
      if (expandedRows.has(key)) expandedRows.delete(key);
      else expandedRows.add(key);
      render();
      return;
    }
    const button = event.target.closest('[data-sort]');
    if (!button) return;
    const column = button.dataset.sort;
    sort = { column, direction: sort.column === column && sort.direction === 'asc' ? 'desc' : 'asc' };
    render();
  });
  table.addEventListener('dragstart', (event) => {
    const header = event.target.closest('[data-column]');
    if (!header) return;
    draggedColumn = header.dataset.column;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedColumn);
  });
  table.addEventListener('dragover', (event) => {
    if (event.target.closest('[data-column]') && draggedColumn) event.preventDefault();
  });
  table.addEventListener('drop', (event) => {
    const header = event.target.closest('[data-column]');
    if (!header || !draggedColumn) return;
    event.preventDefault();
    const from = columns.indexOf(draggedColumn);
    const to = columns.indexOf(header.dataset.column);
    if (from >= 0 && to >= 0 && from !== to) columns.splice(to, 0, columns.splice(from, 1)[0]);
    draggedColumn = null;
    render();
  });
});

render();
