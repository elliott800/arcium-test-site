const MODEL_CATALOG = [
  { id: 'model_a', machines: ['Machine 01'], tags: ['model', 'machine-01'] },
  { id: 'model_b', machines: ['Machine 01'], tags: ['model', 'machine-01'] },
  { id: 'model_c', machines: ['Machine 01', 'Machine 02'], tags: ['model', 'machine-01', 'machine-02'] },
  { id: 'model_d', machines: ['Machine 02'], tags: ['model', 'machine-02'] },
];
const MODEL_COLUMNS = [
  { id: 'id', label: 'Model' },
  { id: 'machines', label: 'Machines' },
  { id: 'tags', label: 'Tags' },
  { id: 'scope', label: 'Machine scope' },
  { id: 'machineCount', label: 'Machine count' },
];
const MODEL_LISTS_KEY = 'arcium-model-tracker-lists-v1';
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const elements = {
  machine: document.querySelector('#machine-filter'),
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
let columns = ['id', 'machines', 'tags'];
let selectedAvailableColumns = new Set();
let selectedActiveColumns = new Set();
let sort = { column: 'id', direction: 'asc' };
let draggedColumn = null;
let searchQuery = '';

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
    if (elements.machine.value !== 'all' && !model.machines.includes(elements.machine.value)) return false;
    const tags = new Set(model.tags);
    if (![...query.include].every((tag) => tags.has(tag))) return false;
    if ([...query.exclude].some((tag) => tags.has(tag))) return false;
    const searchable = model.id.toLowerCase();
    return query.text.every((term) => searchable.includes(term));
  }).sort((left, right) => {
    const a = valueFor(left, sort.column);
    const b = valueFor(right, sort.column);
    const comparison = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

function valueFor(model, column) {
  if (column === 'machines') return model.machines.join(', ');
  if (column === 'tags') return model.tags.join(', ');
  if (column === 'scope') return model.machines.length > 1 ? 'Shared' : 'Single machine';
  if (column === 'machineCount') return String(model.machines.length);
  return model.id;
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
  elements.filterChips.innerHTML = [
    ...[...filters.include].map((tag) => ({ type: 'include', tag, prefix: '#' })),
    ...[...filters.exclude].map((tag) => ({ type: 'exclude', tag, prefix: '!#' })),
  ].map(({ type, tag, prefix }) => `
    <span class="chip">${prefix}${escapeHtml(tag)}
      <button type="button" data-remove-filter="${type}:${escapeHtml(tag)}" aria-label="Remove ${prefix}${escapeHtml(tag)}">×</button>
    </span>
  `).join('');
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
  table.querySelector('tbody').innerHTML = rows.length ? rows.map((model) => `
    <tr>
      <td><input type="checkbox" data-${type}-model="${escapeHtml(model.id)}" ${selected.has(model.id) ? 'checked' : ''} aria-label="Select ${escapeHtml(model.id)}"></td>
      ${columnsInUse.map((column) => `<td>${escapeHtml(valueFor(model, column.id))}</td>`).join('')}
    </tr>
  `).join('') : `<tr><td colspan="${columnsInUse.length + 1}" class="empty-row">${type === 'catalog' ? 'No catalog models match these filters.' : 'No models in this list yet.'}</td></tr>`;
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

elements.machine.addEventListener('change', render);
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
  if (!checkbox) return;
  if (checkbox.checked) selectedCatalogModels.add(checkbox.dataset.catalogModel);
  else selectedCatalogModels.delete(checkbox.dataset.catalogModel);
  render();
});
elements.list.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-member-model]');
  if (!checkbox) return;
  if (checkbox.checked) selectedListMembers.add(checkbox.dataset.memberModel);
  else selectedListMembers.delete(checkbox.dataset.memberModel);
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
