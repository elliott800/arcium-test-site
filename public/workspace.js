const PORTALS = [
  { id: 'dashboard', name: 'Home Control Panel', abbr: 'CP', description: 'Your workspace overview and quick access.' },
  { id: 'factory', name: 'Factory Portal', abbr: 'FA', description: 'Build, assign and run models.' },
  { id: 'fusion', name: 'Fusion Portal', abbr: 'FU', description: 'Combine signals and data streams.' },
  { id: 'arcade', name: 'Arcade Portal', abbr: 'AR', description: 'Run simulations and test strategies.' },
  { id: 'fund', name: 'Fund Portal', abbr: 'FD', description: 'Explore portfolios and equity.' },
  { id: 'datahub', name: 'Datahub', abbr: 'DH', description: 'Connect data sources and tables.' },
  { id: 'portfolio-maker', name: 'Portfolio Maker', abbr: 'PM', description: 'Build and manage instrument portfolios.' },
  { id: 'model-tracker', name: 'Model Tracker', abbr: 'MT', description: 'Build and manage named model lists.' },
  { id: 'brokerhub', name: 'Broker Hub', abbr: 'BH', description: 'Manage broker connections and orders.' },
  { id: 'seedhub', name: 'Seedhub', abbr: 'SH', description: 'Explore seed libraries and workbenches.' },
];

const STORAGE_KEY = 'arcium-workspaces-v1';
const SETTINGS_KEY = 'arcium-control-panel-v1';
const HOME_WORKSPACE_ID = 'workspace-home';
const workspaceSelect = document.querySelector('#workspace-select');
const workspaceCanvas = document.querySelector('#workspace-canvas');
const workspaceStatus = document.querySelector('#workspace-status');
const portalPicker = document.querySelector('#portal-picker');
const portalOptions = document.querySelector('#portal-options');
const pickerDescription = document.querySelector('#picker-description');
const dockedControl = document.querySelector('#docked-control');
const dockedPortals = document.querySelector('#docked-portals');
const workspaceDialog = document.querySelector('#workspace-dialog');

let nextId = 2;
let pickerMode = null;
let draggedPortal = null;
let draggingControlPanel = false;
let controlSettings = { mode: 'left', collapsed: false };
let workspaces = [newWorkspace('Home', HOME_WORKSPACE_ID, 'pane-home', 'dashboard')];
let activeWorkspaceId = HOME_WORKSPACE_ID;

function newWorkspace(name, id, paneId, portalId = null) {
  return {
    id,
    name,
    activePaneId: paneId,
    root: { type: 'pane', id: paneId, tabs: portalId ? [portalId] : [], activePortal: portalId },
  };
}

