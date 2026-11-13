# Arcium Test Site

The sign-in page is a styled entry point to the local Home workspace. Authentication is not connected.

## Status

- Home workspace at `/` with a protected Home workspace, dashboard portal, saved workspace selector, portal tabs, and recursively split panels.
- Sign-in page at `/signin.html`; submitting opens the Home workspace.
- Server: `node server.js` serves `public/` at http://localhost:3000
- `public/home.js` retains the earlier workspace prototype.

## How we build this

1. Describe a page (its purpose, sections, and what each control does).
2. We agree on the layout as a text wireframe in this file.
3. Each page gets a section below with:
   - **Route:** the URL path
   - **Purpose:** one line
   - **Layout:** text wireframe of blocks
   - **Functions:** each control and what it does
   - **Data:** what it reads or writes
4. Only then is the page built in `public/`.

## Pages

### Homepage
- **Route:** `/signin.html`
- **Purpose:** Branded entry point for signing in to an Arcium workspace.
- **Layout:**

  ```
  +-------------------------------+-------------------------+
  | Arcium mark                   | Welcome back            |
  | Clarity in every signal.      | Email address           |
  |                               | Password                |
  |                               | [ Sign in ]             |
  +-------------------------------+-------------------------+
  ```

- **Functions:**
- Sign-in form validates required email and password fields, then opens Home without sending or storing credentials.
- The layout adapts to narrow screens and uses a CSS-drawn brand mark.
- **Data:** No credentials are sent or stored; authentication is not implemented.

### Workspace
- **Route:** `/`
- **Purpose:** Select or create a named workspace, then arrange portals in nested panels.
- **Functions:**
  - Home is the default workspace after sign-in, is always named Home, and cannot be deleted. Its dashboard portal can be customized like other portal tabs and panels.
  - Other workspaces are listed in the top navigation dropdown and can be created, saved, selected, and deleted.
  - Portal control is in the top navigation beside the workspace selector. Canvas split-arrow controls have been removed.
  - New creates a workspace; Save explicitly saves it; changes are also saved automatically.
  - Workspaces and panel layouts persist in this browser using local storage. They are not synced to a server or shared across browsers.
  - Portal control opens docked on the left by default and stays below the sticky navigation while scrolling. Drag its heading to an edge to dock there, or to the center to open it as a floating modal. Docked panels collapse to an edge arrow and reopen from that arrow.
  - Click a portal in the control panel to add it as a tab in the selected panel. Drag a portal to the center of a panel to add it as a tab, or to an edge to snap it into a nested panel.
  - Add portal (+) adds a portal as a tab in a panel. Drag a portal to a panel edge to create a nested panel on that side.
  - Panels can contain multiple portal tabs and can themselves be split in any direction.
  - Close (×) removes a portal tab. Empty panels remain available for reuse.
  - The Datahub portal opens its dedicated page at `/datahub.html`.

### Datahub
- **Route:** `/datahub.html` (opened from the Datahub portal in a workspace)
- **Purpose:** Navigate recorder, source, and warehouse views.
- **Functions:**
  - The Home view links to Recorder, Sources, and Warehouse. List creation remains integrated in Recorder Controller's Source Bundle Maker.
  - Recorder, Sources, and Warehouse each switch between a Summary view and a Controller view.
  - Recorder and Warehouse summaries have nested drill tables. Warehouse is a recorded-inventory viewer with tag search, data format, and stored date ranges; Sources Summary is distinct and displays per-source request/key mappings into the site category/group system.
  - The Sources Controller has a constrained, local-only mapping-terminal mock that drafts and saves GET/key/category/group/format/tag mapping entries to the selected source's own map. It does not call an agent or provider.
  - Instrument trees include stock, commodity, currency, crypto, bond, real estate, ETF, ETN, and spread, followed by spot/future/option forms. Option data drills through underlying ticker, contract month, and strike to available frequencies and stored date ranges. Reference data drills into structured/unstructured, then financial statements, economic benchmarks, or text feeds.
  - Recorder Summary includes a master switch, select-all and row selection, and a multi-select recording frequency menu. Parent selections apply to descendants.
  - Recorder Controller opens on the Recorder Registry, with the Source Bundle Maker available as the other Controller tab. The Source Bundle Maker always shows the full selected source catalog. Loading a Registry list clears previous text/tag filters, shows it as a separate top-level tree alongside the catalog, and preselects its members in the normal tree. The Recording Creation Table stays empty until items are explicitly staged; its hierarchy has independent branch/member checkboxes, including mixed-state branches, and staged members can only be removed by checking them and choosing Remove checked. The new bundle name and save controls sit to the right of Remove checked. Instrument object/ticker rows reveal selectable recording-rate cards; saved items retain their individual rates, and Reference items do not receive invented rates.
  - Sources Controller provides demo API settings and mappings from response keys/searches to warehouse columns, formats, and tags.
  - Warehouse Summary supports `#` required-tag and `!#` excluded-tag searches with repeated mode switches, bracketed tag lists, and quoted text phrases. Rows include data format and chronologically ordered date ranges, with the newest range last.
