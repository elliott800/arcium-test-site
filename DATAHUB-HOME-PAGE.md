# Datahub Home Page — Requirements and Preview Behavior

The Datahub preview is available at `/datahub.html`. This document captures the requested product behavior and distinguishes it from the current local demonstration. Provider connections, secure credential storage, agent-terminal integration, and warehouse persistence are not implemented.

## Datahub navigation and landing page

- The Datahub Home page is the entry point and provides choices for Recorder, Sources, and Warehouse.
- The Datahub navigation changes the main display to the selected area.
- Recorder, Sources, and Warehouse each provide a Summary and Controller view, with a way to switch between them.
- Selecting Recorder opens its Summary/Controller experience; selecting Sources opens its own Summary/Controller experience; selecting Warehouse opens its own Summary/Controller experience. These are section-specific displays, not one shared controller view.
- The Home cards and the navigation entries provide routes to the same section views.

## Summary drill tables

Recorder Summary, Sources Summary, and Warehouse Summary use expandable tables. A row can be opened to reveal its child rows beneath it; each child can in turn be opened to reveal its own contents.

- Provide a category selector for **Instrument** or **Reference**.
- Provide a source selector, including **All** where applicable. Source choices and the available drill tree depend on category and selected source.
- Example Instrument sources are Yahoo and Webull; example Reference sources are FRED and EDGAR. Yahoo provides both Instrument and Reference data.
- Warehouse additionally offers **All data** so Instrument and Reference inventory can be viewed together.
- The table should identify source and data format, as well as the item/content represented by each row.
- Changing source changes the available tree/results to reflect that source; changing category limits sources and drill items accordingly.

### Instrument drill-down tree

Instrument categories include:

- Stock
- Commodity
- Currency
- Crypto
- Bond
- Real estate
- ETF
- ETN
- Spread

Within an instrument type, provide the instrument form choices **Spot**, **Future**, and **Option** before listing the relevant instruments.

For option data, the requested drill sequence is:

1. Instrument type and Option form.
2. Underlying ticker list.
3. Contract month.
4. Strike.
5. At the bottom, show the available recording frequencies and stored date ranges for that strike.

Each level only exposes the children relevant to the selected source and option record.

### Reference-data drill-down tree

Reference data first branches into **Structured** or **Unstructured**, then into the relevant data group:

- Financial statements
- Economic benchmarks
- Text feeds

The available entries under these groups vary by source.

## Recorder source lists

### Recorder Summary controls

- Place Recorder Summary category/source filters inside the Recording Controls panel, before the recording actions. Keep the current-view summary after the controls and the drill table last.
- Label the group with everyday actions: start/pause master recording, select all items in the current view, and choose one or more recording frequencies. Make the current recording state and selected frequency count visible.
- Present summary metrics as context for the selected category/source, including top-level groups, items in view, and available sources.
- Provide a master recording on/off switch for all items in the table.
- Provide a select-all control and per-row selection controls.
- Selecting or deselecting a parent applies the selection to its descendant items.
- Changing an item checkbox while a drill row is open must preserve the open drill row.
- Show alternating, progressively lighter row shades by drill depth. Rainbow drill colors is enabled by default; its checkbox colors drill rows and table columns while keeping text readable. The standard table mode keeps its top-level rows light.
- Provide a recording-frequency dropdown that supports selecting multiple frequencies. The master recording setting applies across the table; when a parent or master setting is applied, sub-items inherit it unless changed through the appropriate item controls.
- Show a Rates cell on Recorder drill rows. Opening it presents a modal with only the rates allowed for that source/item, plus a summary of selected instruments and captured rates.
- Show the format/structure being recorded alongside the item.
- Put the Current view summary above Recording Controls and its master controls. Place Select all items in this view at the far left of the controls row.

### Recorder Controller and source lists