function currentWorkspace() {
  return workspaces.find((workspace) => workspace.id === activeWorkspaceId);
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

function portalFor(id) {
  return PORTALS.find((portal) => portal.id === id);
}

function reportStatus(message, isError = false) {
  workspaceStatus.textContent = message;
  workspaceStatus.classList.toggle('is-error', isError);
}

function restoreTree(node, paneIds) {
  if (!node || typeof node !== 'object') throw new Error('A saved panel is malformed.');
  if (node.type === 'pane') {
    if (typeof node.id !== 'string' || paneIds.has(node.id) || !Array.isArray(node.tabs)) {
      throw new Error('A saved panel has an invalid or duplicate ID.');
    }
    if (!node.tabs.every((portalId) => portalFor(portalId)) || new Set(node.tabs).size !== node.tabs.length) {
      throw new Error('A saved panel contains an unknown or duplicate portal tab.');
    }
    if (node.activePortal !== null && !node.tabs.includes(node.activePortal)) {
      throw new Error('A saved panel has an invalid active portal.');
    }
    paneIds.add(node.id);
    return { type: 'pane', id: node.id, tabs: [...node.tabs], activePortal: node.activePortal };
  }
  if (node.type !== 'split' || !['horizontal', 'vertical'].includes(node.axis)
    || !Array.isArray(node.children) || node.children.length !== 2) {
    throw new Error('A saved panel split is malformed.');
  }
  return {
    type: 'split',
    axis: node.axis,
    children: node.children.map((child) => restoreTree(child, paneIds)),
  };
}

function restoreWorkspaceList(value) {
  if (!Array.isArray(value) || value.length === 0) throw new Error('No saved workspaces were found.');
  const ids = new Set();
  const names = new Set();
  return value.map((workspace) => {
    if (!workspace || typeof workspace.id !== 'string' || typeof workspace.name !== 'string'
      || !workspace.name.trim() || ids.has(workspace.id)) {
      throw new Error('A saved workspace has an invalid or duplicate name or ID.');
    }
    const paneIds = new Set();
    const root = restoreTree(workspace.root, paneIds);
    if (!paneIds.has(workspace.activePaneId)) throw new Error('A saved workspace has no selected panel.');
    const normalizedName = workspace.name.trim().toLowerCase();
    if (names.has(normalizedName)) throw new Error('Saved workspace names must be unique.');
    ids.add(workspace.id);
    names.add(normalizedName);
    return {
      id: workspace.id,
      name: workspace.name.trim(),
      activePaneId: workspace.activePaneId,
      root,
    };
  });
}

function addHomeWorkspaceIfMissing() {
  const homeWorkspace = workspaces.find((workspace) => workspace.id === HOME_WORKSPACE_ID);
  if (homeWorkspace) {
    homeWorkspace.name = 'Home';
    return false;
  }

  const collidingWorkspace = workspaces.find((workspace) => workspace.name.toLowerCase() === 'home');
  if (collidingWorkspace) {
    let customName = 'Home (custom)';
    let suffix = 2;
    while (workspaces.some((workspace) => workspace !== collidingWorkspace
      && workspace.name.toLowerCase() === customName.toLowerCase())) {
      customName = `Home (custom ${suffix})`;
      suffix += 1;
    }
    collidingWorkspace.name = customName;
  }
  workspaces.unshift(newWorkspace('Home', HOME_WORKSPACE_ID, 'pane-home', 'dashboard'));
  return true;
}

function loadSavedState() {
  let stateNeedsSaving = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      workspaces = restoreWorkspaceList(state.workspaces);
      const addedHomeWorkspace = addHomeWorkspaceIfMissing();
      activeWorkspaceId = workspaces.some((workspace) => workspace.id === state.activeWorkspaceId)
        ? state.activeWorkspaceId
        : workspaces[0].id;
      nextId = Math.max(2, Number(state.nextId) || 2);
      stateNeedsSaving = addedHomeWorkspace;
    } else {
      workspaces = [newWorkspace('Home', HOME_WORKSPACE_ID, 'pane-home', 'dashboard')];
      activeWorkspaceId = HOME_WORKSPACE_ID;
    }
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      const savedSettings = JSON.parse(settings);
      if (['floating', 'left', 'right', 'top', 'bottom'].includes(savedSettings.mode)) {
        controlSettings.mode = savedSettings.mode;
        controlSettings.collapsed = Boolean(savedSettings.collapsed);
      }
    }
  } catch (error) {
    workspaces = [newWorkspace('Home', HOME_WORKSPACE_ID, 'pane-home', 'dashboard')];
    activeWorkspaceId = HOME_WORKSPACE_ID;
    reportStatus(`Could not load saved workspaces: ${error.message}`, true);
    return true;
  }

  if (new URLSearchParams(window.location.search).has('login')) {
    activeWorkspaceId = HOME_WORKSPACE_ID;
    stateNeedsSaving = true;
    window.history.replaceState({}, '', '/');
  }
  return stateNeedsSaving;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workspaces,
      activeWorkspaceId,
      nextId,
    }));
    reportStatus('Saved in this browser.');
    return true;
  } catch (error) {
    reportStatus(`Could not save workspaces: ${error.message}`, true);
    return false;
  }
}

function saveControlSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(controlSettings));
  } catch (error) {
    reportStatus(`Could not save control panel settings: ${error.message}`, true);
  }
}

function paneById(id, node = currentWorkspace().root) {
  if (node.type === 'pane') return node.id === id ? node : null;
  for (const child of node.children) {
    const pane = paneById(id, child);
    if (pane) return pane;
  }
  return null;
}

