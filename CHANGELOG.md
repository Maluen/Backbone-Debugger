## v0.3.0

- Lazy loading of components and actions: instead of reading all of them at once and filtering on the panel, now only the requested items are loaded, moreover, filtering is done directly on the backbone agent. This makes the panel much more lighter and scalable for bigger applications (#23)

- Highlight the corresponding view element in the page when hovering on a view in the panel (like in DevTools Elements panel).
- Add Inspect view DOM element button.

- Add sorting by time for components and actions: order by "Oldest first" (useful for reconstructing the history) or "Newest first" (useful for checking what's happening right now).

- Add (partial) support for backbone apps defined into iframes (e.g. jsfiddle) (#24)
- Inject content script in all urls (even about:blank) (#24)

- Keep debug mode always running, even when url changes (as long as devtools is open when it changes) (#10)
- Add 'Stop debug mode' button under Options dropdown.

- Use MessageChannel for backboneAgent <-> contentScript communication instead that postMessage:
this creates a dedicated communication channel, removing conflicts that otherwise might arise with other libraries (e.g. facebook sdk).

- Show 'no results' message also when all the items are hidden (instead that blank list).

- Add reset search button also for actions.

- New backbone agent architecture: modularized components with models, collections, controllers and services (Server, DedicatedServer, Reader, Database).

- Clear panel ports on disconnect.

## v0.2.5

- Added instant free text search for filtering components and actions, with real time update in case components change.
- Use view selectors (e.g. li.done) as view names in panel, with real time update.
- New components navigation style.
- Break long words in panel to prevent overflow in case of long names, long urls, etc.
- Bugfix: Fix WatchJS bug (#14).
- Bugfix: Make hidden properties really hidden (#16).
- Optimization: better handling of backbone agent reports.
- Only show the view index in the Elements sidebar pane.

## v0.2

- Change the name of Panel and Elements sidebar pane to 'Backbone' (#12)
- Keep the debug mode running when the user refreshes the page while in that mode (#10)
- Don't reload the panel after 'fake updates', i.e. hash changes, push state, etc. This leads to much higher usability when interacting with the page while in debug mode.
- Smoother Panel startup for apps with many components
- Detect deletions of watched object properties, this allows for example to detect deletion of the last model of a collection
- Make Backbone AMD detection work when using implicit require (#11)
- Fix 'Times in Actions Table shown as NaN:NaN:NaN' bug (#6)

## v0.1.7

- Fix 'panel scrolling when selecting text' bug.
- Disable selection on nav & openAll/closeAll buttons.
- Fix scroll alignment bug on devtools resizing.
- Show the name of the attribute printed in console.
- Show the action name when printing the action data in console.
- Collects triggered event arguments and show them in console (as array) when clicking the event name in the panel.

## v0.1.5

- Action target replaced with contextual name link
- Make changing panel tab blazing fast (constant time)
- Panel UI doesn't slow down anymore when showing many new components.
- Defer AppComponentActions "backboneAgent:report" bindings to increase Panel UI smoothness.
- openAll/closeAll now also works when components are added during the process.