- Recorder Controller opens on the **Recorder Registry** by default. Keep the **Source Bundle Maker** available as the other Controller tab for creating named, source-specific bundles without navigating away. Source bundles will also be used to train models.
- The Recorder Controller needs a visible list-search field above its search table to search the selected recording source's catalog by item names, tickers, and tags. The source category (Instrument or Reference) determines the searchable catalog. The **Recording Creation Table** uses the shared `creation-table` class and drills through the same category/group/item hierarchy.
- In the Source Bundle Maker, keep the bundle/category/source selectors, list search, and filter/column buttons aligned in one row when space allows. The searchable table always shows the full selected source catalog; loading a bundle adds it as a separate top-level tree and preselects its members in the normal catalog. Preserve each major descriptor as a drill layer, then include the selected source as its own layer before each Instrument or Reference object name. Both the searchable catalog and Recording Creation Table have independent selectable checkboxes at every hierarchy level; selecting a branch selects its visible descendants, and partially selected branches show a mixed state.
- Recorder list building is a two-step workflow: load or create a named source bundle, select catalog rows in the searchable drill table, add or remove members, review the staged members in the drillable Recording Creation Table, then save or update the named bundle. Staged members can only be removed by checking their creation-table boxes and choosing Remove checked; the new-bundle name field and Save source bundle button sit to its right. Loading a Registry list clears previous text/tag filters, selects its members in the full searchable source catalog, and leaves the creation table empty until the user adds selected items; saving updates the Registry without a separate commit step.
- Instrument object/ticker rows expand to selectable recording-rate cards using the catalog's allowed rates. Rate choices are saved per item and summarized at bundle level; Reference objects do not receive invented recording rates.
- Recorder Controller includes a Registry view with source-first and list-first drill-tree views. The source-first tree starts with each source, then saved lists; the list-first tree starts with saved list titles. Both continue through each list's Instrument or Reference category and the same catalog hierarchy as Warehouse Summary (including instrument type/form or reference structure/group and available sample rates/date ranges), restricted to the list's saved items. Its list selector defaults to None and can display a premade list's source, rates, and items.
- Recording lists are distinct from portfolios, but their list-making and management experience should use the same Portfolio Maker operating pattern: searchable/filterable catalog table, row selection, select-all, columns, sorting, reusable list membership actions, and a manager for named lists.
- Apply this same Portfolio Maker-style operating pattern to the other list makers in the site so list creation and membership management work consistently. Adapt source/category and list-specific actions to each context rather than creating a different interaction model for each list type.
- Portfolio Watchlist and Model Tracker both use paired catalog and creation tables with selectable members, add/remove actions, named-list loading and merging, configurable columns, sorting, and column reordering. The Portfolio catalog contains Instruments only; Model Tracker contains model objects only.
- For recording lists, the source category is selectable between Instrument and Reference (unlike the Portfolio Maker, which is fixed to Instrument), and the source selector is constrained to the chosen category. Lists created here are recording lists, not portfolios.
- Each source bundle has a name, category, source, and editable member items. The Recorder Controller does not provide a separate batch manager, merge/unmerge actions, or commit/pause controls.
- Source bundles are source-specific. For example, a Nasdaq 100 bundle sourced from Yahoo could be named “Yahoo Nasdaq 100” and retain Yahoo as its source.

## Portfolio Maker widget and instrument list viewer

The Portfolio Maker is a separate page/widget (and implementation file), available as a widget in the workspace Portal Control library. It provides a searchable instrument viewer and tools to create portfolios or add/remove selected instruments from multiple portfolios.

### Source and category

- Provide a source selector for the data provider.
- Include **All** as a source choice, alongside the individual provider choices.
- Portfolio lists are always Instrument category; the category is fixed to Instrument and not user-changeable in this view.
- Other list-building contexts, such as recording lists, allow choosing Instrument or Reference category.
- Search results are determined by the selected source and category.
- Do not use separate Stocks/Options/Futures tabs. Show an expandable drill table based on the selected source's asset-map keys, with asset types such as Stock or Commodity as parent rows, forms such as Spot, Option, or Future beneath them, and matching instruments beneath each form. Stock options remain under the Stock asset-map row; futures remain under their mapped asset type.
- Use a right-pointing arrow for drill-down controls and rotate it to indicate an expanded row; do not use plus/minus expansion icons.

### Search and filters

- The search bar supports include-tag and exclude-tag search (`#` / `!#`), including comma- or space-separated terms. Operators can switch repeatedly in one query, such as `# stock option !# future # technology`.
- Exact text phrases go in quotes, such as `"Apple Inc."`; tags do not use bracket-list syntax.
- Provide an **Add filter** button that opens a modal.
- The modal has two independent tag textboxes/dropdowns: one for included `#` tags and one for excluded `!#` tags. Each accepts typed tags and offers catalog tag suggestions.
- Each tag dropdown shows the tags currently applied to that filter. Every listed tag has a minus control that removes it from the filter.
- Include a **Columns** button that opens a two-pane column manager for fields available across the asset-map-driven table.
- The Available Columns pane has per-column checkboxes, a Select all checkbox, and a plus action to add selected columns to the display.
- The Active Display Columns pane has per-column checkboxes, a Select all checkbox beside a minus action to remove selected columns from the display, and minimum/maximum controls for active numeric columns.
- Available columns depend on instrument class/form (for example, expiration and strike apply to options, while other forms may not have those values).
- Once a column is added, display it in the instrument viewer when the field applies to that instrument type.
- For an instrument where a selected column does not apply or has no value, display `NaN`.
- Column value filters have minimum and maximum bounds. `NaN` entries must remain visible when applying numeric column filters; do not remove them just because they cannot be compared to the numeric bounds.
- Columns can be dragged to change their display order.
- Clicking the sort arrow next to a column heading sorts that column ascending or descending.