function findLocation(node, paneId, parent = null, index = -1) {
  if (node.type === 'pane') return node.id === paneId ? { node, parent, index } : null;
  for (let childIndex = 0; childIndex < node.children.length; childIndex += 1) {
    const result = findLocation(node.children[childIndex], paneId, node, childIndex);
    if (result) return result;
  }
  return null;
}

function renderWorkspaceSelect() {
  workspaceSelect.innerHTML = workspaces.map((workspace) => `
    <option value="${escapeHtml(workspace.id)}">${escapeHtml(workspace.name)}</option>
  `).join('');
  workspaceSelect.value = activeWorkspaceId;
  document.querySelector('#delete-workspace').disabled = activeWorkspaceId === HOME_WORKSPACE_ID;
  document.querySelector('#workspace-title').textContent = currentWorkspace().name;
}

function renderPortalCards(host, className) {
  host.innerHTML = PORTALS.map((portal) => `
    <button class="${className}" type="button" draggable="true"
      data-add-portal="${portal.id}" aria-label="Add ${escapeHtml(portal.name)}">
      <span class="portal-glyph" aria-hidden="true">${portal.abbr}</span>
      <span><strong>${escapeHtml(portal.name)}</strong><small>${escapeHtml(portal.description)}</small></span>
    </button>
  `).join('');
}

function renderPane(pane) {
  const activePortal = portalFor(pane.activePortal);
  const tabs = pane.tabs.map((portalId) => {
    const portal = portalFor(portalId);
    if (!portal) return '';
    return `
      <span class="portal-tab-wrap">
        <button class="portal-tab" type="button" role="tab" draggable="true"
          aria-selected="${portalId === pane.activePortal}"
          data-pane-id="${pane.id}" data-portal-id="${portal.id}"
          title="Drag this tab to another panel to dock it">
          <span class="portal-mini">${portal.abbr}</span>
          <span>${escapeHtml(portal.name)}</span>
        </button>
        <button class="tab-close" type="button" aria-label="Close ${escapeHtml(portal.name)} tab"
          data-close-pane="${pane.id}" data-close-portal="${portal.id}">×</button>
      </span>
    `;
  }).join('');

  const content = activePortal?.id === 'dashboard' ? `
    <div class="dashboard-panel">
      <p class="eyebrow">ARCIUM WORKSPACE</p>
      <h2>Welcome to ${escapeHtml(currentWorkspace().name)}</h2>
      <p>Your control center for research, systems, and decisions.</p>
      <div class="dashboard-links" aria-label="Open a portal">
        ${PORTALS.filter((portal) => portal.id !== 'dashboard').map((portal) => `
          <button type="button" class="dashboard-link" data-dashboard-portal="${portal.id}">
            <span class="portal-glyph" aria-hidden="true">${portal.abbr}</span>
            <span><strong>${escapeHtml(portal.name)}</strong><small>${escapeHtml(portal.description)}</small></span>
            <span class="dashboard-arrow" aria-hidden="true">↗</span>
          </button>
        `).join('')}
      </div>
    </div>
  ` : activePortal?.id === 'datahub' ? `
    <div class="portal-glyph" aria-hidden="true">${activePortal.abbr}</div>
    <h2>${escapeHtml(activePortal.name)}</h2>
    <p>${escapeHtml(activePortal.description)}</p>
    <a class="portal-open-link" href="/datahub.html">Open Datahub</a>
  ` : activePortal?.id === 'portfolio-maker' ? `
    <div class="portal-glyph" aria-hidden="true">${activePortal.abbr}</div>
    <h2>${escapeHtml(activePortal.name)}</h2>
    <p>${escapeHtml(activePortal.description)}</p>
    <a class="portal-open-link" href="/portfolio-maker.html">Open Portfolio Maker</a>
  ` : activePortal ? `
    <div class="portal-glyph" aria-hidden="true">${activePortal.abbr}</div>
    <h2>${escapeHtml(activePortal.name)}</h2>
    <p>${escapeHtml(activePortal.description)}</p>
  ` : `
    <div class="portal-glyph" aria-hidden="true">+</div>
    <h2>Empty panel</h2>
    <p>Add a portal here, or drag one of its tabs into this panel.</p>
    <button class="empty-add" type="button" data-add-pane="${pane.id}">Add a portal</button>
  `;

  return `
    <section class="portal-pane ${pane.id === currentWorkspace().activePaneId ? 'is-active' : ''}"
      data-pane-id="${pane.id}" aria-label="${activePortal ? escapeHtml(activePortal.name) : 'Empty portal panel'}">
      <div class="pane-tabs">
        <div class="portal-tabs" role="tablist">${tabs}</div>
        <button class="pane-add" type="button" data-add-pane="${pane.id}"
          aria-label="Add portal tab to this panel" title="Add portal tab">+</button>
      </div>
      <div class="pane-body ${activePortal ? '' : 'empty-pane'}">${content}</div>
      <div class="drop-zones" aria-hidden="true">
        <span class="drop-zone drop-zone-left">Left</span>
        <span class="drop-zone drop-zone-right">Right</span>
        <span class="drop-zone drop-zone-top">Top</span>
        <span class="drop-zone drop-zone-bottom">Bottom</span>
        <span class="drop-zone drop-zone-center">Add as tab</span>
      </div>
    </section>
  `;
}