- **Data:** Catalog entries, lists, source settings, and controller state are in-memory demo data. No provider requests, credential persistence, warehouse writes, or server persistence are configured.

### Portfolio Maker
- **Route:** `/portfolio-maker.html` (also available from the workspace Portal Control library)
- **Purpose:** Search the existing Instrument sample catalog and create/manage instrument portfolios.
- **Functions:** Uses the shared named-list workflow: search/filter the Instrument-only catalog, select catalog rows, add them to an editable creation table, load an existing watchlist by name, remove members from either table, and save changes by name. Source selector, portfolio-view selector, and instrument search share one toolbar row. **Undo view** restores the prior search/table state. Includes recursive parent-to-descendant checkbox selection, option ticker/month/strike levels with availability information, separate include/exclude tag dropdowns, a two-pane column manager, sortable/reorderable columns, and row selection.
- **Data:** Uses only Instrument examples already present in the Datahub sample catalog. No sample prices or pre-populated portfolios are invented; unavailable values display as `NaN`. Portfolio state is local to the page and not persisted.

The legacy instrument and model list managers use checkboxes and minus actions to remove selected members from their current lists.

### Model Tracker
- **Route:** `/model-tracker.html` (also available from the workspace Portal Control library)
- **Purpose:** Create and manage named lists of model objects from the combined Machine 01/02 sample catalogs.
- **Functions:** Uses the same two-table named-list workflow as Portfolio Maker, restricted to model objects: search model identifiers only, filter by machine and tags, configure/reorder/sort columns, select catalog models, add them to an editable creation table, load saved lists by name, remove members, merge another list, and save changes to browser local storage.
- **Data:** The combined catalog contains sample model objects only; lists are local to the browser.

### Previous workspace prototype
- **Top bar:** `guest` account menu and account links at the far top-left; workspace selector and Portal Control in the top navigation. Log out is at the bottom of the docked Portal Control panel.
- **Docking:** Portal Control docks by dropping it over transparent edge zones on the workspace. Portal panes show translucent edge zones for split placement and center zones for tabbing; there are no arrow position controls.
- **Page nav tabs:** Workspace (dropdown of workspaces), Machine (dropdown of machines), Watchlists, Engines.
- **Side panel (control panel, attached):** Silo Manager section lists the silos on the selected machine. Selecting a silo reveals its optimization panels and the machine's model catalog. Hangar section lists engines added to that machine. Selecting one shows its details. Portal tiles sit below.

#### Workspace view (default)
Homepage hero (logo, graphs, terminal image placeholders) above the workspace grid. Behaviour as described above.

#### Machine view
- Machine dropdown in the nav picks the machine. The view shows its specs and simulated realtime CPU and RAM usage (updates every second).
- Shows this account's silos and model catalog (draggable chips) and its hangar on that machine.
- Switching machines changes the silo manager, hangar, and model catalog.

#### Watchlists view
- Compact manager: symbol/name search, Check all, check individual rows.
- Lists panel: pick a list to edit, Add checked, Remove checked, Create list, Import another list, or Import pasted symbols (comma or line separated).

#### Engines view
- Portfolio selector (which instrument watchlist is the portfolio).
- NAV graph (placeholder).
- Portfolio table: one row per instrument. Drop a model on a row to assign it to that instrument, or anywhere in the portfolio box to assign it to every instrument. Assigned models show as removable chips.
- Toggle below the table switches the manager between Model watchlist (model lists, drag models from here) and Instrument watchlist.

_Other pages: describe the next one to add._

<!--
Template for each page:

### Page name
- **Route:**
- **Purpose:**
- **Layout:**

  ```
  +--------------------------------+
  | header                         |
  +--------------------------------+
  | section                        |
  +--------------------------------+
  ```

- **Functions:**
  - Control: what it does
- **Data:**
-->