### Selection and portfolio membership

- Place the portfolio-view selector directly above the instrument table, on the same row as Select all and the plus/minus actions. Its choices are **New** and the actual existing portfolio names; New shows the catalog for building a portfolio, while choosing a portfolio shows its members.
- Provide a **Select all** control for the current result/view and a checkbox on each instrument row.
- Place plus and minus action buttons beside Select all in a compact, single-line action area.
- The plus button stages the selected catalog instruments in the Portfolio List Builder; staged items can be selected with checkboxes and removed with a minus action, or removed individually, before saving as a named portfolio.
- The minus button opens a separate Remove menu with checkboxes for one or more existing portfolios and a **Remove** button. Remove only affects selected instruments that are already members of the checked portfolios; when there is no matching membership, it does nothing. It never creates a portfolio.
- Portfolio membership changes should apply to the currently selected instruments, without changing the source catalog or recording lists.
- Portfolio creation/editing uses a two-step builder workflow: select rows in the catalog search table, add them to the Portfolio List Builder, review/remove staged items, enter a portfolio name, and save. Selecting an existing portfolio loads its members into the builder for editing; selecting **New** starts a fresh builder list. To add catalog items to an existing portfolio, stage them while viewing **New**, then select the destination portfolio; its current members and staged items are combined in the builder before saving. The saved portfolio can be selected in the view selector to inspect its members.
- Place **Select all** immediately above the table. Provide an **Undo view** action beside the portfolio membership controls to restore the previous search/table view.
- Nested checkbox selection flows downward through every drill level: selecting a parent selects all descendants, while selecting a child does not select its ancestors.
- For options, expand Stock → Option → underlying ticker → contract month → strike. Expand the strike to reveal its available frequencies and stored date ranges.
- Provide the same Rainbow drill colors mode for the Portfolio Maker table, enabled by default: distinct dark colors for top-level rows, same-hue lighter descendants, and related lighter column shades. Shift descendants toward yellow only when additional lightness is needed. The standard table mode keeps top-level rows light.

### Shared list-maker interaction pattern

Portfolio Maker establishes the common interaction model for list makers elsewhere in the site:

- Search and filters act on a browsable catalog table.
- Rows are selectable individually or with Select all.
- Users manage named lists by adding/removing selected rows, including applying a selection to multiple lists where supported.
- Columns can be selected, filtered, reordered, and sorted as appropriate to the catalog.
- Each list-maker keeps its own domain rules and actions: Portfolio Maker manages Instrument portfolios; Recorder list-making supports Instrument or Reference categories and source-specific lists.
- Portfolio Maker, Model Tracker, and Source Bundle Maker use the same named-list workflow: search a domain-specific catalog, add selected items to an editable creation table, load an existing list by name, remove members from either table, and save changes. Portfolio Watchlists are Instrument-only; Model Tracker lists are model-object-only; Source Bundles may contain Instrument or Reference items from a selected source and will also be used to train models.

## Sources and mappings

- Sources is where source APIs/providers are added and configured.
- Source Summary and Warehouse Summary are different views with different jobs. Source Summary describes/configures what each provider can return and how requests are formed; Warehouse Summary describes only data that has already been recorded and its stored ranges.
- Source Summary manages the provider-specific key system, query/request definitions, and the mapping that turns provider results into the site's Instrument/Reference categories and drill groups.
- Each source owns its own mapping configuration: provider keys/searches, request/query patterns, resulting category/group/form, warehouse destination column, data format, and tags. A source's mapping is not a single global mapping shared by all providers.
- The Source Controller lists available source endpoints in a scrollable access table with separate Recorder and Warehouse controls. Each channel's master switch applies to all listed sources; individual source controls remain adjustable, including a control to enable or disable both channels for one source.
- API Tools and provider credentials belong in the account area, not the Source Controller. The Source Controller retains a constrained source-map terminal for configuring source categories, request definitions, mappings, and tags. The terminal must not send provider requests or expose API credentials without an intentional secure integration.
- Source Summary reports each provider's Recorder and Warehouse access status, configured endpoint counts for both channels, and map endpoint counts/status. Counts describe configured mappings, not live API endpoints or data already stored in the Warehouse.
- The mapping terminal's policy restricts its job to mapping provider keys/requests into the site's category/group system and grouping collection requests into manageable Recorder lists. It is not a general-purpose terminal for unrelated tasks.
- The terminal may suggest whether a response is structured/formatted or unstructured/unformatted, and suggest category, group, destination columns, and tags. Suggestions are reviewed and saved to that source's own mapping configuration.
- Source responses are mapped: source keys/searches map to the kind of data structure and destination warehouse column.
- The mapped format/structure is shown in Recorder for data configured to be recorded. Warehouse displays the format/structure for data that is already stored.
- Recorder consumes the source's saved request/mapping definitions for source-specific collection lists.
- Recorder shows per-item allowed data rates in a modal opened from each row's Rates cell, and a summary of selected instruments and captured rates. Its master rate checklist selects or clears all global rate defaults.
- Source Controller determines how mapped items are tagged and referenced in both Recorder and Warehouse.
- Source-specific lists are built using the shared Portfolio Maker-style list-building workflow and can be edited in the Recorder Registry.
- API keys must be handled as credentials in the account area's API Tools and must not be exposed or sent to a provider without an intentional, secure integration.