function renderTree(node) {
  if (node.type === 'pane') return renderPane(node);
  const direction = node.axis === 'horizontal' ? 'horizontal' : 'vertical';
  return `
    <div class="split-group split-${direction}" role="group">
      ${node.children.map((child) => `<div class="split-child">${renderTree(child)}</div>`).join('')}
    </div>
  `;
}

function renderControlPanel() {
  const floating = controlSettings.mode === 'floating';
  document.body.dataset.controlMode = controlSettings.mode;
  document.body.classList.toggle('control-collapsed', controlSettings.collapsed);
  dockedControl.hidden = floating;
  document.querySelector('#portal-control-toggle').setAttribute('aria-expanded',
    String(!floating && !controlSettings.collapsed));
  renderPortalCards(dockedPortals, 'portal-option');
}

function render() {
  renderWorkspaceSelect();
  renderControlPanel();
  workspaceCanvas.innerHTML = `${renderTree(currentWorkspace().root)}
    <div class="canvas-dock-zones" aria-hidden="true">
      <span class="canvas-dock-zone canvas-dock-left">Left sidebar</span>
      <span class="canvas-dock-zone canvas-dock-right">Right sidebar</span>
      <span class="canvas-dock-zone canvas-dock-top">Top bar</span>
      <span class="canvas-dock-zone canvas-dock-bottom">Bottom bar</span>
      <span class="canvas-dock-zone canvas-dock-center">Drop to open library</span>
    </div>`;
}

function finishChange(message = 'Saved in this browser.') {
  render();
  const saved = saveState();
  if (saved && message !== 'Saved in this browser.') reportStatus(message);
}

function openPicker(mode) {
  pickerMode = mode;
  pickerDescription.textContent = mode.type === 'tab'
    ? 'Choose a portal to add as a tab in this panel.'
    : mode.type === 'library'
      ? 'Choose a portal to add as a tab in the selected panel.'
      : `Choose a portal to snap ${mode.direction} of the selected panel.`;
  renderPortalCards(portalOptions, 'portal-option');
  portalPicker.showModal();
  document.querySelector('#portal-control-toggle').setAttribute('aria-expanded', 'true');
}

function closePicker() {
  if (portalPicker.open) portalPicker.close();
  pickerMode = null;
  document.querySelector('#portal-control-toggle').setAttribute('aria-expanded', 'false');
}

function createPane(portalId = null) {
  return {
    type: 'pane',
    id: `pane-${nextId++}`,
    tabs: portalId ? [portalId] : [],
    activePortal: portalId,
  };
}

function splitPane(targetId, direction, portalId) {
  const workspace = currentWorkspace();
  const location = findLocation(workspace.root, targetId);
  if (!location) return;

  const newPane = createPane(portalId);
  const axis = direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical';
  const children = direction === 'left' || direction === 'top'
    ? [newPane, location.node]
    : [location.node, newPane];
  const split = { type: 'split', axis, children };
  if (location.parent) location.parent.children[location.index] = split;
  else workspace.root = split;
  workspace.activePaneId = newPane.id;
  finishChange();
}

function addPortalTab(targetId, portalId) {
  const workspace = currentWorkspace();
  const pane = paneById(targetId);
  if (!pane) return;
  if (!pane.tabs.includes(portalId)) pane.tabs.push(portalId);
  pane.activePortal = portalId;
  workspace.activePaneId = pane.id;
  finishChange();
}

function removePortalTab(pane, portalId) {
  const index = pane.tabs.indexOf(portalId);
  if (index < 0) return;
  pane.tabs.splice(index, 1);
  if (pane.activePortal === portalId) {
    pane.activePortal = pane.tabs[Math.min(index, pane.tabs.length - 1)] || null;
  }
}

function choosePortal(portalId) {
  if (!pickerMode) return;
  if (pickerMode.type === 'tab') addPortalTab(pickerMode.paneId, portalId);
  else if (pickerMode.type === 'library') addPortalFromControl(portalId);
  else splitPane(pickerMode.paneId, pickerMode.direction, portalId);
  closePicker();
}

function addWorkspace(name) {
  const workspace = newWorkspace(name, `workspace-${nextId++}`, `pane-${nextId++}`);
  workspaces.push(workspace);
  activeWorkspaceId = workspace.id;
  finishChange(`Created "${workspace.name}".`);
}

function addPortalFromControl(portalId) {
  const pane = paneById(currentWorkspace().activePaneId);
  if (pane) addPortalTab(pane.id, portalId);
}

function dockPortal(portalId, sourcePaneId, targetPaneId, direction) {
  const target = paneById(targetPaneId);
  if (!target || !portalFor(portalId)) return;
  if (sourcePaneId) {
    const source = paneById(sourcePaneId);
    if (!source || source === target || !source.tabs.includes(portalId)) return;
    removePortalTab(source, portalId);
  }
  if (direction === 'center') addPortalTab(target.id, portalId);
  else splitPane(target.id, direction, portalId);
}

function dropDirection(event, paneElement) {
  const bounds = paneElement.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  const distances = [
    { direction: 'left', distance: x },
    { direction: 'right', distance: 1 - x },
    { direction: 'top', distance: y },
    { direction: 'bottom', distance: 1 - y },
  ];
  const nearest = distances.reduce((best, item) => item.distance < best.distance ? item : best);
  return nearest.distance <= 0.24 ? nearest.direction : 'center';
}

function setControlMode(mode) {
  controlSettings.mode = mode;
  controlSettings.collapsed = false;
  saveControlSettings();
  renderControlPanel();
  if (mode !== 'floating') closePicker();
}

function controlModeAtPoint(x, y) {
  const edgeSize = 110;
  const edges = [
    { mode: 'left', distance: x },
    { mode: 'right', distance: window.innerWidth - x },
    { mode: 'top', distance: y },
    { mode: 'bottom', distance: window.innerHeight - y },
  ];
  const nearest = edges.reduce((best, edge) => edge.distance < best.distance ? edge : best);
  return nearest.distance <= edgeSize ? nearest.mode : 'floating';
}

function controlDockZoneAtPoint(event) {
  const bounds = workspaceCanvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  if (x <= 0.24) return 'left';
  if (x >= 0.76) return 'right';
  if (y <= 0.24) return 'top';
  if (y >= 0.76) return 'bottom';
  return 'center';
}

function startControlPanelDrag(event) {
  if (event.target.closest('button')) {
    event.preventDefault();
    return;
  }
  draggingControlPanel = true;
  document.body.classList.add('is-control-panel-dragging');
  workspaceCanvas.dataset.controlDropSide = 'center';
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', 'arcium-control-panel');
}

function handleControlPanelCanvasDragOver(event) {
  if (!draggingControlPanel) return;
  event.preventDefault();
  workspaceCanvas.dataset.controlDropSide = controlDockZoneAtPoint(event);
  event.dataTransfer.dropEffect = 'move';
}

function finishControlPanelCanvasDrop(event) {
  if (!draggingControlPanel) return;
  event.preventDefault();
  event.stopPropagation();
  const mode = workspaceCanvas.dataset.controlDropSide || controlDockZoneAtPoint(event);
  draggingControlPanel = false;
  document.body.classList.remove('is-control-panel-dragging');
  delete workspaceCanvas.dataset.controlDropSide;
  setControlMode(mode === 'center' ? 'floating' : mode);
  if (mode === 'center') openPicker({ type: 'library' });
}