## Warehouse search and stored inventory

- Warehouse Summary is a drill-down viewer of data already recorded on the local machine, including Instrument and Reference data.
- Warehouse Summary is not a copy of Source Summary: it shows recorded inventory, stored formats, and collected date ranges, not provider request/key configuration.
- Filter by category and source, or select All data.
- Place the category, source, and tag-search controls directly above the Warehouse drill table.
- The search bar supports `#` include tags and `!#` exclude tags. Operators can switch repeatedly; separate tags with spaces or commas and use quotes for exact text phrases (for example `# stock option !# future # technology "Apple Inc."`).
- Every tag in the include group must match; no tag in the exclude group may match.
- Example: `# stock, option, technology !# future` searches for rows tagged stock, option, and technology while excluding rows tagged future.
- Each stored item can be opened through the drill tree to inspect its data.
- Warehouse drill tables include a checkbox at every level, including the source branch, with parent selection applying to all descendants. Data-item rows expose a read-only recording-frequency button at the far right; it opens a simple checklist of stored rates, while expanding the item shows stored date intervals directly without a separate sample-rate drill level. Rate changes are managed in Recorder, not Warehouse. Recorder keeps editable frequency choices in selectable rate cards and does not display Warehouse history intervals.
- Show stored availability beneath each sample rate as explicit `date1:date2` intervals, including for Spot instruments. Ranges may be non-contiguous; do not show individual observation dates as though they were sampling periods.
- Show the data format/structure for each item in the Warehouse table.
- Warehouse Controller is an ingester-agent terminal for preparing and validating ingestion tasks, not a standalone ingestion switch or refresh-cadence selector. Until connected to an actual ingester, interactions are local demo-only and must not imply that warehouse data was changed.

## Site navigation and profile context

These are surrounding Arcium workspace requirements that frame how the Datahub portal is reached and how shared tools are exposed:

- On the Arcium home/workspace screen, keep the workspace selector dropdown in the top-most navigation and place Portal Control beside it.
- Put the current account name and account links at the far top-left. Keep Log out at the bottom of the docked Portal Control panel.
- Dock Portal Control through transparent edge zones on the workspace canvas; do not use arrow position controls. Portal panes use translucent edge/center zones to indicate split or tab insertion.
- The Recorder Registry opens in its Sources first drill-table view by default; Lists first remains a selectable alternate view.
- The Recorder list creation table reuses the Portfolio Maker table controls: text/tag filtering, include/exclude filters, configurable columns, sortable headers, and drag-reorderable columns.
- The Portfolio Maker portfolio selector shares its toolbar row with Source and Search instruments.
- The Model Tracker is a searchable list maker for model objects only, with machine filtering, tag filters, configurable/reorderable columns, catalog and list tables, add/remove operations, named-list loading, list merging, and browser-local list storage.
- Profile, API Tools, and Agent requirements are specified in the next section.
- The Datahub portal is opened from the workspace and displays the Datahub-specific navigation and views described above.

## Profile menu, API Tools, and Agent selection

- The account menu belongs at the far top-left of the site navigation and displays the current username.
- Log out is placed at the bottom of the docked Portal Control panel.
- The profile menu includes a place for **API Tools**.
- The profile menu includes an **Agent** area with:
  - A dropdown to choose which agent to use.
  - An API-key field associated with the selected agent.
  - The currently selected agent remains active and is the agent that services the site's agent terminals.
- Agent choices, key handling, and terminal routing require secure credential storage and an actual agent-terminal integration; a UI-only setting must not be presented as a working connection.

## Requirements versus preview status

The requirements above describe the intended user experience. The present site is a static local demo: it has Datahub navigation, sample summary trees, tag query behavior, sample-rate/date-interval availability, option levels, recording selection and per-instrument frequency controls, source access switches, rainbow table colors, source mapping forms, and list-building interactions. The Source Mapping and Ingester Agent Terminals are local, constrained mocks; they are not connected to an agent or source API. Portfolio Maker uses only instrument examples already present in the Datahub sample catalog and does not invent market prices or pre-populated portfolios. Model Tracker uses a combined sample catalog of model objects and stores named lists in browser local storage. The account menu is a demo UI, not authenticated account management. Provider API connections, secure credential storage, agent routing, real recording jobs, and actual warehouse writes are not implemented.