function finishControlPanelDrop(event) {
  if (!draggingControlPanel) return;
  event.preventDefault();
  draggingControlPanel = false;
  document.body.classList.remove('is-control-panel-dragging');
  delete workspaceCanvas.dataset.controlDropSide;
  const mode = controlModeAtPoint(event.clientX, event.clientY);
  setControlMode(mode);
  if (mode === 'floating') openPicker({ type: 'library' });
}

document.querySelector('#save-workspace').addEventListener('click', () => {
  if (saveState()) reportStatus(`"${currentWorkspace().name}" saved in this browser.`);
});

document.querySelector('#add-workspace').addEventListener('click', () => {
  document.querySelector('#workspace-name').value = '';
  workspaceDialog.showModal();
  document.querySelector('#workspace-name').focus();
});

document.querySelector('#workspace-dialog-close').addEventListener('click', () => workspaceDialog.close());
document.querySelector('#workspace-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#workspace-name');
  const name = input.value.trim();
  if (!name) {
    input.setCustomValidity('Enter a workspace name.');
    input.reportValidity();
    return;
  }
  if (workspaces.some((workspace) => workspace.name.toLowerCase() === name.toLowerCase())) {
    input.setCustomValidity('A workspace with this name already exists.');
    input.reportValidity();
    return;
  }
  input.setCustomValidity('');
  workspaceDialog.close();
  addWorkspace(name);
});
document.querySelector('#workspace-name').addEventListener('input', (event) => {
  event.currentTarget.setCustomValidity('');
});

document.querySelector('#delete-workspace').addEventListener('click', () => {
  if (activeWorkspaceId === HOME_WORKSPACE_ID) return;
  const name = currentWorkspace().name;
  if (!window.confirm(`Delete "${name}" from this browser?`)) return;
  workspaces = workspaces.filter((workspace) => workspace.id !== activeWorkspaceId);
  activeWorkspaceId = HOME_WORKSPACE_ID;
  finishChange(`Deleted "${name}".`);
});

workspaceSelect.addEventListener('change', () => {
  activeWorkspaceId = workspaceSelect.value;
  render();
  if (saveState()) reportStatus(`Loaded "${currentWorkspace().name}".`);
});

document.querySelector('#docked-control .control-panel-heading')
  .addEventListener('dragstart', startControlPanelDrag);
document.querySelector('#picker-head')?.addEventListener('dragstart', startControlPanelDrag);
document.body.addEventListener('dragover', (event) => {
  if (draggingControlPanel) event.preventDefault();
});
document.body.addEventListener('drop', finishControlPanelDrop);
document.body.addEventListener('dragend', () => {
  draggingControlPanel = false;
  document.body.classList.remove('is-control-panel-dragging');
  delete workspaceCanvas.dataset.controlDropSide;
});

document.querySelector('#portal-control-toggle').addEventListener('click', () => {
  if (controlSettings.mode === 'floating') {
    if (portalPicker.open) closePicker();
    else openPicker({ type: 'library' });
    return;
  }
  controlSettings.collapsed = !controlSettings.collapsed;
  saveControlSettings();
  renderControlPanel();
});

document.querySelectorAll('[data-account-option]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('#account-status').textContent =
      `${button.dataset.accountOption} is not connected in this local demo.`;
    button.closest('details').open = false;
  });
});

document.querySelector('#dock-collapse').addEventListener('click', () => {
  controlSettings.collapsed = true;
  saveControlSettings();
  renderControlPanel();
});

document.querySelector('#picker-close').addEventListener('click', closePicker);
portalPicker.addEventListener('close', () => {
  pickerMode = null;
  document.querySelector('#portal-control-toggle').setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('[data-dock]').forEach((button) => {
  button.addEventListener('click', () => {
    openPicker({
      type: 'split',
      paneId: currentWorkspace().activePaneId,
      direction: button.dataset.dock,
    });
  });
});

portalOptions.addEventListener('click', (event) => {
  const option = event.target.closest('[data-add-portal]');
  if (option) choosePortal(option.dataset.addPortal);
});
portalOptions.addEventListener('dragstart', startPortalDrag);
portalOptions.addEventListener('dragend', handleDragEnd);

function startPortalDrag(event) {
  const card = event.target.closest('[data-add-portal]');
  const tab = event.target.closest('.portal-tab');
  if (card) {
    draggedPortal = { portalId: card.dataset.addPortal, paneId: null };
  } else if (tab) {
    draggedPortal = { portalId: tab.dataset.portalId, paneId: tab.dataset.paneId };
  } else {
    return;
  }
  event.dataTransfer.effectAllowed = 'copyMove';
  event.dataTransfer.setData('text/plain', draggedPortal.portalId);
}

function handlePaneDragOver(event) {
  const paneElement = event.target.closest('.portal-pane');
  if (!paneElement || !draggedPortal) return;
  if (draggedPortal.paneId !== paneElement.dataset.paneId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = draggedPortal.paneId ? 'move' : 'copy';
    paneElement.dataset.dropSide = dropDirection(event, paneElement);
  }
}

function handlePaneDrop(event) {
  const paneElement = event.target.closest('.portal-pane');
  if (!paneElement || !draggedPortal) return;
  event.preventDefault();
  const direction = paneElement.dataset.dropSide;
  delete paneElement.dataset.dropSide;
  if (direction) {
    dockPortal(
      draggedPortal.portalId,
      draggedPortal.paneId,
      paneElement.dataset.paneId,
      direction,
    );
  }
}

function handleDragEnd() {
  draggedPortal = null;
  workspaceCanvas.querySelectorAll('[data-drop-side]').forEach((pane) => delete pane.dataset.dropSide);
}

dockedPortals.addEventListener('click', (event) => {
  const card = event.target.closest('[data-add-portal]');
  if (card) addPortalFromControl(card.dataset.addPortal);
});

dockedPortals.addEventListener('dragstart', startPortalDrag);
document.body.addEventListener('dragover', (event) => {
  if (!draggedPortal) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = draggedPortal.paneId ? 'move' : 'copy';
});
dockedPortals.addEventListener('dragend', handleDragEnd);

workspaceCanvas.addEventListener('click', (event) => {
  const dashboardPortal = event.target.closest('[data-dashboard-portal]');
  if (dashboardPortal) {
    addPortalTab(
      dashboardPortal.closest('.portal-pane').dataset.paneId,
      dashboardPortal.dataset.dashboardPortal,
    );
    return;
  }

  const closeButton = event.target.closest('[data-close-pane]');
  if (closeButton) {
    removePortalTab(paneById(closeButton.dataset.closePane), closeButton.dataset.closePortal);
    finishChange();
    return;
  }

  const addButton = event.target.closest('[data-add-pane]');
  if (addButton) {
    openPicker({ type: 'tab', paneId: addButton.dataset.addPane });
    return;
  }

  const tab = event.target.closest('.portal-tab');
  if (tab) {
    const pane = paneById(tab.dataset.paneId);
    pane.activePortal = tab.dataset.portalId;
    currentWorkspace().activePaneId = pane.id;
    finishChange();
    return;
  }

  const paneElement = event.target.closest('.portal-pane');
  if (paneElement) {
    currentWorkspace().activePaneId = paneElement.dataset.paneId;
    finishChange();
  }
});

workspaceCanvas.addEventListener('dragstart', startPortalDrag);
workspaceCanvas.addEventListener('dragover', handleControlPanelCanvasDragOver);
workspaceCanvas.addEventListener('dragover', handlePaneDragOver);
workspaceCanvas.addEventListener('dragleave', (event) => {
  const paneElement = event.target.closest('.portal-pane');
  if (paneElement && !paneElement.contains(event.relatedTarget)) delete paneElement.dataset.dropSide;
});
workspaceCanvas.addEventListener('drop', finishControlPanelCanvasDrop);
workspaceCanvas.addEventListener('drop', handlePaneDrop);
workspaceCanvas.addEventListener('dragend', handleDragEnd);

const stateNeedsSaving = loadSavedState();
renderPortalCards(portalOptions, 'portal-option');
render();
if (stateNeedsSaving) saveState();
